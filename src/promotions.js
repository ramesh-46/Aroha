import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";

const PromotionPage = () => {
  const [qrCode, setQrCode] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectedInfo, setConnectedInfo] = useState(null);
  
  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponData, setCouponData] = useState({
    discountValue: "",
    isPercentage: false,
    minOrderValue: "",
    minMembers: 1,
    usageLimit: 100,
    category: ""
  });

  // Fetch coupons on load
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("http://localhost:5000/coupons");
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleGenerateCoupon = async (e) => {
    e.preventDefault();
    if (!couponData.discountValue) return alert("Enter discount value");
    try {
      const res = await axios.post("http://localhost:5000/coupons/generate", couponData);
      if (res.data.success) {
        alert(`Coupon Generated: ${res.data.coupon.code}`);
        fetchCoupons(); // Refresh list
        setCouponData({ ...couponData, discountValue: "", minOrderValue: "", category: "" });
      }
    } catch (err) {
      alert("Failed to generate coupon");
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      if (!window.confirm("Are you sure you want to delete this coupon?")) return;
      const res = await axios.delete(`http://localhost:5000/coupons/${id}`);
      if (res.data.success) {
        fetchCoupons();
      }
    } catch (err) {
      alert("Failed to delete coupon");
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

  const handleDownloadAllCSV = () => {
    if (coupons.length === 0) return alert("No active coupons to download");
    let csvContent = "data:text/csv;charset=utf-8,";
    // Header
    csvContent += "Code,Discount Value,Type,Category,Min Order,Min Members,Limit,Used Count\n";
    
    coupons.forEach(c => {
      const typeStr = c.isPercentage ? "Percentage" : "Flat";
      const catStr = c.category ? c.category : "N/A";
      const minO = c.minOrderValue || 0;
      const minM = c.minMembers || 1;
      const row = `${c.code},${c.discountValue},${typeStr},${catStr},${minO},${minM},${c.usageLimit},${c.usedCount}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "all_active_coupons.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Poll QR code until ready
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get("http://localhost:5000/promotion/qr");
        if (res.data.success) {
          setQrCode(res.data.qr);
          clearInterval(interval); // stop polling once QR is ready
        }
      } catch (err) {
        console.log("QR not ready yet");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Fetch users
  useEffect(() => {
    axios.get("http://localhost:5000/promotion/all-users")
      .then(res => {
        if (res.data.success) {
          setUsers(res.data.users);
          setSelectedUsers(res.data.users);
        }
      })
      .catch(err => console.log(err));
  }, []);

  const toggleUser = (user) => {
    if (selectedUsers.find(u => u.mobile === user.mobile)) {
      setSelectedUsers(selectedUsers.filter(u => u.mobile !== user.mobile));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSendPromotion = async () => {
    if (!message || selectedUsers.length === 0) return alert("Enter message & select users");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/promotion/send-promotion", {
        message,
        users: selectedUsers
      });
      if (res.data.success) {
        setSentCount(res.data.sentCount);
        alert(`Sent to ${res.data.sentCount} users`);
      }
    } catch (err) {
      console.log(err);
      alert("Failed to send promotion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={container}>
      <h2>Generate Discount Coupons</h2>
      <div style={couponFormContainer}>
        <form onSubmit={handleGenerateCoupon} style={couponForm}>
          <div style={inputGroup}>
            <label>Discount Value:</label>
            <input type="number" value={couponData.discountValue} onChange={e => setCouponData({...couponData, discountValue: e.target.value})} style={inputStyle} required />
          </div>
          <div style={inputGroup}>
            <label><input type="checkbox" checked={couponData.isPercentage} onChange={e => setCouponData({...couponData, isPercentage: e.target.checked})} /> Is Percentage?</label>
          </div>
          <div style={inputGroup}>
            <label>Min Amount to Redeem:</label>
            <input type="number" value={couponData.minOrderValue} onChange={e => setCouponData({...couponData, minOrderValue: e.target.value})} style={inputStyle} />
          </div>
          <div style={inputGroup}>
            <label>Min Members / Usages:</label>
            <input type="number" value={couponData.minMembers} onChange={e => setCouponData({...couponData, minMembers: e.target.value})} style={inputStyle} />
          </div>
          <div style={inputGroup}>
            <label>Specific Category (optional):</label>
            <input type="text" value={couponData.category} onChange={e => setCouponData({...couponData, category: e.target.value})} style={inputStyle} placeholder="e.g. Men" />
          </div>
          <button type="submit" style={btnStyle}>Generate Unique Coupon</button>
        </form>
      </div>

      {coupons.length > 0 && (
        <div style={couponsList}>
          <h3>Active Coupons</h3>
          {coupons.map((c, i) => (
            <div key={i} style={couponCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{c.code}</strong> - {c.discountValue}{c.isPercentage ? "%" : " flat"} OFF
                  {c.category && <span style={{marginLeft: '10px', background: '#eee', padding: '2px 5px', borderRadius: '4px', fontSize: '0.8rem'}}>Category: {c.category}</span>}
                  <div style={{fontSize: "0.85rem", color: "#666"}}>
                    Min Order: ₹{c.minOrderValue} | Min Members: {c.minMembers} | Limit: {c.usedCount}/{c.usageLimit}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '8px'}}>
                  <button onClick={() => handleDownloadCoupon(c)} style={{background: '#007bff', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}>Download</button>
                  <button onClick={() => handleDeleteCoupon(c._id)} style={{background: 'red', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer'}}>Delete</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={handleDownloadAllCSV} style={{...btnStyle, marginTop: "15px", background: "#28a745"}}>Download All Coupons (Excel)</button>
        </div>
      )}

      <hr style={{margin: "40px 0", border: "1px solid #eee"}} />

      <h2>Send Promotion via WhatsApp</h2>

      {/* QR code */}
      {!connectedInfo && qrCode && (
        <div style={qrContainer}>
          <p>Scan QR to connect WhatsApp</p>
          <QRCodeCanvas value={qrCode} size={200} />
        </div>
      )}

      {/* Connected info */}
      {connectedInfo && (
        <div>
          <p>Connected as: {connectedInfo.name} ({connectedInfo.number})</p>
        </div>
      )}

      <textarea
        placeholder="Enter promotion message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={textareaStyle}
      />

      <h3>Select Users</h3>
      <div style={usersContainer}>
        {users.map((user, idx) => (
          <div key={idx} style={userCard}>
            <input
              type="checkbox"
              checked={!!selectedUsers.find(u => u.mobile === user.mobile)}
              onChange={() => toggleUser(user)}
            />
            <span>{user.name} ({user.mobile})</span>
          </div>
        ))}
      </div>

      <button onClick={handleSendPromotion} style={btnStyle} disabled={loading}>
        {loading ? "Sending..." : "Send Promotion"}
      </button>

      {sentCount > 0 && <p>Messages sent: {sentCount}</p>}
    </div>
  );
};

// Styles
const container = { maxWidth: "800px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "12px", textAlign: "center" };
const qrContainer = { margin: "20px 0" };
const textareaStyle = { width: "100%", padding: "12px", minHeight: "100px", borderRadius: "6px", border: "1px solid #ccc", marginBottom: "20px", fontSize: "16px" };
const usersContainer = { maxHeight: "250px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", marginBottom: "20px", borderRadius: "6px" };
const userCard = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: "1px solid #eee" };
const btnStyle = { padding: "12px 20px", background: "#000", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "16px" };
const couponFormContainer = { background: "#f8f9fa", padding: "20px", borderRadius: "8px", marginBottom: "20px", textAlign: "left" };
const couponForm = { display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" };
const inputGroup = { display: "flex", flexDirection: "column", gap: "5px", minWidth: "150px" };
const inputStyle = { padding: "8px", borderRadius: "6px", border: "1px solid #ccc" };
const couponsList = { textAlign: "left", marginBottom: "20px" };
const couponCard = { background: "#fff", border: "1px dashed green", padding: "10px", borderRadius: "6px", marginBottom: "10px" };

export default PromotionPage;
