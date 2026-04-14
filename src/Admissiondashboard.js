import React from "react";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();
  const seller = JSON.parse(localStorage.getItem("sellerData") || "null");

  const cards = [
    { title: "Add Product", description: "Create products with quantity, pricing, and images.", path: "/addproduct" },
    { title: "Manage Products", description: "Search by ID, filter by category, edit, delete, and bulk update prices.", path: "/product-management" },
    { title: "Order Management", description: "Track customer orders, statuses, coupon data, and inventory impact.", path: "/seller-orders" },
    { title: "Coupon Management", description: "Generate, review, and delete coupons. This is admin-only.", path: "/PromotionPage" },
    { title: "Store Controls", description: "Manage homepage sale, checkout emergency stop, and free-delivery radius.", path: "/store-controls" },
    { title: "Users", description: "View all users, inspect details, and open full order history.", path: "/user-management" },
    { title: "Customer Queries", description: "Reply to help requests in a chat-style support panel.", path: "/support-center" },
    { title: "Seller Profile", description: "Review your seller details.", path: "/SellerProfile" }
  ];

  const handleLogout = () => {
    localStorage.removeItem("sellerData");
    localStorage.removeItem("sellerToken");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/SellerAuth");
  };

  return (
    <div style={styles.container}>
      <div style={styles.hero}>
        <div>
          <p style={styles.eyebrow}>Seller workspace</p>
          <h2 style={styles.heading}>Admin Dashboard</h2>
          <p style={styles.description}>
            {seller?.companyName || seller?.name || "Seller"} can now manage products, pricing, orders, sale controls, users, delivery rules, and support from one place.
          </p>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            style={styles.card}
            onClick={() => navigate(card.path)}
          >
            <h3 style={styles.cardTitle}>{card.title}</h3>
            <p style={styles.cardDesc}>{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    padding: "32px",
    background: "linear-gradient(180deg, #fff7ed 0%, #f8fafc 45%, #eef2ff 100%)",
    fontFamily: "'Inter', sans-serif"
  },
  hero: {
    background: "#111827",
    color: "#fff",
    borderRadius: "24px",
    padding: "28px",
    display: "flex",
    justifyContent: "space-between",
    gap: "18px",
    alignItems: "flex-start",
    marginBottom: "26px"
  },
  eyebrow: {
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.14em",
    color: "#fda4af",
    fontSize: "0.82rem"
  },
  heading: {
    margin: "0 0 10px",
    fontSize: "2.2rem"
  },
  description: {
    maxWidth: "680px",
    margin: 0,
    color: "#d1d5db",
    lineHeight: 1.6
  },
  logoutButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 16px",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "18px"
  },
  card: {
    background: "#fff",
    padding: "22px",
    borderRadius: "18px",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
    cursor: "pointer",
    textAlign: "left",
    border: "1px solid rgba(148, 163, 184, 0.18)"
  },
  cardTitle: {
    margin: "0 0 10px",
    fontSize: "1.15rem",
    color: "#111827"
  },
  cardDesc: {
    margin: 0,
    fontSize: "0.95rem",
    color: "#4b5563",
    lineHeight: 1.55
  }
};

export default AdminDashboard;
