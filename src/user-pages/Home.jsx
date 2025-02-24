import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa"; // Import like and dislike icons

function Home() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]); // All tutors fetched from Supabase
  const [filteredTutors, setFilteredTutors] = useState([]); // Tutors filtered by search term
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // State for search input
  const [user, setUser] = useState(null); // State to track the logged-in user

  // Fetch the logged-in user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          throw error;
        }
        setUser(user); // Set the logged-in user
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, []);

  // Fetch tutors data from Supabase
  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const { data, error } = await supabase
          .from("tutors")
          .select("*");

        if (error) {
          throw error;
        }

        setTutors(data); // Set all tutors
        setFilteredTutors(data); // Initialize filtered tutors with all tutors
      } catch (error) {
        setError(error.message);
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  // Handle search input change
  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase(); // Get the search term
    setSearchTerm(term);

    // Filter tutors by full_name or courses
    const filtered = tutors.filter(
      (tutor) =>
        tutor.full_name.toLowerCase().includes(term) ||
        tutor.courses.toLowerCase().includes(term)
    );

    setFilteredTutors(filtered); // Update the filtered tutors list
  };

  // Handle vote
  const handleVote = async (tutorEmail, voteType) => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      // Check if the user has already voted for this tutor
      const { data: existingVote, error: voteError } = await supabase
        .from("tutor_votes")
        .select("*")
        .eq("tutor_email", tutorEmail)
        .eq("user_id", user.id)
        .maybeSingle(); // ✅ Prevents error if no rows found

      if (voteError) {
        console.error("Vote error:", voteError);
        throw voteError;
      }

      // If the user is toggling their vote (clicking the same button again)
      if (existingVote && existingVote.vote_type === voteType) {
        // Remove the vote
        const { error: deleteError } = await supabase
          .from("tutor_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

        // Decrement the like or dislike count
        const { error: updateError } = await supabase
          .rpc("decrement_column", {
            table_name: "tutors",
            column_name: voteType === "like" ? "likes" : "dislikes",
            email_value: tutorEmail,
          });

        if (updateError) {
          throw updateError;
        }
      } else if (existingVote && existingVote.vote_type !== voteType) {
        // If the user is switching their vote (e.g., from like to dislike)
        // Remove the previous vote
        const { error: deleteError } = await supabase
          .from("tutor_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

        // Decrement the previous vote count
        const { error: decrementError } = await supabase
          .rpc("decrement_column", {
            table_name: "tutors",
            column_name: existingVote.vote_type === "like" ? "likes" : "dislikes",
            email_value: tutorEmail,
          });

        if (decrementError) {
          throw decrementError;
        }

        // Add the new vote
        const { error: insertError } = await supabase
          .from("tutor_votes")
          .insert([
            {
              tutor_email: tutorEmail,
              user_id: user.id,
              vote_type: voteType,
            },
          ]);

        if (insertError) {
          throw insertError;
        }

        // Increment the new vote count
        const { error: incrementError } = await supabase
          .rpc("increment_column", {
            table_name: "tutors",
            column_name: voteType === "like" ? "likes" : "dislikes",
            email_value: tutorEmail,
          });

        if (incrementError) {
          throw incrementError;
        }
      } else {
        // If the user is voting for the first time
        const { error: insertError } = await supabase
          .from("tutor_votes")
          .insert([
            {
              tutor_email: tutorEmail,
              user_id: user.id,
              vote_type: voteType,
            },
          ]);

        if (insertError) {
          throw insertError;
        }

        // Increment the like or dislike count
        const { error: updateError } = await supabase
          .rpc("increment_column", {
            table_name: "tutors",
            column_name: voteType === "like" ? "likes" : "dislikes",
            email_value: tutorEmail,
          });

        if (updateError) {
          throw updateError;
        }
      }

      // Refresh the tutors list
      const { data: updatedTutors, error: fetchError } = await supabase
        .from("tutors")
        .select("*");

      if (fetchError) {
        throw fetchError;
      }

      // Sort tutors by rating (likes - dislikes) in descending order
      const sortedTutors = updatedTutors.sort((a, b) => (b.likes - b.dislikes) - (a.likes - a.dislikes));

      setTutors(sortedTutors);
      setFilteredTutors(sortedTutors); // Update the filtered list as well
    } catch (error) {
      console.error("Error handling vote:", error);
    }
  };

  const handleReg = () => {
    navigate("/registerTutor");
  };

  const handleMsg = () => {
    navigate("/msgList");
  };

  const handleChat = (email) => {
    navigate(`/chat/${email}`);
  };

  const handleAuth = async () => {
    if (user) {
      // If user is logged in, log them out
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        setUser(null); // Clear the user state
        navigate("/login"); // Redirect to login page
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else {
      // If user is not logged in, redirect to login page
      navigate("/login");
    }
  };

  if (loading) {
    return <div className="text-center text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-danger">Error: {error}</div>;
  }

  return (
    <div className="about-us bg-gray-200">
      <nav className="navbar navbar-expand-lg position-absolute top-0 z-index-3 w-100 shadow-none my-3 navbar-transparent">
        <div className="container">
          <a
            className="navbar-brand text-white"
            href="/"
            rel="tooltip"
            title="Designed and Coded by Creative Tim"
            data-placement="bottom"
            target="_blank"
          >
            2Tor_Me
          </a>
          <button className="btn btn-danger ms-auto" onClick={handleAuth}>
            {user ? "Logout" : "Login"} {/* Change button text based on user state */}
          </button> &ensp;
          <button className="btn btn-info" onClick={handleMsg}>
            Chats
          </button>
        </div>
      </nav>

      <header className="bg-gradient-dark">
        <div
          className="page-header min-vh-75"
          style={{ backgroundImage: "url('../assets/img/home_pic.jpg')" }}
        >
          <span className="mask bg-gradient-dark opacity-6"></span>
          <div className="container">
            <div className="row justify-content-center">
              <div className="col-lg-8 text-center mx-auto my-auto">
                <h1 className="text-white">Find Your Perfect Tutor Today!</h1>
                <p className="lead mb-4 text-white opacity-8">
                  Welcome to 2Tor_Me: Where Students Meet Their Perfect Tutors
                </p>
                <button type="submit" className="btn bg-white text-dark" onClick={handleReg}>
                  Be a Tutor
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="card card-body shadow-xl mx-3 mx-md-4 mt-n6">
        <section className="pb-5 position-relative bg-gradient-dark mx-n3">
          <div className="container">
            <div className="row">
              <div className="col-md-8 text-start mb-5 mt-5">
                <h3 className="text-white z-index-1 position-relative">
                  Search by course or tutor name
                </h3>
                <div className="input-group input-group-outline my-3">
                  <input
                    type="text"
                    className="form-control text-white"
                    placeholder="Search......"
                    value={searchTerm}
                    onChange={handleSearch} // Handle search input change
                  />
                </div>
              </div>
            </div>
            <div className="row">
              {filteredTutors.map((tutor) => (
                <div className="col-lg-6 col-12" key={tutor.id}>
                  <div className="card card-profile mt-4">
                    <div className="row">
                      <div className="col-lg-4 col-md-6 col-12 mt-n5">
                        <div className="p-3 pe-md-0">
                          <img
                            className="w-100 border-radius-md shadow-lg"
                            src={tutor.profile_image || "../assets/img/team-5.jpg"}
                            alt={tutor.full_name}
                          />
                        </div>
                      </div>
                      <div className="col-lg-8 col-md-6 col-12 my-auto">
                        <div className="card-body ps-lg-0">
                          <h5 className="mb-0">{tutor.courses}</h5>
                          <h6 className="text-info">{tutor.full_name}</h6>
                          <h5 className="mb-0 text-success">
                            {tutor.qualification}
                          </h5>
                          <p className="mb-0">{tutor.email}</p>
                          <span
                            style={{ cursor: "pointer" }}
                            onClick={() => handleVote(tutor.email, "like")}
                          >
                            <FaThumbsUp className="text-success" /> {tutor.likes}
                          </span>
                          &ensp;
                          <span
                            style={{ cursor: "pointer" }}
                            onClick={() => handleVote(tutor.email, "dislike")}
                          >
                            <FaThumbsDown className="text-danger" /> {tutor.dislikes}
                          </span>
                          &ensp;
                          <span
                            style={{ cursor: "pointer" }}
                            onClick={() => handleChat(tutor.email)}
                          >
                            💬
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <br />
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Home;