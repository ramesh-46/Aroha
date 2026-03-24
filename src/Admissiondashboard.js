import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const cards = [
    { title: "Add Product", description: "Add new products to your store", path: "/addproduct" },
    { title: "My customer Orders", description: "View and manage customer orders", path: "/seller-orders" },
    { title: "My Profile", description: "View and edit your profile", path: "/SellerProfile" },
    { title: "Coupons", description: "Generate unique discount coupons", path: "/PromotionPage" },
    { title: "Promotion", description: "Manage promotions and offers", path: "/PromotionPage" },
  ];

  return (
    <div style={container}>
      <h2 style={heading}>Admin Dashboard</h2>
      <div style={grid}>
        {cards.map((card, index) => (
          <div
            key={index}
            style={cardStyle}
            onClick={() => navigate(card.path)}
          >
            <h3 style={cardTitle}>{card.title}</h3>
            <p style={cardDesc}>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== STYLES =====
const container = {
  maxWidth: "1200px",
  margin: "50px auto",
  padding: "20px",
  fontFamily: "'Inter', sans-serif",
};

const heading = {
  textAlign: "center",
  fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
  marginBottom: "40px",
  color: "#2c3e50",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "20px",
};

const cardStyle = {
  background: "#fff",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  cursor: "pointer",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  textAlign: "center",
};

const cardTitle = {
  margin: "0 0 10px 0",
  fontSize: "1.2rem",
  color: "#000",
};

const cardDesc = {
  margin: 0,
  fontSize: "0.9rem",
  color: "#555",
};

export default AdminDashboard;
