import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaUser, FaMobileAlt, FaEnvelope, FaVenusMars, FaHome, FaInfoCircle, FaLock, FaSignOutAlt } from "react-icons/fa";

function Profile() {
  const [form, setForm] = useState(JSON.parse(localStorage.getItem("user")) || {});
  const navigate = useNavigate();

  const handleUpdate = async () => {
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/profile/update", form);
      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Profile updated!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div style={formContainer}>
      <h2>Profile</h2>
      {Object.keys(form).map((key) => (
        <div key={key} style={inputWrapper}>
          <div style={iconStyle}>
            {key === "name" && <FaUser />}
            {key === "mobile" && <FaMobileAlt />}
            {key === "email" && <FaEnvelope />}
            {key === "password" && <FaLock />}
            {key === "gender" && <FaVenusMars />}
            {key === "address" && <FaHome />}
            {key === "details" && <FaInfoCircle />}
          </div>
          <input
            placeholder={key}
            value={form[key] || ""}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            style={inputStyle}
            disabled={key === "_id" || key === "createdAt" || key === "__v"}
          />
        </div>
      ))}
      <button onClick={handleUpdate} style={btnStyle}>Update Profile</button>
      <button onClick={handleLogout} style={logoutBtnStyle}>
        <FaSignOutAlt style={{ marginRight: "8px" }} /> Logout
      </button>
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
};

const inputWrapper = {
  display: "flex",
  alignItems: "center",
  width: "90%",
  margin: "10px auto",
  position: "relative",
};

const iconStyle = {
  position: "absolute",
  left: "10px",
  color: "#999",
};

const inputStyle = {
  width: "100%",
  padding: "10px 10px 10px 35px",
  margin: "10px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
};

const btnStyle = {
  width: "95%",
  padding: "10px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  margin: "15px 0",
};

const logoutBtnStyle = {
  width: "95%",
  padding: "10px",
  background: "#dc3545",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  margin: "10px 0",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

export default Profile;
