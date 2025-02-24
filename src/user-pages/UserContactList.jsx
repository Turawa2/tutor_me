import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient"; // Import the Supabase client
import "./contactList.css";

const UserContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]); // State to store contacts
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to handle errors
  const [user, setUser] = useState(null); // State to store the logged-in user

  // Fetch the logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser(); // Get the logged-in user
        if (error) {
          throw error;
        }
        setUser(user); // Set the logged-in user
      } catch (error) {
        setError(error.message);
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Fetch unique email addresses the user has chatted with
  const fetchContacts = async () => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      const { data, error } = await supabase
        .from("chats")
        .select("sender_email, receiver_email")
        .or(`sender_email.eq.${user.email},receiver_email.eq.${user.email}`); // Fetch chats involving the logged-in user

      if (error) {
        throw error;
      }

      // Extract unique email addresses
      const emails = [
        ...new Set(
          data.flatMap((chat) => [chat.sender_email, chat.receiver_email])
        ),
      ].filter((email) => email !== user.email); // Exclude the logged-in user's email

      setContacts(emails.map((email, index) => ({ id: index + 1, email }))); // Set the fetched contacts to state
    } catch (error) {
      setError(error.message);
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  // Fetch contacts when the component mounts or the user changes
  useEffect(() => {
    if (user) {
      fetchContacts();
    }
  }, [user]);

  // Handle clicking a contact
  const handleContactClick = (email) => {
    navigate(`/chat/${email}`); // Navigate to the chat interface with the selected email
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut(); // Log out the user
      if (error) {
        throw error;
      }
      navigate("/login"); // Redirect to the login page after logout
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
            {contact.email}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserContactList;