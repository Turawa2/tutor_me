import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import "../user-pages/chat.css";

const AdminChat = () => {
  const { email } = useParams(); 
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutor, setTutor] = useState(null);

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
      }
    };

    fetchTutor();
  }, []);

  const fetchMessages = async () => {
    try {
      if (!tutor) return;

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_email.eq.${tutor.email},receiver_email.eq.${email}),and(sender_email.eq.${email},receiver_email.eq.${tutor.email})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;

      setMessages(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tutor) {
      fetchMessages();
    }
  }, [tutor, email]);

  useEffect(() => {
    if (!tutor) return;

    const channel = supabase
      .channel("realtime_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `receiver_email.eq.${email},sender_email.eq.${tutor.email}`,
        },
        (payload) => {
          console.log("New message received:", payload.new);
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tutor, email]);

  const handleSend = async () => {
    if (inputText.trim()) {
      try {
        if (!tutor) throw new Error("Tutor not logged in");

        const newMessage = {
          sender_email: tutor.email,
          receiver_email: email,
          message: inputText,
          created_at: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        const { error } = await supabase.from("chats").insert([newMessage]);
        if (error) throw error;

        setInputText("");
      } catch (error) {
        setError(error.message);
        console.error("Error sending message:", error);
      }
    }
  };

  if (loading) return <div className="text-center">Loading...</div>;
  if (error) return <div className="text-center text-danger">Error: {error}</div>;

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>Chatting with: {email}</span>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender_email === tutor?.email ? "sender" : "receiver"}`}
          >
            {message.message}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default AdminChat;
