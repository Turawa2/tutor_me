import React, { useState } from "react";
import supabase from "../Link/SupaBaseClient";
import { useNavigate } from "react-router-dom";



function RegisterUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleUserLogin = () => {
    navigate("/login");
  }

  const handleTutorLogin = () => {
    navigate("/Tlogin");
  }
 

  const handleRegister = async (e) => {
    e.preventDefault(); // Prevent form submission
  
    setLoading(true);
    setError(null);
    setSuccess(false);
  
    console.log("Attempting to register with:", { email, password });
  
    try {
      // Use Supabase's signUp method to register the user
      const { user, error } = await supabase.auth.signUp({
        email,
        password,
      });
  
      console.log("Supabase response:", { user, error });
  
      if (error) {
        throw error;
      }
  
      // If registration is successful
      setSuccess(true);
      console.log("User registered:", user);
    } catch (error) {
      setError(error.message);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-basic">
      <div
        className="page-header align-items-start min-vh-100"
        style={{ backgroundImage: "url('../assets/img/home_pic.jpg')" }}
        loading="lazy"
      >
        <span className="mask bg-gradient-dark opacity-6"></span>
        <div className="container my-auto">
          <div className="row">
            <div className="col-lg-4 col-md-8 col-12 mx-auto">
              <div className="card z-index-0 fadeIn3 fadeInBottom">
                <div className="card-header p-0 position-relative mt-n4 mx-3 z-index-2">
                  <div className="bg-gradient-primary shadow-primary border-radius-lg py-3 pe-1">
                    <h4 className="text-white font-weight-bolder text-center mt-2 mb-0">
                      Register
                    </h4>
                    <div className="row mt-3">
                      <div className="col-2 text-center ms-auto">
                        <a className="btn btn-link px-3" href="javascript:;">
                          <i className="fa fa-facebook text-white text-lg"></i>
                        </a>
                      </div>
                      <div className="col-2 text-center px-1">
                        <a className="btn btn-link px-3" href="javascript:;">
                          <i className="fa fa-github text-white text-lg"></i>
                        </a>
                      </div>
                      <div className="col-2 text-center me-auto">
                        <a className="btn btn-link px-3" href="javascript:;">
                          <i className="fa fa-google text-white text-lg"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <form role="form" className="text-start" onSubmit={handleRegister}>
                    <div className="input-group input-group-outline mb-3">
                     
                      <input
                        type="email"
                        className="form-control"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        
                      />
                    </div>
                    <div className="input-group input-group-outline mb-3">
                    
                      <input
                        type="password"
                        className="form-control"
                        placeholder="******"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn bg-gradient-primary w-100 my-4 mb-2"
                        disabled={loading}
                      >
                        {loading ? "Registering..." : "Register"}
                      </button>
                    </div>
                    {error && (
                      <p className="text-danger text-center">{error}</p>
                    )}
                    {success && (
                      <p className="text-success text-center">
                        Registration successful!
                      </p>
                    )}
                    <p className="mt-4 text-sm text-center">
                      Already have an Account? Login with
                      <a  onClick={handleUserLogin} className="text-primary text-gradient font-weight-bold">
                        {" "}
                        User
                      </a>
                      <a onClick={handleTutorLogin} className="text-primary text-gradient font-weight-bold">
                        {" "}
                        Tutor
                      </a>
                    </p>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterUser;