import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function SellerProfile() {
  const [seller, setSeller] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedSeller = localStorage.getItem("sellerData");
    if (storedSeller) {
      setSeller(JSON.parse(storedSeller));
    } else {
      // If no seller data, redirect to login
      navigate("/SellerAuth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("sellerData");
    localStorage.removeItem("sellerToken");
    navigate("/SellerAuth");
  };

  if (!seller) return null; // Loading or redirecting

  return (
    <div style={container}>
      <h2>Seller Profile</h2>
      <div style={profileBox}>
        <div style={profileItem}>
          <strong>Name:</strong> {seller.name}
        </div>
        <div style={profileItem}>
          <strong>Mobile:</strong> {seller.mobile}
        </div>
        <div style={profileItem}>
          <strong>Email:</strong> {seller.email}
        </div>
        <div style={profileItem}>
          <strong>Recovery Code:</strong> {seller.recoveryCode}
        </div>
        <div style={profileItem}>
          <strong>GST Number:</strong> {seller.gstNumber}
        </div>
        <div style={profileItem}>
          <strong>Address:</strong> {seller.address}
        </div>
        <div style={profileItem}>
          <strong>Company Name:</strong> {seller.companyName}
        </div>
        <div style={profileItem}>
          <strong>Contact Number:</strong> {seller.contactNumber}
        </div>
      </div>

      <button onClick={handleLogout} style={btnStyle}>
        Logout
      </button>
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

const profileBox = {
  textAlign: "left",
  marginTop: "20px",
  marginBottom: "20px",
  padding: "15px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "#f9f9f9",
};

const profileItem = {
  marginBottom: "10px",
  fontSize: "16px",
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

export default SellerProfile;
