import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ClipLoader } from "react-spinners";

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
      if (res?.data?.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/dashboard");
      } else {
        alert(res?.data?.message || "Login failed. Check your credentials.");
      }
    } catch (err) {
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
      <button onClick={handleLogin} style={loginBtnStyle} disabled={loading}>
        {loading ? <ClipLoader color="#fff" size={20} /> : "Login"}
      </button>
      <p style={signupText}>
        If you are a new customer,{" "}
        <button onClick={() => navigate("/signup")} style={signupBtnStyle}>
          create an account
        </button>
      </p>
      <button onClick={() => navigate("/dashboard")} style={skipBtnStyle}>
        Skip Login → Go to Search Dashboard
      </button>
    </div>
  );
}

const formContainer = {
  maxWidth: "500px",
  width: "90%",
  margin: "50px auto",
  padding: "30px",
  border: "1px solid #ccc",
  borderRadius: "10px",
  textAlign: "center",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
};

const inputStyle = {
  width: "90%",
  padding: "12px",
  margin: "15px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
  fontSize: "16px",
};

const loginBtnStyle = {
  width: "60%",
  padding: "12px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  margin: "15px 0",
  fontSize: "18px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const signupText = {
  margin: "10px 0",
  fontSize: "14px",
  color: "#555",
};

const signupBtnStyle = {
  padding: "7px 10px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "15px",
  marginLeft: "5px",
};

const skipBtnStyle = {
  background: "none",
  border: "none",
  color: "#003b7bff",
  textDecoration: "underline",
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "10px",
  padding: "5px",
};

export default Login;
