import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import "./chat.css";

const Chat = () => {
  const { email } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Fetch the logged-in user
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

  // Fetch chat messages from Supabase
  const fetchMessages = async () => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .or(
          `and(sender_email.eq.${user.email},receiver_email.eq.${email}),and(sender_email.eq.${email},receiver_email.eq.${user.email})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      setMessages(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages when the component mounts or the email changes
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, email]);

  // Enable real-time updates for new messages
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime_chat")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chats",
          filter: `or(and(sender_email.eq.${user.email},receiver_email.eq.${email}),and(sender_email.eq.${email},receiver_email.eq.${user.email}))`,
        },
        (payload) => {
          setMessages((prevMessages) => [...prevMessages, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, email]);

  // Handle sending a new message
  const handleSend = async () => {
    if (inputText.trim()) {
      try {
        if (!user) {
          throw new Error("User not logged in");
        }

        const { data, error } = await supabase
          .from("chats")
          .insert([
            {
              sender_email: user.email,
              receiver_email: email,
              message: inputText,
            },
          ]);

        if (error) {
          throw error;
        }

        setInputText("");
      } catch (error) {
        setError(error.message);
        console.error("Error sending message:", error);
      }
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">Error: {error}</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>Chatting with: {email}</span>
      </div>
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender_email === user?.email ? "sender" : "receiver"
            }`}
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

export default Chat;