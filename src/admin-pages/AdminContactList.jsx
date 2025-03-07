import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import "../user-pages/contactList.css";

const AdminContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutor, setTutor] = useState(null);

  // Fetch tutor details
  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const tutorEmail = localStorage.getItem("tutorEmail");
        if (!tutorEmail) throw new Error("Tutor not logged in");

        const { data: tutorData, error: tutorError } = await supabase
          .from("tutors")
          .select("*")
          .eq("email", tutorEmail)
          .single();

        if (tutorError || !tutorData) throw new Error("Tutor not found");
        setTutor(tutorData);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching tutor:", error);
        navigate("/login");
      }
    };

    fetchTutor();
  }, [navigate]);

  // Fetch contacts and calculate remaining time
  const fetchContacts = async () => {
    try {
      if (!tutor) throw new Error("Tutor not logged in");
  
      // Fetch all chats involving the tutor
      const { data, error } = await supabase
        .from("chats")
        .select("sender_email, receiver_email, message, created_at")
        .or(`sender_email.eq.${tutor.email},receiver_email.eq.${tutor.email}`);
  
      if (error) throw error;
  
      console.log("Fetched chats:", data); // Log fetched chats
  
      // Extract unique emails and find the latest reminder for each contact
      const emails = [
        ...new Set(data.flatMap((chat) => [chat.sender_email, chat.receiver_email])),
      ].filter((email) => email !== tutor.email);
  
      // Calculate remaining time for each contact
      const contactsWithReminders = emails.map((email) => {
        const messages = data.filter(
          (chat) =>
            (chat.sender_email === email || chat.receiver_email === email) &&
            chat.message.includes("Date:") && // Check for "Date:" in the message
            chat.message.includes("Time:") // Check for "Time:" in the message
        );
  
        console.log("Messages for", email, ":", messages); // Log messages for each email
  
        // Get the latest reminder message
        const latestReminder = messages.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        )[0];
  
        if (latestReminder) {
          // Extract date and time from the message
          const dateMatch = latestReminder.message.match(/Date: (\d{4}-\d{2}-\d{2})/);
          const timeMatch = latestReminder.message.match(/Time: (\d{2}:\d{2})/);
  
          console.log("Date match:", dateMatch); // Log date match
          console.log("Time match:", timeMatch); // Log time match
  
          if (dateMatch && timeMatch) {
            const reminderDateTime = new Date(`${dateMatch[1]}T${timeMatch[1]}`);
            const now = new Date();
            const remainingTime = reminderDateTime - now;
  
            console.log("Reminder DateTime:", reminderDateTime); // Log reminder date and time
            console.log("Now:", now); // Log current time
            console.log("Remaining Time (ms):", remainingTime); // Log remaining time in milliseconds
  
            // Calculate remaining days, hours, and minutes
            const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const remainingHours = Math.floor(
              (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const remainingMinutes = Math.floor(
              (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
            );
  
            console.log("Remaining Days:", remainingDays); // Log remaining days
            console.log("Remaining Hours:", remainingHours); // Log remaining hours
            console.log("Remaining Minutes:", remainingMinutes); // Log remaining minutes
  
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
  
      console.log("Contacts with reminders:", contactsWithReminders); // Log final contacts
      setContacts(contactsWithReminders);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch contacts when tutor is available
  useEffect(() => {
    if (tutor) {
      fetchContacts();
    }
  }, [tutor]);

  // Update remaining time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts((prevContacts) =>
        prevContacts.map((contact) => {
          if (contact.reminder) {
            const dateMatch = contact.reminder.match(/\/date (\d{4}-\d{2}-\d{2})/);
            const timeMatch = contact.reminder.match(/\/time (\d{2}:\d{2})/);

            if (dateMatch && timeMatch) {
              const reminderDateTime = new Date(`${dateMatch[1]}T${timeMatch[1]}`);
              const now = new Date();
              const remainingTime = reminderDateTime - now;

              const remainingDays = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
              const remainingHours = Math.floor(
                (remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
              );
              const remainingMinutes = Math.floor(
                (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
              );

              return {
                ...contact,
                remainingTime: {
                  days: remainingDays,
                  hours: remainingHours,
                  minutes: remainingMinutes,
                },
              };
            }
          }
          return contact;
        })
      );
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Handle contact click
  const handleContactClick = (email) => {
    navigate(`/admin/chat/${email}`);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem("tutorEmail");
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
                {contact.remainingTime.days > 0 && `${contact.remainingTime.days}d `}
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

export default AdminContactList;
