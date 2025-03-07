import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient"; 
import "./contactList.css";

const UserContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 
  const [user, setUser] = useState(null); 

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(); 
        if (error) {
          throw error;
        }
        setUser(user);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  const fetchContacts = async () => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      // Fetch all chats involving the user
      const { data, error } = await supabase
        .from("chats")
        .select("sender_email, receiver_email, message, created_at")
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`); 

      if (error) {
        throw error;
      }

      // Extract unique emails and find the latest reminder for each contact
      const emails = [
        ...new Set(
          data.flatMap((chat) => [chat.sender_email, chat.receiver_email])
        ),
      ].filter((email) => email !== user.email); 

      // Calculate remaining time for each contact
      const contactsWithReminders = emails.map((email) => {
        const messages = data.filter(
          (chat) =>
            (chat.sender_email === email || chat.receiver_email === email) &&
            chat.message.includes("Date:") && // Check for "Date:" in the message
            chat.message.includes("Time:") // Check for "Time:" in the message
        );

        // Get the latest reminder message
        const latestReminder = messages.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];

        if (latestReminder) {
          // Extract date and time from the message
          const dateMatch = latestReminder.message.match(/Date: (\d{4}-\d{2}-\d{2})/);
          const timeMatch = latestReminder.message.match(/Time: (\d{2}:\d{2})/);

          if (dateMatch && timeMatch) {
            const reminderDateTime = new Date(`${dateMatch[1]}T${timeMatch[1]}`);
            const now = new Date();
            const remainingTime = reminderDateTime - now;

            // Calculate remaining days, hours, and minutes
            const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const remainingHours = Math.floor(
              (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const remainingMinutes = Math.floor(
              (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
            );

            return {
              id: email,
              email,
              reminder: latestReminder.message,
              remainingTime: {
                days: remainingDays,
                hours: remainingHours,
                minutes: remainingMinutes,
              },
            };
          }
        }

        return { id: email, email, reminder: null, remainingTime: null };
      });

      setContacts(contactsWithReminders);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  const handleContactClick = (email) => {
    navigate(`/chat/${email}`); 
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut(); 
      if (error) {
        throw error;
      }
      navigate("/login"); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">Error: {error}</div>;
  }

  return (
    <div className="contact-list-container">
      <div className="contact-list-header">
        <h2>Contacts</h2>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <div className="contact-list">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="contact-item"
            onClick={() => handleContactClick(contact.email)}
          >
            <div>{contact.email}</div>
            {contact.remainingTime && (
              <div className="reminder-time">
                Remaining time: {contact.remainingTime.days > 0 && `${contact.remainingTime.days}d `}
                {contact.remainingTime.hours > 0 && `${contact.remainingTime.hours}h `}
                {contact.remainingTime.minutes > 0 && `${contact.remainingTime.minutes}m`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserContactList;