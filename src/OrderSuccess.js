import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaCheckCircle, FaBoxOpen, FaTruck } from "react-icons/fa";

function OrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderDetails = location.state?.order;

  return (
    <div style={styles.container}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={styles.card}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1.2, rotate: 360 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
          style={styles.iconContainer}
        >
          <FaCheckCircle style={styles.checkIcon} />
        </motion.div>
        
        <h1 style={styles.title}>Order Placed Successfully!</h1>
        <p style={styles.subtitle}>Thank you for shopping with us. Your order is confirmed.</p>
        
        {orderDetails && (
          <div style={styles.orderDetailsBox}>
            <div style={styles.orderRow}>
              <span style={styles.orderLabel}>Order ID</span>
              <span style={styles.orderValue}>#{orderDetails._id.substring(0, 10).toUpperCase()}</span>
            </div>
            <div style={styles.orderRow}>
              <span style={styles.orderLabel}>Total Amount</span>
              <span style={styles.orderValue}>₹{Math.round(orderDetails.totalAmount)}</span>
            </div>
            <div style={styles.orderRow}>
              <span style={styles.orderLabel}>Estimated Delivery</span>
              <span style={styles.orderValue}>3-5 Business Days</span>
            </div>
          </div>
        )}

        <div style={styles.actionButtons}>
          <button style={styles.primaryBtn} onClick={() => navigate("/orders")}>
            <FaBoxOpen /> View Orders
          </button>
          <button style={styles.secondaryBtn} onClick={() => navigate("/dashboard")}>
            Continue Shopping
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f2f5",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "20px"
  },
  card: {
    background: "#ffffff",
    padding: "40px 30px",
    borderRadius: "20px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.08)",
    maxWidth: "500px",
    width: "100%",
    textAlign: "center",
    position: "relative",
    overflow: "hidden"
  },
  iconContainer: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center"
  },
  checkIcon: {
    fontSize: "80px",
    color: "#10b981", // Emerald green
    filter: "drop-shadow(0px 10px 10px rgba(16, 185, 129, 0.3))"
  },
  title: {
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#111827",
    margin: "0 0 10px 0"
  },
  subtitle: {
    color: "#6b7280",
    fontSize: "1rem",
    margin: "0 0 30px 0",
    lineHeight: "1.5"
  },
  orderDetailsBox: {
    background: "#f9fafb",
    border: "1px dashed #d1d5db",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "30px",
    textAlign: "left"
  },
  orderRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e5e7eb"
  },
  orderLabel: {
    color: "#4b5563",
    fontSize: "0.9rem",
    fontWeight: "500"
  },
  orderValue: {
    color: "#111827",
    fontSize: "1rem",
    fontWeight: "600"
  },
  actionButtons: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  primaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#000",
    color: "#fff",
    border: "none",
    padding: "14px",
    borderRadius: "10px",
    fontSize: "1.05rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  secondaryBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#fff",
    color: "#000",
    border: "2px solid #000",
    padding: "12px",
    borderRadius: "10px",
    fontSize: "1.05rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s ease"
  }
};

export default OrderSuccess;
