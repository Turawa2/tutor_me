import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import { FaVideo } from "react-icons/fa"; // Import video icon
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

        const newMessage = {
          sender_email: user.email,
          receiver_email: email,
          message: inputText,
          created_at: new Date().toISOString(),
        };

        setMessages((prevMessages) => [...prevMessages, newMessage]);

        const { error } = await supabase
          .from("chats")
          .insert([newMessage]);

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

  // Handle video call booking
  const handleVideoCall = () => {
    window.open("https://meet.google.com", "_blank"); 
  };

  // Handle downloading the certificate image
  const handleDownloadCertificate = (imageUrl, studentName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Certificate_${studentName}.png`; // Set the file name
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
  };

  // Calculate remaining time for a reminder message
  const calculateRemainingTime = (message) => {
    if (message.includes("Date:") && message.includes("Time:")) {
      const dateMatch = message.match(/Date: (\d{4}-\d{2}-\d{2})/);
      const timeMatch = message.match(/Time: (\d{2}:\d{2})/);

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

        return `${remainingDays}d ${remainingHours}h ${remainingMinutes}m`;
      }
    }
    return null;
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
        {messages.map((message, index) => {
          const remainingTime = calculateRemainingTime(message.message);
          return (
            <div
              key={index}
              className={`message ${
                message.sender_email === user?.email ? "sender" : "receiver"
              }`}
            >
              {message.message.startsWith("data:image/png") ? (
                <img
                  src={message.message}
                  alt="Certificate"
                  style={{ maxWidth: "100%", height: "auto", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer" }}
                  onClick={() => {
                    const studentName = message.message.split("_")[1] || "Student"; // Extract student name if available
                    handleDownloadCertificate(message.message, studentName);
                  }}
                />
              ) : (
                <>
                  <div>{message.message}</div>
                  {remainingTime && (
                    <div className="reminder-time">
                      Remaining time: {remainingTime}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
        <button className="video-icon" onClick={handleVideoCall}>
          <FaVideo /> 
        </button>
      </div>
    </div>
  );
};

export default Chat;