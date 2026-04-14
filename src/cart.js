import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";

function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: "", mobile: "", address: "" });
  const [previousOrders, setPreviousOrders] = useState([]);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkoutSettings, setCheckoutSettings] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  const getBaseUnitPrice = (product) => {
    const originalPrice = Number(product?.price) || 0;
    const discountedPrice = Number(product?.finalPrice);
    return Number.isFinite(discountedPrice) && discountedPrice < originalPrice
      ? discountedPrice
      : originalPrice;
  };

  const getEffectiveUnitPrice = (product) => {
    const basePrice = getBaseUnitPrice(product);
    const saleStatus = checkoutSettings?.saleStatus;
    const salePercent = Number(checkoutSettings?.flashSaleDiscountPercent) || 0;
    const saleCategory = checkoutSettings?.flashSaleCategory || "";
    const eligibleForFlashSale =
      saleStatus === "live" &&
      salePercent > 0 &&
      (!saleCategory || product.category === saleCategory);

    if (!eligibleForFlashSale) return Math.round(basePrice);
    return Math.round(basePrice - (basePrice * salePercent) / 100);
  };

  // Fetch cart items
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`https://aroha.onrender.com/cart/${user._id}`);
      setCart(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // Fetch previous orders
  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`https://aroha.onrender.com/orders/${user._id}`);
      setPreviousOrders(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchCheckoutSettings = async (location = null) => {
    try {
      const params = new URLSearchParams();
      if (location?.lat && location?.lng) {
        params.append("lat", location.lat);
        params.append("lng", location.lng);
      }
      const res = await axios.get(`https://aroha.onrender.com/orders/checkout-settings${params.toString() ? `?${params.toString()}` : ""}`);
      setCheckoutSettings(res.data);
    } catch (err) {
      console.error("Failed to fetch checkout settings", err);
    }
  };

  useEffect(() => {
    fetchCart();
    fetchOrders();
    fetchCheckoutSettings();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const nextLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCustomerLocation(nextLocation);
          fetchCheckoutSettings(nextLocation);
        },
        () => {}
      );
    }
  }, []);

  if (!user) return <p style={{ padding: "20px" }}>Please log in to view your cart.</p>;

  // Select/unselect items
  const toggleSelect = (productId) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

  // Update quantity
  const updateQuantity = async (productId, increment = true) => {
    const item = cart.items.find(i => i.productId._id === productId);
    if (!item) return;

    const newQty = increment ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) return;

    try {
      await axios.post("https://aroha.onrender.com/cart", {
        userId: user._id,
        productId,
        quantity: newQty - item.quantity // update difference
      });
      fetchCart();
    } catch (err) {
      console.log(err);
    }
  };

  // Total amount
  const totalAmount = cart.items
    .filter(item => selectedItems.includes(item.productId._id))
    .reduce((sum, item) => sum + (getEffectiveUnitPrice(item.productId) * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.computedDiscountAmount !== undefined) {
      discountAmount = Math.round(appliedCoupon.computedDiscountAmount);
    } else {
    let eligibleAmount = totalAmount;
    if (appliedCoupon.category && appliedCoupon.category.trim() !== "") {
      eligibleAmount = cart.items
        .filter(item => selectedItems.includes(item.productId._id) && item.productId.category === appliedCoupon.category)
        .reduce((sum, item) => sum + Math.round((item.productId.finalPrice || item.productId.price) * item.quantity), 0);
    }
    
    // Only apply discount if we meet minOrderValue and have eligible amount
    if (totalAmount >= appliedCoupon.minOrderValue && eligibleAmount > 0) {
      if (appliedCoupon.isPercentage) {
        discountAmount = Math.round((eligibleAmount * appliedCoupon.discountValue) / 100);
      } else {
        discountAmount = Math.round(appliedCoupon.discountValue);
        if (discountAmount > eligibleAmount) discountAmount = eligibleAmount; // cap flat discount
      }
    }
    }
  }

  const deliveryCharge = Math.round(checkoutSettings?.deliveryCharge || 0);
  const finalAmountToPay = Math.max(0, Math.round(totalAmount - discountAmount + deliveryCharge));

  const handleApplyCoupon = async () => {
    try {
      setCouponError("");
      const selectedCartItems = cart.items
        .filter((item) => selectedItems.includes(item.productId._id))
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }));

      const res = await axios.post("https://aroha.onrender.com/coupons/apply", {
        code: couponCode,
        items: selectedCartItems
      });
      if (res.data.success) {
        const coupon = res.data.coupon;
        setAppliedCoupon({ ...coupon, computedDiscountAmount: res.data.discountAmount });
        setCouponError("");
        Swal.fire("Coupon applied successfully!", "", "success");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Failed to apply coupon");
      setAppliedCoupon(null);
    }
  };

  // Place order
  const handlePlaceOrder = async () => {
    const itemsToOrder = cart.items.filter(item => selectedItems.includes(item.productId._id));
    if (!itemsToOrder.length) return Swal.fire("Select items to order!", "", "error");
    if (checkoutSettings && checkoutSettings.checkoutEnabled === false) {
      return Swal.fire("Checkout is temporarily disabled by admin.", "", "warning");
    }

    try {
      const formattedItems = itemsToOrder.map(i => ({
        productId: i.productId._id,
        sku: i.productId.sku, // Pass the product SKU
        quantity: i.quantity
      }));

      const res = await axios.post("https://aroha.onrender.com/orders", {
        userId: user._id,
        items: formattedItems,
        customerName: customerDetails.name,
        customerMobile: customerDetails.mobile,
        deliveryAddress: customerDetails.address,
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        discountAmount: discountAmount,
        totalAmount: finalAmountToPay,
        customerLocation,
        couponDetails: appliedCoupon
      });

      // Remove ordered items from cart
      for (let i of itemsToOrder) {
        await axios.delete(`https://aroha.onrender.com/cart/removeItem/${user._id}/${i.productId._id}`);
      }

      setShowOrderModal(false);
      setSelectedItems([]);
      setCustomerDetails({ name: "", mobile: "", address: "" });
      setAppliedCoupon(null);
      setCouponCode("");
      
      // Navigate to success page
      navigate("/order-success", { state: { order: res.data } });
    } catch (err) {
      console.log(err);
      Swal.fire("Failed to place order. Check console.", "", "error");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <h2 style={styles.pageHeading}>ShoppingCart</h2>

      {cart.items.length === 0 ? <p style={styles.emptyText}>Your cart is empty.</p> : (
        <div style={styles.cartGrid}>
          {cart.items.map(item => {
            const isSelected = selectedItems.includes(item.productId._id);
            return (
              <div
                key={item.productId._id}
                style={{
                  ...styles.cartBox,
                  borderColor: isSelected ? "#10b981" : "#e5e7eb",
                  background: isSelected ? "#ecfdf5" : "#fff",
                  boxShadow: isSelected ? "0 4px 12px rgba(16, 185, 129, 0.15)" : "0 4px 12px rgba(0,0,0,0.05)"
                }}
              >
                <input 
                  type="checkbox" 
                  checked={isSelected} 
                  onChange={() => toggleSelect(item.productId._id)} 
                  style={styles.checkbox}
                />
                <img src={item.productId.images?.[0]?.startsWith("http") ? item.productId.images[0] : `https://aroha.onrender.com/uploads/${item.productId.images?.[0]}`} alt={item.productId.name} style={styles.imgStyle} />
                <h4 style={styles.itemName}>{item.productId.name}</h4>
                <p style={styles.itemPrice}>₹{getEffectiveUnitPrice(item.productId)}</p>
                <div style={styles.qtyManager}>
                  <button onClick={() => updateQuantity(item.productId._id, false)} style={styles.qtyBtn}>-</button>
                  <span style={styles.qtyText}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId._id, true)} style={styles.qtyBtn}>+</button>
                </div>
                <p style={styles.itemTotal}>Total: ₹{getEffectiveUnitPrice(item.productId) * item.quantity}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Invoice & Place Order */}
      {selectedItems.length > 0 && (
        <div style={styles.invoiceBox}>
          <h3 style={styles.invoiceHeading}>Order Summary</h3>
          <ul style={styles.invoiceList}>
            {cart.items.filter(item => selectedItems.includes(item.productId._id)).map(item => {
              const originalTotal = getEffectiveUnitPrice(item.productId) * item.quantity;
              let discountOnThisItem = 0;
              
              if (appliedCoupon && totalAmount >= appliedCoupon.minOrderValue) {
                if (!appliedCoupon.category || appliedCoupon.category.trim() === "" || item.productId.category === appliedCoupon.category) {
                  if (appliedCoupon.isPercentage) {
                    discountOnThisItem = Math.round((originalTotal * appliedCoupon.discountValue) / 100);
                  } else {
                    const eligibleAmount = appliedCoupon.category && appliedCoupon.category.trim() !== "" 
                      ? cart.items.filter(i => selectedItems.includes(i.productId._id) && i.productId.category === appliedCoupon.category).reduce((sum, i) => sum + Math.round((i.productId.finalPrice || i.productId.price) * i.quantity), 0)
                      : totalAmount;
                    if (eligibleAmount > 0) {
                      discountOnThisItem = Math.round((originalTotal / eligibleAmount) * discountAmount);
                    }
                  }
                }
              }
              const discountedTotal = Math.round(originalTotal - discountOnThisItem);

              return (
                <li key={item.productId._id} style={styles.invoiceItem}>
                  <span>{item.productId.name} <span style={styles.invoiceQty}>x {item.quantity}</span></span>
                  <span>
                    ₹{originalTotal}
                    {discountOnThisItem > 0 && <span style={styles.discountBadge}>(-₹{discountOnThisItem} ➡️ ₹{discountedTotal})</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          <div style={styles.subtotalRow}>
            <span>Subtotal:</span>
            <span>₹{totalAmount}</span>
          </div>
          
          <div style={styles.couponSection}>
            <input 
              type="text" 
              placeholder="Enter Coupon Code" 
              value={couponCode} 
              onChange={(e) => setCouponCode(e.target.value)} 
              style={styles.couponInput} 
              disabled={appliedCoupon !== null}
            />
            {appliedCoupon ? (
               <button style={styles.removeCouponBtn} onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>Remove</button>
            ) : (
               <button onClick={handleApplyCoupon} style={styles.applyCouponBtn}>Apply</button>
            )}
          </div>
          {couponError && <p style={styles.errorText}>{couponError}</p>}
          {appliedCoupon && discountAmount > 0 && <p style={styles.successText}>Discount Applied: -₹{discountAmount}</p>}
          {checkoutSettings && (
            <div style={styles.deliverySection}>
              <p style={{ margin: "4px 0", color: checkoutSettings.isFreeDeliveryApplied ? "#10b981" : "#4b5563", fontWeight: "bold" }}>
                {checkoutSettings.message}
              </p>
              <p style={{ margin: "4px 0" }}>Delivery Charge: ₹{deliveryCharge}</p>
            </div>
          )}
          
          <div style={styles.finalTotalRow}>
            <span>Total Payable:</span>
            <span style={styles.finalTotalValue}>₹{finalAmountToPay}</span>
          </div>
          
          <button
            style={checkoutSettings?.checkoutEnabled === false ? { ...styles.placeOrderBtn, background: "#9ca3af", cursor: "not-allowed" } : styles.placeOrderBtn}
            onClick={() => setShowOrderModal(true)}
            disabled={checkoutSettings?.checkoutEnabled === false}
          >
            {checkoutSettings?.checkoutEnabled === false ? "Checkout Disabled" : "Place Order"}
          </button>
        </div>
      )}

      {/* Customer Details Modal */}
      {showOrderModal && (
        <div style={styles.modalStyle}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Delivery Details</h3>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Full Name</label>
              <input type="text" placeholder="John Doe" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} style={styles.inputStyle} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Mobile Number</label>
              <input type="text" placeholder="+91 9999999999" value={customerDetails.mobile} onChange={e => setCustomerDetails({...customerDetails, mobile: e.target.value})} style={styles.inputStyle} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>Complete Address</label>
              <textarea placeholder="House No, Street, City, State, PIN" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} style={{...styles.inputStyle, minHeight: "80px", resize: "vertical"}} />
            </div>
            <div style={styles.modalActions}>
              <button style={styles.confirmBtn} onClick={handlePlaceOrder}>Confirm Order</button>
              <button style={styles.cancelBtn} onClick={() => setShowOrderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Orders handled in the Orders page now, but left here if needed */}
      {previousOrders.length > 0 && (
        <div style={styles.previousOrdersContainer}>
          <h3 style={styles.pageHeading}>📦 Previous Orders</h3>
          {previousOrders.map(order => (
            <div key={order._id} style={styles.previousOrderBox}>
              <div style={styles.previousOrderHeader}>
                <span style={styles.previousOrderId}>Order #{order._id.substring(0,8).toUpperCase()}</span>
                <span style={styles.previousOrderStatus}>{order.status}</span>
              </div>
              <ul style={styles.previousOrderList}>
                {order.items.map(i => (
                  <li key={i.productId} style={styles.previousOrderItem}>{i.productId.name} <span style={{color: '#6b7280'}}>x {i.quantity}</span></li>
                ))}
              </ul>
              <div style={styles.previousOrderFooter}>
                <span style={styles.previousOrderTotal}>₹{Math.round(order.totalAmount)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// Premium System Level Styles for Cart
const styles = {
  pageContainer: {
    padding: "40px 20px",
    fontFamily: "'Inter', system-ui, sans-serif",
    backgroundColor: "#f9fafb",
    minHeight: "100vh",
    color: "#111827",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  pageHeading: {
    fontSize: "2rem",
    fontWeight: "800",
    marginBottom: "24px",
    color: "#111827",
  },
  emptyText: {
    fontSize: "1.1rem",
    color: "#6b7280",
    textAlign: "center",
    padding: "40px",
    background: "#fff",
    borderRadius: "16px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
  },
  cartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "20px",
  },
  cartBox: {
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    textAlign: "center",
    transition: "all 0.2s ease",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  checkbox: {
    position: "absolute",
    top: "15px",
    left: "15px",
    width: "18px",
    height: "18px",
    cursor: "pointer",
    accentColor: "#10b981",
  },
  imgStyle: {
    width: "100%",
    height: "140px",
    objectFit: "cover",
    borderRadius: "8px",
    marginBottom: "12px",
  },
  itemName: {
    margin: "0 0 8px 0",
    fontSize: "1.05rem",
    fontWeight: "600",
  },
  itemPrice: {
    margin: "0 0 12px 0",
    color: "#4b5563",
    fontWeight: "500",
  },
  qtyManager: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginBottom: "12px",
    marginTop: "auto",
  },
  qtyBtn: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    transition: "all 0.2s",
  },
  qtyText: {
    fontWeight: "600",
    minWidth: "20px",
  },
  itemTotal: {
    margin: "0",
    fontWeight: "700",
    color: "#10b981",
  },
  invoiceBox: {
    marginTop: "32px",
    padding: "32px",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
  },
  invoiceHeading: {
    fontSize: "1.5rem",
    fontWeight: "700",
    marginBottom: "20px",
    paddingBottom: "16px",
    borderBottom: "1px solid #e5e7eb",
  },
  invoiceList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 20px 0",
  },
  invoiceItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px dashed #e5e7eb",
    fontSize: "1.05rem",
    color: "#374151",
  },
  invoiceQty: {
    color: "#6b7280",
    fontSize: "0.95rem",
    marginLeft: "4px",
  },
  discountBadge: {
    color: "#10b981",
    marginLeft: "8px",
    fontWeight: "600",
    fontSize: "0.9rem",
  },
  subtotalRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1.1rem",
    fontWeight: "600",
    marginBottom: "24px",
    color: "#111827",
  },
  couponSection: {
    display: "flex",
    gap: "12px",
    marginBottom: "12px",
  },
  couponInput: {
    flex: 1,
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    outline: "none",
    background: "#f9fafb",
  },
  applyCouponBtn: {
    padding: "0 24px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  removeCouponBtn: {
    padding: "0 24px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
  },
  errorText: {
    color: "#ef4444",
    fontSize: "0.9rem",
    marginTop: "4px",
  },
  successText: {
    color: "#10b981",
    fontSize: "0.9rem",
    fontWeight: "600",
    marginTop: "4px",
  },
  deliverySection: {
    marginTop: "16px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  finalTotalRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "24px",
    paddingTop: "24px",
    borderTop: "2px solid #e5e7eb",
  },
  finalTotalValue: {
    fontSize: "1.5rem",
    fontWeight: "800",
    color: "#10b981",
  },
  placeOrderBtn: {
    width: "100%",
    padding: "16px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1.1rem",
    fontWeight: "700",
    marginTop: "24px",
    cursor: "pointer",
    transition: "transform 0.1s, box-shadow 0.2s",
    boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)",
  },
  modalStyle: {
    position: "fixed",
    inset: 0,
    background: "rgba(17, 24, 39, 0.6)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
    backdropFilter: "blur(4px)",
    padding: "20px",
  },
  modalContent: {
    background: "#fff",
    padding: "32px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  modalTitle: {
    margin: "0 0 24px 0",
    fontSize: "1.5rem",
    fontWeight: "700",
    color: "#111827",
  },
  formGroup: {
    marginBottom: "16px",
  },
  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.9rem",
    fontWeight: "600",
    color: "#4b5563",
  },
  inputStyle: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    outline: "none",
    background: "#f9fafb",
    boxSizing: "border-box",
  },
  modalActions: {
    display: "flex",
    gap: "12px",
    marginTop: "32px",
  },
  confirmBtn: {
    flex: 2,
    padding: "14px",
    background: "#10b981",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "1.05rem",
    cursor: "pointer",
  },
  cancelBtn: {
    flex: 1,
    padding: "14px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: "10px",
    fontWeight: "600",
    fontSize: "1.05rem",
    cursor: "pointer",
  },
  previousOrdersContainer: {
    marginTop: "48px",
  },
  previousOrderBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "16px",
  },
  previousOrderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e5e7eb",
  },
  previousOrderId: {
    fontWeight: "700",
    color: "#111827",
  },
  previousOrderStatus: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  previousOrderList: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 16px 0",
  },
  previousOrderItem: {
    color: "#374151",
    marginBottom: "4px",
  },
  previousOrderFooter: {
    display: "flex",
    justifyContent: "flex-end",
  },
  previousOrderTotal: {
    fontWeight: "700",
    fontSize: "1.1rem",
    color: "#10b981",
  }
};

export default Cart;
