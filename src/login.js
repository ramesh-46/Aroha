// src/login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Login() {
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!mobile || !password) {
      alert("Please enter both mobile and password");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post("https://aroha.onrender.com/auth/login", { mobile, password });

      console.log("Login response:", res.data);

      if (res?.data?.success) {
        // Optionally save user info
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        alert(res?.data?.message || "Login failed. Check your credentials.");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formContainer}>
      <h2>Login</h2>

      <input
        type="text"
        placeholder="Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
        style={inputStyle}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />

      <button onClick={handleLogin} style={btnStyle} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <Link to="/signup" style={linkStyle}>
        Don't have an account? Signup
      </Link>

      <p style={{ marginTop: "10px" }}>
        Or <span style={{ color: "blue", cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
          skip login
        </span> to go directly to Dashboard
      </p>
    </div>
  );
}

const formContainer = {
  maxWidth: "400px",
  margin: "50px auto",
  padding: "20px",
  border: "1px solid #ccc",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "90%",
  padding: "10px",
  margin: "10px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

const btnStyle = {
  width: "95%",
  padding: "10px",
  background: "#333",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

const linkStyle = {
  display: "block",
  marginTop: "10px",
  textDecoration: "none",
  color: "#333",
  fontWeight: "bold",
};

export default Login;
