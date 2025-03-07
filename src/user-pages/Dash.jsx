import React, { useEffect, useState } from "react";
import supabase from "../Link/SupaBaseClient";
import "./Dash.css"; 

const Dash = () => {
  const [certificates, setCertificates] = useState([]);
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

  // Fetch certificates for the student
  const fetchCertificates = async () => {
    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      // Fetch all messages where the student is the receiver and the message is a certificate
      const { data, error } = await supabase
        .from("chats")
        .select("*")
        .eq("receiver_email", user.email) // Only fetch messages sent to the student
        .like("message", "data:image/png%"); // Only fetch certificate messages

      if (error) {
        throw error;
      }

      setCertificates(data);
    } catch (error) {
      setError(error.message);
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCertificates();
    }
  }, [user]);

  // Handle downloading the certificate image
  const handleDownloadCertificate = (imageUrl, certificateName) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `Certificate_${certificateName}.png`; // Set the file name
    document.body.appendChild(link);
    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">Error: {error}</div>;
  }

  return (
    <div className="dash-container">
      <h2>Your Certificates</h2>
      <div className="certificate-grid">
        {certificates.map((certificate, index) => (
          <div
            key={index}
            className="certificate-item"
            onClick={() => {
              const certificateName = `Certificate_${index + 1}`;
              handleDownloadCertificate(certificate.message, certificateName);
            }}
          >
            <img
              src={certificate.message}
              alt={`Certificate ${index + 1}`}
              className="certificate-image"
            />
            <div className="certificate-info">
              <p>Issued by: {certificate.sender_email}</p>
              <p>Date: {new Date(certificate.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dash;