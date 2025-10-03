import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import {
  FaUser,
  FaMobileAlt,
  FaEnvelope,
  FaVenusMars,
  FaHome,
  FaInfoCircle,
  FaLock,
} from "react-icons/fa";

function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    gender: "",
    address: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);
    try {
      const res = await axios.post("https://aroha.onrender.com/auth/signup", form);
      if (res.data.success) {
        alert("Signup successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={formContainer}>
      <h2>Signup</h2>
      <div style={inputWrapper}>
        <FaUser style={iconStyle} />
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={inputWrapper}>
        <FaMobileAlt style={iconStyle} />
        <input
          placeholder="Mobile"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={inputWrapper}>
        <FaEnvelope style={iconStyle} />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={inputWrapper}>
        <FaLock style={iconStyle} />
        <input
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={inputWrapper}>
        <FaVenusMars style={iconStyle} />
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          style={selectStyle}
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div style={inputWrapper}>
        <FaHome style={iconStyle} />
        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          style={inputStyle}
        />
      </div>
      <div style={inputWrapper}>
        <FaInfoCircle style={iconStyle} />
        <input
          placeholder="Details"
          value={form.details}
          onChange={(e) => setForm({ ...form, details: e.target.value })}
          style={inputStyle}
        />
      </div>
      <button onClick={handleSignup} style={btnStyle} disabled={loading}>
        {loading ? <ClipLoader color="#fff" size={20} /> : "Signup"}
      </button>
      <p style={loginText}>
        Already have an account?{" "}
        <button onClick={() => navigate("/login")} style={loginBtnStyle}>
          Login
        </button>
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

const selectStyle = {
  width: "100%",
  padding: "10px 10px 10px 35px",
  margin: "10px 0",
  borderRadius: "5px",
  border: "1px solid #ccc",
  background: "#fff",
  cursor: "pointer",
};

const btnStyle = {
  width: "95%",
  padding: "10px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  margin: "10px 0",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const loginText = {
  margin: "10px 0",
  fontSize: "14px",
  color: "#555",
};

const loginBtnStyle = {
  padding: "5px 10px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "3px",
  cursor: "pointer",
  fontSize: "14px",
  marginLeft: "5px",
};

export default Signup;
