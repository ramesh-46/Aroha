// src/signup.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", password: "", gender: "", address: "", details: "" });

  const handleSignup = async () => {
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/signup", form);
      if (res.data.success) {
        alert("Signup successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div style={formContainer}>
      <h2>Signup</h2>
      {Object.keys(form).map((key) => (
        <input
          key={key}
          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
          value={form[key]}
          onChange={e => setForm({ ...form, [key]: e.target.value })}
          style={inputStyle}
        />
      ))}
      <button onClick={handleSignup} style={btnStyle}>Signup</button>
      <Link to="/login" style={linkStyle}>Already have an account? Login</Link>
    </div>
  );
}

const formContainer = { maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px", textAlign: "center" };
const inputStyle = { width: "90%", padding: "10px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" };
const btnStyle = { width: "95%", padding: "10px", background: "#333", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };
const linkStyle = { display: "block", marginTop: "10px", textDecoration: "none", color: "#333" };

export default Signup;
