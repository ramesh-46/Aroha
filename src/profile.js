// src/profile.js
import React, { useState } from "react";
import axios from "axios";

function Profile() {
  const [form, setForm] = useState(JSON.parse(localStorage.getItem("user")) || {});

  const handleUpdate = async () => {
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/profile/update", form);
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Profile updated!");
      }
    } catch (err) { console.log(err); }
  };

  return (
    <div style={formContainer}>
      <h2>Profile</h2>
      {Object.keys(form).map(key => (
        <input key={key} placeholder={key} value={form[key] || ""} onChange={e => setForm({ ...form, [key]: e.target.value })} style={inputStyle} />
      ))}
      <button onClick={handleUpdate} style={btnStyle}>Update Profile</button>
    </div>
  );
}

const formContainer = { maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px", textAlign: "center" };
const inputStyle = { width: "90%", padding: "10px", margin: "10px 0", borderRadius: "5px", border: "1px solid #ccc" };
const btnStyle = { width: "95%", padding: "10px", background: "#333", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" };

export default Profile;
