import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import supabase from "../Link/SupaBaseClient";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUserReg = () => {
    navigate("/register")
  }

  const handleTutorLogin = () => {
    navigate("/registerTutor")
  }

  const handleLogin = async (e) => {

   
    e.preventDefault(); 

    setLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError; 
      }

      console.log("User logged in:", authData.user);
      navigate("/"); 
    } catch (error) {
      if (error.message === "Invalid login credentials") {
        setError("Invalid email or password.");
      } else {
        setError("An error occurred. Please try again.");
      }
      console.error("Login error:", error);
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
                     User Login
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
                  <form role="form" className="text-start" onSubmit={handleLogin}>
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
                    <div className="form-check form-switch d-flex align-items-center mb-3">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                      />
                      <label
                        className="form-check-label mb-0 ms-2"
                        htmlFor="rememberMe"
                      >
                        Remember me
                      </label>
                    </div>
                    <div className="text-center">
                      <button
                        type="submit"
                        className="btn bg-gradient-primary w-100 my-4 mb-2"
                        disabled={loading}
                      >
                        {loading ? "Logging in..." : "Login"}
                      </button>
                    </div>
                    {error && (
                      <p className="text-danger text-center">
                        {error}{" "}
                        {error === "Invalid email or password." && (
                          <a href="/register" className="text-primary">
                            Sign up
                          </a>
                        )}
                      </p>
                    )}
                    <p className="mt-4 text-sm text-center">
                      Don't have an account? Sign Up {" "}
                      <a
                       onClick={handleUserReg}
                        className="text-primary text-gradient font-weight-bold cursor-pointer"
                      >
                        User,
                      </a> 
                      <a
                        onClick={handleTutorLogin}
                        className="text-primary text-gradient font-weight-bold cursor-pointer"
                      >
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

export default Login;