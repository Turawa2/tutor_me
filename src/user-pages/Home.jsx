import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa"; 

function Home() {
  const navigate = useNavigate();
  const [tutors, setTutors] = useState([]); 
  const [filteredTutors, setFilteredTutors] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); 
  const [user, setUser] = useState(null); 

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

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const { data, error } = await supabase
          .from("tutors")
          .select("*");

        if (error) {
          throw error;
        }

        setTutors(data); 
        setFilteredTutors(data);
      } catch (error) {
        setError(error.message);
        console.error("Error fetching tutors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTutors();
  }, []);

  const handleSearch = (event) => {
    const term = event.target.value.toLowerCase(); 
    setSearchTerm(term);

    const filtered = tutors.filter(
      (tutor) =>
        tutor.full_name.toLowerCase().includes(term) ||
        tutor.courses.toLowerCase().includes(term)
    );

    setFilteredTutors(filtered); 
  };

  // Handle vote
  const handleVote = async (tutorEmail, voteType) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      const { data: existingVote, error: voteError } = await supabase
        .from("tutor_votes")
        .select("*")
        .eq("tutor_email", tutorEmail)
        .eq("user_id", user.id)
        .maybeSingle(); 

      if (voteError) {
        console.error("Vote error:", voteError);
        throw voteError;
      }

      if (existingVote && existingVote.vote_type === voteType) {
        // Remove the vote
        const { error: deleteError } = await supabase
          .from("tutor_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

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
       
        const { error: deleteError } = await supabase
          .from("tutor_votes")
          .delete()
          .eq("id", existingVote.id);

        if (deleteError) {
          throw deleteError;
        }

        const { error: decrementError } = await supabase
          .rpc("decrement_column", {
            table_name: "tutors",
            column_name: existingVote.vote_type === "like" ? "likes" : "dislikes",
            email_value: tutorEmail,
          });

        if (decrementError) {
          throw decrementError;
        }

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

      const { data: updatedTutors, error: fetchError } = await supabase
        .from("tutors")
        .select("*");

      if (fetchError) {
        throw fetchError;
      }

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

  const handleDash = () => {
    navigate("/dash");
  };


  const handleGame = () => {
    window.open("https://www.educationalgames.com", "_blank");
  };

  const handleLibrary = () => {
    window.open("https://www.openlibrary.org", "_blank");
  };

  const handleQuiez = () => {
    window.open("https://www.quizlet.com", "_blank");
  };


  const handleChat = (email) => {
    navigate(`/chat/${email}`);
  };

  const handleAuth = async () => {
    if (user) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
        setUser(null); 
        navigate("/login");
      } catch (error) {
        console.error("Error logging out:", error);
      }
    } else {
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
          <button class="navbar-toggler shadow-none ms-2" type="button" 
          data-bs-toggle="collapse" data-bs-target="#navigation"
           aria-controls="navigation" aria-expanded="false"
            aria-label="Toggle navigation">

      <span class="navbar-toggler-icon mt-2">
        <span class="navbar-toggler-bar bar1"></span>
        <span class="navbar-toggler-bar bar2"></span>
        <span class="navbar-toggler-bar bar3"></span>
      </span>
    </button>
          <div class="collapse navbar-collapse w-100 pt-3 pb-2 py-lg-0 ms-lg-12 ps-lg-5" id="navigation">
           <ul class="navbar-nav navbar-nav-hover ms-auto">
        <li class="nav-item dropdown dropdown-hover mx-2 ms-lg-6">
     
        <li class="nav-item my-auto ms-3 ms-lg-0">
        <a  class="btn btn-sm  bg-success text-light mb-0 me-1 mt-2 mt-md-0"  onClick={handleDash} >
             Dashboard
           </a>

           <a  class="btn btn-sm  bg-secondary text-light  mb-0 me-1 mt-2 mt-md-0"  onClick={handleLibrary} >
             Library
           </a>

           <a  class="btn btn-sm  bg-primary text-light mb-0 me-1 mt-2 mt-md-0"  onClick={handleGame} >
             Games
           </a>

           <a  class="btn btn-sm  bg-primary text-light mb-0 me-1 mt-2 mt-md-0"  onClick={handleQuiez} >
             Quiez
           </a>

           <a  class="btn btn-sm  bg-dark text-light mb-0 me-1 mt-2 mt-md-0" onClick={handleMsg} >
             Chats
           </a>


          <a  class="btn btn-sm  bg-danger text-light mb-0 me-1 mt-2 mt-md-0"  onClick={handleAuth} >
          {user ? "Logout" : "Login"} 
           </a>

        
           
        </li>

        
        </li>
      </ul>
    </div>

          {/* 
          <button className="btn btn-info" onClick={handleMsg}>
            Chats
          </button> &ensp;
          <button className="btn btn-info" onClick={handleMsg}>
            Games
          </button> &ensp;

          <button className="btn btn-info" onClick={handleMsg}>
            Library
          </button> &ensp;

          <button className="btn btn-info" >
            Dashboard
          </button> */}
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
                    onChange={handleSearch} 
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