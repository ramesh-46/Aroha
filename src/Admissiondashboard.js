import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBox, FaTags, FaTruck, FaPercent, FaStore, FaUsers,
  FaHeadset, FaUserCircle, FaSignOutAlt, FaShoppingCart,
  FaChartLine, FaCog, FaClipboardList, FaGift
} from "react-icons/fa";

function AdminDashboard() {
  const navigate = useNavigate();
  const seller = JSON.parse(localStorage.getItem("sellerData") || "null");

  const cards = [
    { title: "Add Product", description: "Create products with quantity, pricing, and images.", path: "/addproduct", icon: <FaBox size={28} />, color: "#3b82f6" },
    { title: "Manage Products", description: "Search by ID, filter by category, edit, delete, and bulk update prices.", path: "/product-management", icon: <FaTags size={28} />, color: "#8b5cf6" },
    { title: "Order Management", description: "Track customer orders, statuses, coupon data, and inventory impact.", path: "/seller-orders", icon: <FaShoppingCart size={28} />, color: "#f59e0b" },
    { title: "Coupon Management", description: "Generate, review, and delete coupons. This is admin-only.", path: "/PromotionPage", icon: <FaPercent size={28} />, color: "#ec4899" },
    { title: "Store Controls", description: "Manage homepage sale, checkout emergency stop, and free-delivery radius.", path: "/store-controls", icon: <FaStore size={28} />, color: "#10b981" },
    { title: "Users", description: "View all users, inspect details, and open full order history.", path: "/user-management", icon: <FaUsers size={28} />, color: "#6366f1" },
    { title: "Customer Queries", description: "Reply to help requests in a chat-style support panel.", path: "/support-center", icon: <FaHeadset size={28} />, color: "#ef4444" },
    { title: "Seller Profile", description: "Review your seller details.", path: "/SellerProfile", icon: <FaUserCircle size={28} />, color: "#14b8a6" }
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
        <div style={styles.heroLeft}>
          <p style={styles.eyebrow}>Seller Workspace</p>
          <h2 style={styles.heading}>Admin Dashboard</h2>
          <p style={styles.description}>
            {seller?.companyName || seller?.name || "Seller"} can now manage products, pricing, orders, sale controls, users, delivery rules, and support from one place.
          </p>
        </div>
        <button style={styles.logoutButton} onClick={handleLogout}>
          <FaSignOutAlt style={{ marginRight: "8px" }} /> Logout
        </button>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <FaChartLine size={24} color="#3b82f6" />
          <span style={styles.statValue}>8</span>
          <span style={styles.statLabel}>Modules</span>
        </div>
        <div style={styles.statCard}>
          <FaClipboardList size={24} color="#10b981" />
          <span style={styles.statValue}>{cards.length}</span>
          <span style={styles.statLabel}>Actions</span>
        </div>
        <div style={styles.statCard}>
          <FaGift size={24} color="#f59e0b" />
          <span style={styles.statValue}>Live</span>
          <span style={styles.statLabel}>Store</span>
        </div>
      </div>

      <div style={styles.grid}>
        {cards.map((card) => (
          <button
            key={card.title}
            type="button"
            style={styles.card}
            onClick={() => navigate(card.path)}
          >
            <div style={{ ...styles.cardIcon, backgroundColor: `${card.color}15`, color: card.color }}>
              {card.icon}
            </div>
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
    background: "linear-gradient(135deg, #f5f7fa 0%, #eef2f6 100%)",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },
  hero: {
    background: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
    color: "#fff",
    borderRadius: "28px",
    padding: "32px 36px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    marginBottom: "32px",
    boxShadow: "0 20px 35px -12px rgba(0,0,0,0.15)",
    flexWrap: "wrap"
  },
  heroLeft: {
    flex: 1
  },
  eyebrow: {
    margin: "0 0 8px",
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    color: "#fbbf24",
    fontSize: "0.75rem",
    fontWeight: "600"
  },
  heading: {
    margin: "0 0 12px",
    fontSize: "clamp(1.8rem, 5vw, 2.4rem)",
    fontWeight: "700",
    letterSpacing: "-0.01em"
  },
  description: {
    maxWidth: "680px",
    margin: 0,
    color: "#cbd5e1",
    lineHeight: 1.6,
    fontSize: "0.95rem"
  },
  logoutButton: {
    border: "none",
    borderRadius: "40px",
    padding: "12px 28px",
    background: "#ef4444",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(239,68,68,0.3)"
  },
  statsBar: {
    display: "flex",
    gap: "20px",
    marginBottom: "36px",
    flexWrap: "wrap"
  },
  statCard: {
    background: "#fff",
    borderRadius: "20px",
    padding: "16px 24px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
    flex: "1 1 180px",
    border: "1px solid rgba(0,0,0,0.03)"
  },
  statValue: {
    fontSize: "1.8rem",
    fontWeight: "800",
    color: "#1e293b",
    lineHeight: 1
  },
  statLabel: {
    fontSize: "0.8rem",
    fontWeight: "500",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px"
  },
  card: {
    background: "#fff",
    padding: "28px 24px",
    borderRadius: "24px",
    boxShadow: "0 12px 30px rgba(0, 0, 0, 0.06)",
    cursor: "pointer",
    textAlign: "left",
    border: "1px solid rgba(148, 163, 184, 0.12)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },
  cardIcon: {
    width: "56px",
    height: "56px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "18px",
    fontSize: "1.6rem"
  },
  cardTitle: {
    margin: 0,
    fontSize: "1.25rem",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.2px"
  },
  cardDesc: {
    margin: 0,
    fontSize: "0.9rem",
    color: "#475569",
    lineHeight: 1.55
  }
};

// Add hover effect via style tag
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  button {
    transition: all 0.2s ease;
  }
  button:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 35px -12px rgba(0,0,0,0.15) !important;
  }
  .logoutButton:hover {
    background: #dc2626 !important;
    transform: scale(1.02) !important;
  }
  @media (max-width: 640px) {
    .container { padding: 20px; }
    .hero { padding: 24px; }
    .grid { grid-template-columns: 1fr; }
    .card { padding: 20px; }
  }
`;
document.head.appendChild(styleSheet);

export default AdminDashboard;