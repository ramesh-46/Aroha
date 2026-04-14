import React, { useEffect, useState } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "./sweetalertConfig";

const initialCouponData = {
  discountValue: "",
  isPercentage: false,
  minOrderValue: "",
  minMembers: 1,
  usageLimit: 100,
  category: "",
  maxDiscountAmount: "",
  startsAt: "",
  endsAt: ""
};

const initialSaleData = {
  saleBannerMessage: "",
  saleImages: [],
  saleStartsAt: "",
  saleEndsAt: "",
  flashSaleDiscountPercent: 0,
  flashSaleCategory: ""
};

const PromotionPage = () => {
  const sellerToken = localStorage.getItem("sellerToken");
  const adminHeaders = sellerToken
    ? { Authorization: `Bearer ${sellerToken}` }
    : {};

  const [qrCode, setQrCode] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState("");
  const [sentCount, setSentCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [connectedInfo, setConnectedInfo] = useState(null);
  const [categories, setCategories] = useState(["Men", "Women", "Children", "Jewelry", "Accessories"]);
  const [coupons, setCoupons] = useState([]);
  const [couponData, setCouponData] = useState(initialCouponData);
  const [saleData, setSaleData] = useState(initialSaleData);
  const [saleImageInput, setSaleImageInput] = useState("");

  useEffect(() => {
    axios.get("https://aroha.onrender.com/products/attributes")
      .then((res) => {
        if (res.data?.categories?.length) {
          setCategories((prev) => [...new Set([...prev, ...res.data.categories])]);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/coupons");
      if (res.data.success) {
        setCoupons(res.data.coupons);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSaleSettings = async () => {
    try {
      const res = await axios.get("https://aroha.onrender.com/settings");
      const settings = res.data.settings || {};
      setSaleData({
        saleBannerMessage: settings.saleBannerMessage || "",
        saleImages: settings.saleImages || [],
        saleStartsAt: settings.saleStartsAt ? new Date(settings.saleStartsAt).toISOString().slice(0, 16) : "",
        saleEndsAt: settings.saleEndsAt ? new Date(settings.saleEndsAt).toISOString().slice(0, 16) : "",
        flashSaleDiscountPercent: settings.flashSaleDiscountPercent ?? 0,
        flashSaleCategory: settings.flashSaleCategory || ""
      });
    } catch (err) {
      console.error("Failed to fetch sale settings", err);
    }
  };

  useEffect(() => {
    fetchCoupons();
    fetchSaleSettings();
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
      const res = await axios.get("https://aroha.onrender.com/promotion/qr");
        if (res.data.success && res.data.qr) {
          setQrCode(res.data.qr);
          setConnectedInfo(null);
        } else if (res.data.info) {
          setConnectedInfo(res.data.info);
        }
      } catch (err) {
        console.log("QR not ready yet");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    axios.get("https://aroha.onrender.com/promotion/all-users", { headers: adminHeaders })
      .then((res) => {
        if (res.data.success) {
          setUsers(res.data.users);
          setSelectedUsers(res.data.users);
        }
      })
      .catch((err) => console.log(err));
  }, []);

  const handleGenerateCoupon = async (e) => {
    e.preventDefault();
    if (!couponData.discountValue) return Swal.fire("Enter discount value", "", "error");

    try {
      const res = await axios.post("https://aroha.onrender.com/coupons/generate", {
        ...couponData,
        category: couponData.category || "",
        startsAt: couponData.startsAt || null,
        endsAt: couponData.endsAt || null
      }, { headers: adminHeaders });

      if (res.data.success) {
        Swal.fire(`Coupon Generated: ${res.data.coupon.code}`, "", "success");
        fetchCoupons();
        setCouponData(initialCouponData);
      }
    } catch (err) {
      Swal.fire(err.response?.data?.message || "Failed to generate coupon", "", "error");
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      if (!window.confirm("Delete this coupon?")) return;
      const res = await axios.delete(`https://aroha.onrender.com/coupons/${id}`, { headers: adminHeaders });
      if (res.data.success) fetchCoupons();
    } catch (err) {
      Swal.fire("Failed to delete coupon", "", "error");
    }
  };

  const handleSaveSale = async (e) => {
    e.preventDefault();
    try {
      await axios.put("https://aroha.onrender.com/settings", {
        saleBannerMessage: saleData.saleBannerMessage,
        saleImages: saleData.saleImages,
        saleStartsAt: saleData.saleStartsAt || null,
        saleEndsAt: saleData.saleEndsAt || null,
        flashSaleDiscountPercent: Number(saleData.flashSaleDiscountPercent) || 0,
        flashSaleCategory: saleData.flashSaleCategory || ""
      }, { headers: adminHeaders });
      Swal.fire("Flash sale settings updated.", "", "success");
      fetchSaleSettings();
    } catch (err) {
      Swal.fire(err.response?.data?.message || "Failed to save flash sale", "", "error");
    }
  };

  const toggleUser = (user) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u.mobile === user.mobile)
        ? prev.filter((u) => u.mobile !== user.mobile)
        : [...prev, user]
    );
  };

  const handleSendPromotion = async () => {
    if (!message || selectedUsers.length === 0) return Swal.fire("Enter message and select users", "", "error");
    setLoading(true);

    try {
      const res = await axios.post("https://aroha.onrender.com/promotion/send-promotion", {
        message,
        users: selectedUsers
      }, { headers: adminHeaders });
      if (res.data.success) {
        setSentCount(res.data.sentCount);
        Swal.fire(`Sent to ${res.data.sentCount} users`, "", "success");
      }
    } catch (err) {
      console.log(err);
      Swal.fire(err.response?.data?.message || "Failed to send promotion", "", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Coupons, Promotions & Flash Sale</h2>

      <section style={styles.panel}>
        <h3 style={styles.sectionTitle}>Flash Live Sale</h3>
        <form onSubmit={handleSaveSale} style={styles.gridForm}>
          <textarea
            value={saleData.saleBannerMessage}
            onChange={(e) => setSaleData((prev) => ({ ...prev, saleBannerMessage: e.target.value }))}
            placeholder="Live sale banner message"
            style={styles.textarea}
          />
          <input
            type="datetime-local"
            value={saleData.saleStartsAt}
            onChange={(e) => setSaleData((prev) => ({ ...prev, saleStartsAt: e.target.value }))}
            style={styles.input}
          />
          <input
            type="datetime-local"
            value={saleData.saleEndsAt}
            onChange={(e) => setSaleData((prev) => ({ ...prev, saleEndsAt: e.target.value }))}
            style={styles.input}
          />
          <input
            type="number"
            min="0"
            max="100"
            value={saleData.flashSaleDiscountPercent}
            onChange={(e) => setSaleData((prev) => ({ ...prev, flashSaleDiscountPercent: e.target.value }))}
            placeholder="Flash sale discount %"
            style={styles.input}
          />
          <select
            value={saleData.flashSaleCategory}
            onChange={(e) => setSaleData((prev) => ({ ...prev, flashSaleCategory: e.target.value }))}
            style={styles.input}
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div style={styles.inlineRow}>
            <input
              type="text"
              value={saleImageInput}
              onChange={(e) => setSaleImageInput(e.target.value)}
              placeholder="Sale image URL"
              style={styles.input}
            />
            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() => {
                const trimmed = saleImageInput.trim();
                if (!trimmed) return;
                setSaleData((prev) => ({ ...prev, saleImages: [...prev.saleImages, trimmed] }));
                setSaleImageInput("");
              }}
            >
              Add
            </button>
          </div>
          <div style={styles.imageGrid}>
            {saleData.saleImages.map((image, index) => (
              <div key={`${image}-${index}`} style={styles.imageCard}>
                <img src={image} alt={`Sale ${index + 1}`} style={styles.saleImage} />
                <button
                  type="button"
                  style={styles.removeButton}
                  onClick={() =>
                    setSaleData((prev) => ({
                      ...prev,
                      saleImages: prev.saleImages.filter((_, itemIndex) => itemIndex !== index)
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button type="submit" style={styles.primaryButton}>Save Flash Sale</button>
        </form>
      </section>

      <section style={styles.panel}>
        <h3 style={styles.sectionTitle}>Generate Coupon</h3>
        <form onSubmit={handleGenerateCoupon} style={styles.gridForm}>
          <input type="number" value={couponData.discountValue} onChange={(e) => setCouponData((prev) => ({ ...prev, discountValue: e.target.value }))} placeholder="Discount value" style={styles.input} required />
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={couponData.isPercentage} onChange={(e) => setCouponData((prev) => ({ ...prev, isPercentage: e.target.checked }))} />
            Percentage coupon
          </label>
          <input type="number" value={couponData.minOrderValue} onChange={(e) => setCouponData((prev) => ({ ...prev, minOrderValue: e.target.value }))} placeholder="Min order value" style={styles.input} />
          <input type="number" value={couponData.minMembers} onChange={(e) => setCouponData((prev) => ({ ...prev, minMembers: e.target.value }))} placeholder="Min item quantity" style={styles.input} />
          <input type="number" value={couponData.usageLimit} onChange={(e) => setCouponData((prev) => ({ ...prev, usageLimit: e.target.value }))} placeholder="Usage limit" style={styles.input} />
          <input type="number" value={couponData.maxDiscountAmount} onChange={(e) => setCouponData((prev) => ({ ...prev, maxDiscountAmount: e.target.value }))} placeholder="Max discount cap" style={styles.input} />
          <select value={couponData.category} onChange={(e) => setCouponData((prev) => ({ ...prev, category: e.target.value }))} style={styles.input}>
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input type="datetime-local" value={couponData.startsAt} onChange={(e) => setCouponData((prev) => ({ ...prev, startsAt: e.target.value }))} style={styles.input} />
          <input type="datetime-local" value={couponData.endsAt} onChange={(e) => setCouponData((prev) => ({ ...prev, endsAt: e.target.value }))} style={styles.input} />
          <button type="submit" style={styles.primaryButton}>Generate Coupon</button>
        </form>

        <div style={styles.couponList}>
          {coupons.map((coupon) => (
            <div key={coupon._id} style={styles.couponCard}>
              <div>
                <strong>{coupon.code}</strong>
                <p style={styles.meta}>
                  {coupon.discountValue}{coupon.isPercentage ? "%" : " flat"} OFF
                  {coupon.category ? ` • ${coupon.category}` : " • All categories"}
                </p>
                <p style={styles.meta}>
                  Min Order ₹{coupon.minOrderValue} • Min Qty {coupon.minMembers} • Used {coupon.usedCount}/{coupon.usageLimit}
                </p>
              </div>
              <button onClick={() => handleDeleteCoupon(coupon._id)} style={styles.removeButton}>Delete</button>
            </div>
          ))}
        </div>
      </section>

      <section style={styles.panel}>
        <h3 style={styles.sectionTitle}>WhatsApp Promotion Broadcast</h3>
        {!connectedInfo && qrCode && (
          <div style={styles.qrContainer}>
            <p>Scan QR to connect WhatsApp</p>
            <QRCodeCanvas value={qrCode} size={200} />
          </div>
        )}
        {connectedInfo && (
          <p style={styles.meta}>Connected as: {connectedInfo.name} ({connectedInfo.number})</p>
        )}
        <textarea
          placeholder="Promotion message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.userList}>
          {users.map((user) => (
            <label key={user.mobile} style={styles.userRow}>
              <input
                type="checkbox"
                checked={!!selectedUsers.find((u) => u.mobile === user.mobile)}
                onChange={() => toggleUser(user)}
              />
              <span>{user.name} ({user.mobile})</span>
            </label>
          ))}
        </div>
        <button onClick={handleSendPromotion} style={styles.primaryButton} disabled={loading}>
          {loading ? "Sending..." : "Send Promotion"}
        </button>
        {sentCount > 0 && <p style={styles.meta}>Messages sent: {sentCount}</p>}
      </section>
    </div>
  );
};

const styles = {
  page: {
    maxWidth: "1100px",
    margin: "40px auto",
    padding: "20px",
    display: "grid",
    gap: "20px"
  },
  heading: {
    margin: 0,
    textAlign: "center"
  },
  panel: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
  },
  sectionTitle: {
    margin: "0 0 14px"
  },
  gridForm: {
    display: "grid",
    gap: "12px"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d7e2"
  },
  textarea: {
    width: "100%",
    minHeight: "100px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d7e2"
  },
  inlineRow: {
    display: "flex",
    gap: "10px"
  },
  primaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 16px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer"
  },
  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#0f766e",
    color: "#fff",
    cursor: "pointer"
  },
  removeButton: {
    border: "none",
    borderRadius: "8px",
    padding: "8px 12px",
    background: "#fee2e2",
    color: "#b91c1c",
    cursor: "pointer"
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "500"
  },
  imageGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px"
  },
  imageCard: {
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "10px"
  },
  saleImage: {
    width: "100%",
    height: "110px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "8px"
  },
  couponList: {
    display: "grid",
    gap: "10px",
    marginTop: "16px"
  },
  couponCard: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "center",
    border: "1px dashed #22c55e",
    borderRadius: "12px",
    padding: "12px"
  },
  meta: {
    margin: "6px 0 0",
    color: "#6b7280"
  },
  qrContainer: {
    marginBottom: "16px"
  },
  userList: {
    maxHeight: "220px",
    overflowY: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "10px",
    display: "grid",
    gap: "8px"
  },
  userRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center"
  }
};

export default PromotionPage;
