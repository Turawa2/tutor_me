import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient"; // Import the Supabase client
import "../user-pages/contactList.css";

const AdminContactList = () => {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]); // State to store contacts
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to handle errors
  const [tutor, setTutor] = useState(null); // State to store the logged-in tutor

  // Fetch the logged-in tutor from local storage
  useEffect(() => {
    const fetchTutor = async () => {
      try {
        // Get the logged-in tutor's email from local storage
        const tutorEmail = localStorage.getItem("tutorEmail");

        if (!tutorEmail) {
          throw new Error("Tutor not logged in");
        }

        // Fetch the tutor's details from the `tutors` table
        const { data: tutorData, error: tutorError } = await supabase
          .from("tutors")
          .select("*")
          .eq("email", tutorEmail) // Match the tutor's email
          .single();

        if (tutorError || !tutorData) {
          throw new Error("Tutor not found");
        }

        setTutor(tutorData); // Set the logged-in tutor
      } catch (error) {
        setError(error.message);
        console.error("Error fetching tutor:", error);
        navigate("/login"); // Redirect to the login page if there's an error
      }
    };

    fetchTutor();
  }, [navigate]);

  // Fetch unique email addresses the tutor has chatted with
  const fetchContacts = async () => {
    try {
      if (!tutor) {
        throw new Error("Tutor not logged in");
      }

      // Fetch chats where the logged-in tutor is either the sender or receiver
      const { data, error } = await supabase
        .from("chats")
        .select("sender_email, receiver_email")
        .or(`sender_email.eq.${tutor.email},receiver_email.eq.${tutor.email}`); // Fetch chats involving the logged-in tutor

      if (error) {
        throw error;
      }

      // Extract unique email addresses of users who chatted with the tutor
      const emails = [
        ...new Set(
          data.flatMap((chat) => [chat.sender_email, chat.receiver_email])
        ),
      ].filter((email) => email !== tutor.email); // Exclude the logged-in tutor's email

      setContacts(emails.map((email, index) => ({ id: index + 1, email }))); // Set the fetched contacts to state
    } catch (error) {
      setError(error.message);
      console.error("Error fetching contacts:", error);
    } finally {
      setLoading(false); // Set loading to false after fetching
    }
  };

  // Fetch contacts when the component mounts or the tutor changes
  useEffect(() => {
    if (tutor) {
      fetchContacts();
    }
  }, [tutor]);

  // Handle clicking a contact
  const handleContactClick = (email) => {
    navigate(`/admin/chat/${email}`); // Navigate to the correct path
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Clear the logged-in tutor's email from local storage
      localStorage.removeItem("tutorEmail");
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

export default AdminContactList;