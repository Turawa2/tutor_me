import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import "../user-pages/chat.css";
import { FaVideo } from "react-icons/fa";
import html2canvas from "html2canvas";

const AdminChat = () => {
  const { email } = useParams();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutor, setTutor] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const certificateRef = useRef(null); // Ref for the certificate element

  useEffect(() => {
    const fetchTutor = async () => {
      try {
        const tutorEmail = localStorage.getItem("tutorEmail");
        if (!tutorEmail) throw new Error("Tutor not logged in");

        const { data: tutorData, error: tutorError } = await supabase
          .from("tutors")
          .select("full_name, courses, email") // Fetch full_name and courses
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

        // Check if the message is "/stop"
        if (inputText.trim() === "/stop") {
          // Send a confirmation message
          const confirmationMessage = {
            sender_email: tutor.email,
            receiver_email: email,
            message: "Booking canceled.",
            created_at: new Date().toISOString(),
          };

          // Add the confirmation message to the chat
          setMessages((prevMessages) => [...prevMessages, confirmationMessage]);

          // Insert the confirmation message into the database
          const { error } = await supabase.from("chats").insert([confirmationMessage]);
          if (error) throw error;

          // Clear the input
          setInputText("");
          return;
        }

        // Check if the message is "/certificate"
        if (inputText.startsWith("/certificate")) {
          const studentName = inputText.replace("/certificate", "").trim();
          if (!studentName) {
            throw new Error("Please provide a student name.");
          }

          // Generate the certificate
          const certificateImage = await generateCertificate(studentName);

          // Send the certificate as a message
          const certificateMessage = {
            sender_email: tutor.email,
            receiver_email: email,
            message: certificateImage, // Send the image as a data URL
            created_at: new Date().toISOString(),
          };

          // Add the certificate message to the chat
          setMessages((prevMessages) => [...prevMessages, certificateMessage]);

          // Insert the certificate message into the database
          const { error } = await supabase.from("chats").insert([certificateMessage]);
          if (error) throw error;

          // Clear the input
          setInputText("");
          return;
        }

        // Handle normal messages
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
        setShowDatePicker(false);
        setShowTimePicker(false);
      } catch (error) {
        setError(error.message);
        console.error("Error sending message:", error);
      }
    }
  };

  const generateCertificate = async (studentName) => {
    // Create a certificate template
    const certificateHTML = `
      <div style="text-align: center; padding: 20px; border: 2px solid #000; width: 600px; background-color: #f9f9f9;">
        <h1 style="font-size: 32px; color: #007bff;">Certificate of Completion</h1>
        <p style="font-size: 24px; margin-top: 20px;">
          This is to certify that <strong>${studentName}</strong> has successfully completed the course:
        </p>
        <p style="font-size: 28px; color: #28a745; margin-top: 10px;">
          <strong>${tutor.courses}</strong> <!-- Use tutor.courses -->
        </p>
        <p style="font-size: 20px; margin-top: 20px;">
          Awarded by: <strong>${tutor.full_name}</strong> <!-- Use tutor.full_name -->
        </p>
        <p style="font-size: 16px; margin-top: 20px; color: #666;">
          Date: ${new Date().toLocaleDateString()}
        </p>
      </div>
    `;

    // Render the certificate HTML
    const certificateElement = document.createElement("div");
    certificateElement.innerHTML = certificateHTML;
    document.body.appendChild(certificateElement);

    // Generate the certificate as an image
    const canvas = await html2canvas(certificateElement);
    const image = canvas.toDataURL("image/png");

    // Clean up the temporary element
    document.body.removeChild(certificateElement);

    return image;
  };

  const handleDownloadCertificate = (imageUrl, studentName) => {
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Certificate_${studentName}.png`; // Set the file name
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
  };

  const handleVideoCall = () => {
    window.open("https://meet.google.com", "_blank");
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    if (text.endsWith("/date")) {
      setShowDatePicker(true);
      setShowTimePicker(false);
    } else if (text.endsWith("/time")) {
      setShowTimePicker(true);
      setShowDatePicker(false);
    } else {
      setShowDatePicker(false);
      setShowTimePicker(false);
    }
  };

  const handleDateSelect = (e) => {
    const date = e.target.value;
    setInputText(inputText.replace("/date", `Date: ${date}`));
    setShowDatePicker(false);
  };

  const handleTimeSelect = (e) => {
    const time = e.target.value;
    setInputText(inputText.replace("/time", `Time: ${time}`));
    setShowTimePicker(false);
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
            className={`message ${
              message.sender_email === tutor?.email ? "sender" : "receiver"
            }`}
          >
            {message.message.startsWith("data:image/png") ? (
              <img
                src={message.message}
                alt="Certificate"
                style={{ maxWidth: "100%", height: "auto", border: "1px solid #ccc", borderRadius: "5px", cursor: "pointer" }}
                onClick={() => {
                  const studentName = message.message.split("_")[1] || "Student";
                  handleDownloadCertificate(message.message, studentName);
                }}
              />
            ) : (
              message.message
            )}
          </div>
        ))}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
        <button className="video-icon" onClick={handleVideoCall}>
          <FaVideo />
        </button>
      </div>
      {(showDatePicker || showTimePicker) && (
        <div className="picker-container">
          {showDatePicker && (
            <input
              type="date"
              onChange={handleDateSelect}
            />
          )}
          {showTimePicker && (
            <input
              type="time"
              onChange={handleTimeSelect}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default AdminChat;