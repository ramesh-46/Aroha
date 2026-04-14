import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "./sweetalertConfig";

const initialState = {
  checkoutEnabled: true,
  saleBannerMessage: "",
  saleImages: [],
  saleStartsAt: "",
  saleEndsAt: "",
  flashSaleDiscountPercent: 0,
  flashSaleCategory: "",
  freeDeliveryEnabled: false,
  sellerLocation: { lat: "", lng: "" },
  deliveryRadiusKm: 15,
  normalDeliveryCharge: 0
};

function StoreControlPanel() {
  const sellerToken = localStorage.getItem("sellerToken");
  const adminHeaders = sellerToken
    ? { Authorization: `Bearer ${sellerToken}` }
    : {};

  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saleImageInput, setSaleImageInput] = useState("");

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await axios.get("https://aroha.onrender.com/settings");
      const settings = res.data.settings || initialState;
      setForm({
        checkoutEnabled: settings.checkoutEnabled ?? true,
        saleBannerMessage: settings.saleBannerMessage || "",
        saleImages: settings.saleImages || [],
        saleStartsAt: settings.saleStartsAt ? new Date(settings.saleStartsAt).toISOString().slice(0, 16) : "",
        saleEndsAt: settings.saleEndsAt ? new Date(settings.saleEndsAt).toISOString().slice(0, 16) : "",
        flashSaleDiscountPercent: settings.flashSaleDiscountPercent ?? 0,
        flashSaleCategory: settings.flashSaleCategory || "",
        freeDeliveryEnabled: settings.freeDeliveryEnabled ?? false,
        sellerLocation: {
          lat: settings.sellerLocation?.lat ?? "",
          lng: settings.sellerLocation?.lng ?? ""
        },
        deliveryRadiusKm: settings.deliveryRadiusKm ?? 15,
        normalDeliveryCharge: settings.normalDeliveryCharge ?? 0
      });
    } catch (err) {
      console.error("Failed to fetch settings", err);
      Swal.fire("Unable to load store settings.", "", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const addSaleImage = () => {
    const value = saleImageInput.trim();
    if (!value) return;
    setForm((prev) => ({ ...prev, saleImages: [...prev.saleImages, value] }));
    setSaleImageInput("");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put("https://aroha.onrender.com/settings", {
        ...form,
        saleStartsAt: form.saleStartsAt || null,
        saleEndsAt: form.saleEndsAt || null
      }, { headers: adminHeaders });
      Swal.fire("Store settings updated.", "", "success");
      fetchSettings();
    } catch (err) {
      console.error("Failed to save settings", err);
      Swal.fire(err.response?.data?.message || "Failed to save settings.", "", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading store controls...</div>;
  }

  return (
    <div style={styles.page}>
      <h2 style={styles.heading}>Store Controls</h2>
      <form onSubmit={handleSave} style={styles.form}>
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Checkout & Delivery</h3>
          <label style={styles.switchRow}>
            <input
              type="checkbox"
              checked={form.checkoutEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, checkoutEnabled: e.target.checked }))}
            />
            Enable checkout
          </label>
          <label style={styles.switchRow}>
            <input
              type="checkbox"
              checked={form.freeDeliveryEnabled}
              onChange={(e) => setForm((prev) => ({ ...prev, freeDeliveryEnabled: e.target.checked }))}
            />
            Enable free delivery radius
          </label>
          <div style={styles.grid}>
            <input
              type="number"
              placeholder="Seller latitude"
              value={form.sellerLocation.lat}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sellerLocation: { ...prev.sellerLocation, lat: e.target.value }
                }))
              }
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Seller longitude"
              value={form.sellerLocation.lng}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sellerLocation: { ...prev.sellerLocation, lng: e.target.value }
                }))
              }
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Delivery radius (km)"
              value={form.deliveryRadiusKm}
              onChange={(e) => setForm((prev) => ({ ...prev, deliveryRadiusKm: e.target.value }))}
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Normal delivery charge"
              value={form.normalDeliveryCharge}
              onChange={(e) => setForm((prev) => ({ ...prev, normalDeliveryCharge: e.target.value }))}
              style={styles.input}
            />
          </div>
        </section>

        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Homepage Sale</h3>
          <textarea
            value={form.saleBannerMessage}
            onChange={(e) => setForm((prev) => ({ ...prev, saleBannerMessage: e.target.value }))}
            style={styles.textarea}
            placeholder="Red banner message during live sale"
          />
          <div style={styles.grid}>
            <input
              type="datetime-local"
              value={form.saleStartsAt}
              onChange={(e) => setForm((prev) => ({ ...prev, saleStartsAt: e.target.value }))}
              style={styles.input}
            />
            <input
              type="datetime-local"
              value={form.saleEndsAt}
              onChange={(e) => setForm((prev) => ({ ...prev, saleEndsAt: e.target.value }))}
              style={styles.input}
            />
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Flash sale discount %"
              value={form.flashSaleDiscountPercent}
              onChange={(e) => setForm((prev) => ({ ...prev, flashSaleDiscountPercent: e.target.value }))}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Flash sale category (optional)"
              value={form.flashSaleCategory}
              onChange={(e) => setForm((prev) => ({ ...prev, flashSaleCategory: e.target.value }))}
              style={styles.input}
            />
          </div>
          <div style={styles.inlineRow}>
            <input
              type="text"
              value={saleImageInput}
              onChange={(e) => setSaleImageInput(e.target.value)}
              placeholder="Sale image URL"
              style={styles.input}
            />
            <button type="button" onClick={addSaleImage} style={styles.secondaryButton}>
              Add Image
            </button>
          </div>
          <div style={styles.imageList}>
            {form.saleImages.map((image, index) => (
              <div key={`${image}-${index}`} style={styles.imageCard}>
                <img src={image} alt={`Sale ${index + 1}`} style={styles.image} />
                <button
                  type="button"
                  style={styles.removeButton}
                  onClick={() =>
                    setForm((prev) => ({
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
        </section>

        <button type="submit" style={styles.primaryButton} disabled={saving}>
          {saving ? "Saving..." : "Save Controls"}
        </button>
      </form>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f6f7fb",
    minHeight: "100vh"
  },
  heading: {
    margin: "0 0 18px",
    color: "#1f2937"
  },
  loading: {
    padding: "32px"
  },
  form: {
    display: "grid",
    gap: "18px"
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
  },
  sectionTitle: {
    margin: "0 0 14px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "12px"
  },
  inlineRow: {
    display: "flex",
    gap: "10px",
    marginTop: "12px"
  },
  switchRow: {
    display: "flex",
    gap: "10px",
    alignItems: "center",
    marginBottom: "12px",
    fontWeight: "500"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d7e2"
  },
  textarea: {
    width: "100%",
    minHeight: "90px",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #d0d7e2",
    resize: "vertical"
  },
  imageList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "12px",
    marginTop: "14px"
  },
  imageCard: {
    background: "#f8fafc",
    padding: "10px",
    borderRadius: "12px"
  },
  image: {
    width: "100%",
    height: "120px",
    objectFit: "cover",
    borderRadius: "10px",
    marginBottom: "8px"
  },
  primaryButton: {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "700"
  },
  secondaryButton: {
    border: "none",
    borderRadius: "10px",
    padding: "10px 14px",
    background: "#e11d48",
    color: "#fff",
    cursor: "pointer"
  },
  removeButton: {
    width: "100%",
    border: "none",
    borderRadius: "8px",
    padding: "8px 10px",
    background: "#fee2e2",
    color: "#b91c1c",
    cursor: "pointer"
  }
};

export default StoreControlPanel;
