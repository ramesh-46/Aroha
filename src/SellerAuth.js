import React, { useState } from "react";
import axios from "axios";
import { ClipLoader } from "react-spinners";
import { useNavigate } from "react-router-dom"; // Import navigate

function SellerAuth() {
  const [tab, setTab] = useState("login"); // login / signup / reset
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate(); // Initialize navigate

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = (fields) => {
    const newErrors = {};
    fields.forEach((f) => {
      if (!form[f]) newErrors[f] = "This field is required";
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async () => {
    const required = [
      "name",
      "mobile",
      "email",
      "password",
      "recoveryCode",
      "gstNumber",
      "address",
      "companyName",
      "contactNumber",
    ];
    if (!validate(required)) return;

    setLoading(true);
    try {
      // const res = await axios.post("https://aroha.onrender.com/seller/seller-signup", form);
      const res = await axios.post("https://aroha.onrender.com/seller/seller-signup", form);
      if (res.data.success) {
        setMessage("Signup successful! Please login.");
        setTab("login");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

 const handleLogin = async () => {
  if (!validate(["mobile", "password"])) return;

  setLoading(true);
  try {
    const res = await axios.post("https://aroha.onrender.com/seller/seller-login", form);
    if (res.data.success) {
      setMessage("Login successful!");

      // Store full seller data + token in localStorage
      localStorage.setItem("sellerData", JSON.stringify(res.data.seller));
      localStorage.setItem("sellerToken", res.data.token);

      // Navigate to admin page after login
      navigate("/AdminDashboard");
    }
  } catch (err) {
    setMessage(err.response?.data?.message || "Login failed");
  } finally {
    setLoading(false);
  }
};


  const handleReset = async () => {
    if (!validate(["mobile", "email", "recoveryCode"])) return;

    setLoading(true);
    try {
      const res = await axios.post("https://aroha.onrender.com/seller/seller-reset", form);
      if (res.data.verified && !form.newPassword) {
        setMessage(res.data.message);
      } else if (res.data.updated) {
        setMessage(res.data.message);
        setTab("login");
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const renderError = (field) =>
    errors[field] ? <p style={{ color: "red", fontSize: "12px" }}>{errors[field]}</p> : null;

  return (
    <div style={container}>
      <h2>Seller {tab.charAt(0).toUpperCase() + tab.slice(1)}</h2>

      <div style={tabNav}>
        <button onClick={() => setTab("login")} style={tabButton(tab === "login")}>
          Login
        </button>
        <button onClick={() => setTab("signup")} style={tabButton(tab === "signup")}>
          Signup
        </button>
        {/* <button onClick={() => setTab("reset")} style={tabButton(tab === "reset")}>
          Reset Password
        </button> */}
      </div>

      {message && <p style={{ color: "green" }}>{message}</p>}

      {tab === "signup" && (
        <>
          {["name", "mobile", "email", "password", "recoveryCode", "gstNumber", "address", "companyName", "contactNumber"].map((f) => (
            <div key={f} style={{ marginBottom: "10px" }}>
              <input
                type={f === "password" ? "password" : "text"}
                name={f}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={form[f] || ""}
                onChange={handleChange}
                style={inputStyle}
              />
              {renderError(f)}
            </div>
          ))}
          <button onClick={handleSignup} style={btnStyle}>
            {loading ? <ClipLoader color="#fff" size={20} /> : "Signup"}
          </button>
        </>
      )}

      {tab === "login" && (
        <>
          {["mobile", "password"].map((f) => (
            <div key={f} style={{ marginBottom: "10px" }}>
              <input
                type={f === "password" ? "password" : "text"}
                name={f}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={form[f] || ""}
                onChange={handleChange}
                style={inputStyle}
              />
              {renderError(f)}
            </div>
          ))}
          <button onClick={handleLogin} style={btnStyle}>
            {loading ? <ClipLoader color="#fff" size={20} /> : "Login"}
          </button>
        </>
      )}

      {tab === "reset" && (
        <>
          {["mobile", "email", "recoveryCode", "newPassword"].map((f) => (
            <div key={f} style={{ marginBottom: "10px" }}>
              <input
                type={f === "newPassword" ? "password" : "text"}
                name={f}
                placeholder={f === "newPassword" ? "New Password" : f.charAt(0).toUpperCase() + f.slice(1)}
                value={form[f] || ""}
                onChange={handleChange}
                style={inputStyle}
              />
              {renderError(f)}
            </div>
          ))}
          <button onClick={handleReset} style={btnStyle}>
            {loading ? <ClipLoader color="#fff" size={20} /> : "Reset Password"}
          </button>
        </>
      )}
    </div>
  );
}

// ===== STYLES =====
const container = {
  maxWidth: "500px",
  margin: "50px auto",
  padding: "20px",
  border: "1px solid #ccc",
  borderRadius: "12px",
  textAlign: "center",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const btnStyle = {
  width: "100%",
  padding: "12px",
  background: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  marginTop: "10px",
};

const tabNav = { display: "flex", justifyContent: "space-between", marginBottom: "20px" };
const tabButton = (active) => ({
  flex: 1,
  padding: "10px",
  cursor: "pointer",
  background: active ? "#000" : "#fff",
  color: active ? "#fff" : "#000",
  border: "1px solid #000",
});

export default SellerAuth;
