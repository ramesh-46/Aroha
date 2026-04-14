import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/coupons");
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleDownloadCoupon = (coupon) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    
    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Border
    ctx.strokeStyle = "green";
    ctx.setLineDash([10, 5]);
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    
    ctx.setLineDash([]);
    ctx.fillStyle = "#000000";
    ctx.font = "bold 24px Arial";
    ctx.fillText(`Code: ${coupon.code}`, 30, 50);
    
    ctx.fillStyle = "#dc3545";
    ctx.font = "bold 28px Arial";
    ctx.fillText(`${coupon.discountValue}${coupon.isPercentage ? "%" : " flat"} OFF`, 30, 95);
    
    ctx.fillStyle = "#333333";
    ctx.font = "16px Arial";
    if (coupon.category) ctx.fillText(`Category: ${coupon.category}`, 30, 125);
    if (coupon.minOrderValue) ctx.fillText(`Min Order: Rs.${coupon.minOrderValue}`, 30, 150);
    else ctx.fillText("No Min Order Required", 30, 150);
    
    const link = document.createElement('a');
    link.download = `coupon-${coupon.code}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.logoContainer}>
          <span style={styles.brandName}>AROHA HUB</span>
        </div>
        <div>
          <button style={styles.navBtn} onClick={() => navigate("/dashboard")}>Back to Dashboard</button>
        </div>
      </header>

      <main style={styles.main}>
        <h2 style={styles.heading}>Available Coupons</h2>
        <p style={{marginBottom: "20px", color: "#666"}}>Download these exclusive coupons and apply them during checkout!</p>
        
        {coupons.length === 0 ? (
          <p>No active coupons found at this moment. Check back later!</p>
        ) : (
          <div style={styles.grid}>
            {coupons.map((c, i) => (
              <div key={i} style={styles.couponCard}>
                <div style={styles.couponHeader}>
                  <strong style={styles.codeText}>{c.code}</strong>
                </div>
                <div style={styles.couponBody}>
                  <h3 style={styles.discountText}>{c.discountValue}{c.isPercentage ? "%" : " flat"} OFF</h3>
                  {c.category && <p style={styles.detailText}><strong>Category:</strong> {c.category}</p>}
                  <p style={styles.detailText}><strong>Min Order:</strong> ₹{c.minOrderValue || 0}</p>
                </div>
                <button onClick={() => handleDownloadCoupon(c)} style={styles.downloadBtn}>Download Coupon</button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

// Styles
const styles = {
  container: {
    fontFamily: "'Inter', sans-serif",
    color: "#333",
    backgroundColor: "#f8f9fa",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 20px",
    background: "#2c3e50",
    color: "#fff",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  logoContainer: {
    fontSize: "24px",
    fontWeight: "bold",
    fontFamily: "'Cormorant Garamond', serif",
  },
  brandName: { color: "#fff" },
  navBtn: {
    background: "rgba(255,255,255,0.1)",
    color: "#fff",
    border: "1px solid rgba(255,255,255,0.2)",
    padding: "8px 12px",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.3s",
  },
  main: {
    padding: "20px",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  heading: {
    fontFamily: "'Cormorant Garamond', serif",
    fontSize: "2rem",
    marginBottom: "10px",
    color: "#2c3e50",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  couponCard: {
    background: "#fff",
    border: "2px dashed #28a745",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
    transition: "transform 0.2s",
  },
  couponHeader: {
    background: "#f0fff0",
    padding: "10px",
    borderRadius: "4px",
    marginBottom: "15px",
    display: "inline-block",
    border: "1px solid #d4edda",
  },
  codeText: {
    fontSize: "1.5rem",
    color: "#155724",
    letterSpacing: "2px",
  },
  couponBody: {
    marginBottom: "20px",
  },
  discountText: {
    fontSize: "1.8rem",
    color: "#dc3545",
    margin: "0 0 10px 0",
  },
  detailText: {
    fontSize: "0.95rem",
    color: "#555",
    margin: "5px 0",
  },
  downloadBtn: {
    background: "#007bff",
    color: "#fff",
    border: "none",
    padding: "10px 20px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
    width: "100%",
  }
};

export default UserCoupons;
