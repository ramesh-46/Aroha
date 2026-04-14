import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";
import { FaTrashAlt, FaTag, FaTruck, FaShieldAlt, FaWallet, FaShoppingBag } from "react-icons/fa";

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

  if (!user) return <p style={styles.loginPrompt}>Please log in to view your cart.</p>;

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
        quantity: newQty - item.quantity
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
      
      if (totalAmount >= appliedCoupon.minOrderValue && eligibleAmount > 0) {
        if (appliedCoupon.isPercentage) {
          discountAmount = Math.round((eligibleAmount * appliedCoupon.discountValue) / 100);
        } else {
          discountAmount = Math.round(appliedCoupon.discountValue);
          if (discountAmount > eligibleAmount) discountAmount = eligibleAmount;
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
        sku: i.productId.sku,
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

      for (let i of itemsToOrder) {
        await axios.delete(`https://aroha.onrender.com/cart/removeItem/${user._id}/${i.productId._id}`);
      }

      setShowOrderModal(false);
      setSelectedItems([]);
      setCustomerDetails({ name: "", mobile: "", address: "" });
      setAppliedCoupon(null);
      setCouponCode("");
      
      navigate("/order-success", { state: { order: res.data } });
    } catch (err) {
      console.log(err);
      Swal.fire("Failed to place order. Check console.", "", "error");
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerSection}>
        <h2 style={styles.pageHeading}>Your Cart</h2>
        <p style={styles.subHeading}>{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</p>
      </div>

      {cart.items.length === 0 ? (
        <div style={styles.emptyCart}>
          <FaShoppingBag size={48} color="#d4af37" />
          <p>Your cart is empty</p>
          <button style={styles.continueShopBtn} onClick={() => navigate("/dashboard")}>Continue Shopping</button>
        </div>
      ) : (
        <>
          <div style={styles.cartGrid}>
            {cart.items.map(item => {
              const isSelected = selectedItems.includes(item.productId._id);
              return (
                <div key={item.productId._id} style={{ ...styles.cartCard, borderColor: isSelected ? "#d4af37" : "#2a2a2a" }}>
                  <input 
                    type="checkbox" 
                    checked={isSelected} 
                    onChange={() => toggleSelect(item.productId._id)} 
                    style={styles.checkbox}
                  />
                  <img 
                    src={item.productId.images?.[0]?.startsWith("http") ? item.productId.images[0] : `https://aroha.onrender.com/uploads/${item.productId.images?.[0]}`} 
                    alt={item.productId.name} 
                    style={styles.productImage} 
                  />
                  <div style={styles.productInfo}>
                    <h4 style={styles.productName}>{item.productId.name}</h4>
                    <p style={styles.productBrand}>{item.productId.brand}</p>
                    <div style={styles.priceRow}>
                      <span style={styles.currentPrice}>₹{getEffectiveUnitPrice(item.productId)}</span>
                      {item.productId.price > getEffectiveUnitPrice(item.productId) && (
                        <span style={styles.oldPrice}>₹{item.productId.price}</span>
                      )}
                    </div>
                    <div style={styles.quantityControl}>
                      <button onClick={() => updateQuantity(item.productId._id, false)} style={styles.qtyBtn}>-</button>
                      <span style={styles.qtyValue}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId._id, true)} style={styles.qtyBtn}>+</button>
                    </div>
                    <div style={styles.itemTotal}>
                      Total: <strong>₹{getEffectiveUnitPrice(item.productId) * item.quantity}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedItems.length > 0 && (
            <div style={styles.orderSummary}>
              <h3 style={styles.summaryTitle}>Order Summary</h3>
              <div style={styles.summaryDetails}>
                <div style={styles.summaryRow}>
                  <span>Subtotal ({selectedItems.length} items)</span>
                  <span>₹{totalAmount}</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div style={styles.summaryRow}>
                    <span>Coupon Discount</span>
                    <span style={{ color: "#d4af37" }}>-₹{discountAmount}</span>
                  </div>
                )}
                <div style={styles.summaryRow}>
                  <span>Delivery Charge</span>
                  <span>₹{deliveryCharge}</span>
                </div>
                <div style={{ ...styles.summaryRow, fontSize: "1.2rem", fontWeight: "700", borderTop: "1px solid #2a2a2a", paddingTop: "12px" }}>
                  <span>Total Payable</span>
                  <span style={{ color: "#44ff37", fontSize: "1.4rem" }}>₹{finalAmountToPay}</span>
                </div>
              </div>

              <div style={styles.couponArea}>
                <input 
                  type="text" 
                  placeholder="Coupon code" 
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
              {couponError && <p style={styles.errorMsg}>{couponError}</p>}
              {appliedCoupon && discountAmount > 0 && <p style={styles.successMsg}>✓ Discount applied</p>}
              
              {checkoutSettings && (
                <div style={styles.deliveryInfo}>
                  <FaTruck style={{ marginRight: "8px", color: "#d4af37" }} />
                  <span>{checkoutSettings.message}</span>
                </div>
              )}

              <button
                style={checkoutSettings?.checkoutEnabled === false ? styles.disabledCheckoutBtn : styles.checkoutBtn}
                onClick={() => setShowOrderModal(true)}
                disabled={checkoutSettings?.checkoutEnabled === false}
              >
                {checkoutSettings?.checkoutEnabled === false ? "Checkout Disabled" : "Proceed to Checkout"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Previous Orders Section */}
      {previousOrders.length > 0 && (
        <div style={styles.previousOrders}>
          <h3 style={styles.previousTitle}>Recent Orders</h3>
          <div style={styles.ordersGrid}>
            {previousOrders.slice(0, 3).map(order => (
              <div key={order._id} style={styles.orderCard}>
                <div style={styles.orderHeader}>
                  <span style={styles.orderId}>#{order._id.slice(-8).toUpperCase()}</span>
                  <span style={{ ...styles.orderStatus, color: order.status === "delivered" ? "#d4af37" : "#888" }}>{order.status}</span>
                </div>
                <div style={styles.orderItems}>
                  {order.items.slice(0, 2).map((item, idx) => (
                    <span key={idx}>{item.productId.name} x{item.quantity}</span>
                  ))}
                  {order.items.length > 2 && <span>+{order.items.length - 2} more</span>}
                </div>
                <div style={styles.orderTotal}>₹{Math.round(order.totalAmount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContainer}>
            <h3 style={styles.modalTitle}>Delivery Details</h3>
            <input 
              type="text" 
              placeholder="Full Name" 
              value={customerDetails.name} 
              onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} 
              style={styles.modalInput} 
            />
            <input 
              type="tel" 
              placeholder="Mobile Number" 
              value={customerDetails.mobile} 
              onChange={e => setCustomerDetails({...customerDetails, mobile: e.target.value})} 
              style={styles.modalInput} 
            />
            <textarea 
              placeholder="Complete Address" 
              value={customerDetails.address} 
              onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} 
              style={styles.modalTextarea}
            />
            <div style={styles.modalActions}>
              <button style={styles.confirmOrderBtn} onClick={handlePlaceOrder}>Confirm Order</button>
              <button style={styles.cancelModalBtn} onClick={() => setShowOrderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: {
    maxWidth: "1780px",
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    backgroundColor: "#ffffff",
    minHeight: "100vh",
    color: "#ffffff"
  },
  headerSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: "1px solid #2a2a2a",
    paddingBottom: "16px",
    marginBottom: "32px",
    flexWrap: "wrap"
  },
  pageHeading: {
    fontSize: "2rem",
    fontWeight: "600",
    letterSpacing: "-0.5px",
    margin: 0,
    color: "#000000"
  },
  subHeading: {
    fontSize: "1rem",
    color: "#2d2727",
    margin: 0
  },
  emptyCart: {
    textAlign: "center",
    padding: "80px 20px",
    backgroundColor: "#626262",
    borderRadius: "24px",
    border: "1px solid #d23b3b"
  },
  continueShopBtn: {
    marginTop: "24px",
    padding: "12px 32px",
    backgroundColor: "#f4f4f4",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "40px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "1rem"
  },
  cartGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
    gap: "24px",
    marginBottom: "48px"
  },
  cartCard: {
    display: "flex",
    gap: "16px",
    backgroundColor: "#111111",
    borderRadius: "20px",
    padding: "16px",
    border: "1px solid #2a2a2a",
    position: "relative",
    transition: "all 0.2s ease"
  },
  checkbox: {
    position: "absolute",
    top: "16px",
    left: "16px",
    width: "20px",
    height: "20px",
    accentColor: "#73bbff",
    cursor: "pointer"
  },
  productImage: {
    width: "100px",
    height: "100px",
    objectFit: "cover",
    borderRadius: "12px",
    marginLeft: "28px"
  },
  productInfo: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  productName: {
    fontSize: "1rem",
    fontWeight: "600",
    margin: 0,
    color: "#ffffff"
  },
  productBrand: {
    fontSize: "0.8rem",
    color: "#ffe2e2",
    margin: 0
  },
  priceRow: {
    display: "flex",
    gap: "12px",
    alignItems: "center"
  },
  currentPrice: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#37ff00"
  },
  oldPrice: {
    fontSize: "0.85rem",
    textDecoration: "line-through",
    color: "#ffbebe"
  },
  quantityControl: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "4px"
  },
  qtyBtn: {
    width: "28px",
    height: "28px",
    borderRadius: "8px",
    border: "1px solid #2a2a2a",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "bold"
  },
  qtyValue: {
    minWidth: "24px",
    textAlign: "center",
    fontWeight: "500"
  },
  itemTotal: {
    fontSize: "0.9rem",
    color: "#cccccc",
    marginTop: "4px"
  },
  orderSummary: {
    backgroundColor: "#111111",
    borderRadius: "24px",
    padding: "28px",
    border: "1px solid #2a2a2a",
    maxWidth: "480px",
    margin: "0 auto"
  },
  summaryTitle: {
    fontSize: "1.4rem",
    fontWeight: "600",
    marginBottom: "20px",
    color: "#ffffff"
  },
  summaryDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "1rem",
    color: "#dddddd"
  },
  couponArea: {
    display: "flex",
    gap: "12px",
    margin: "24px 0 12px"
  },
  couponInput: {
    flex: 1,
    padding: "12px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    color: "#ffffff",
    outline: "none"
  },
  applyCouponBtn: {
    padding: "0 20px",
    backgroundColor: "#ffffff",
    color: "#0b0a0a",
    border: "none",
    borderRadius: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  removeCouponBtn: {
    padding: "0 20px",
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer"
  },
  errorMsg: {
    color: "#e74c3c",
    fontSize: "0.8rem",
    marginTop: "4px"
  },
  successMsg: {
    color: "#19d035",
    fontSize: "0.8rem",
    marginTop: "4px"
  },
  deliveryInfo: {
    marginTop: "20px",
    padding: "12px",
    backgroundColor: "#1a1a1a",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    fontSize: "0.85rem",
    color: "#ccc"
  },
  checkoutBtn: {
    width: "100%",
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#ffffff",
    color: "#0a0a0a",
    border: "none",
    borderRadius: "40px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer"
  },
  disabledCheckoutBtn: {
    width: "100%",
    marginTop: "24px",
    padding: "16px",
    backgroundColor: "#555",
    color: "#aaa",
    border: "none",
    borderRadius: "40px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "not-allowed"
  },
  previousOrders: {
    marginTop: "56px",
    borderTop: "1px solid #2a2a2a",
    paddingTop: "32px"
  },
  previousTitle: {
    fontSize: "1.3rem",
    fontWeight: "500",
    marginBottom: "20px",
    color: "#ffffff"
  },
  ordersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "20px"
  },
  orderCard: {
    backgroundColor: "#111111",
    borderRadius: "16px",
    padding: "16px",
    border: "1px solid #2a2a2a"
  },
  orderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "12px"
  },
  orderId: {
    fontFamily: "monospace",
    fontSize: "0.8rem",
    color: "#ffbdbd"
  },
  orderStatus: {
    fontSize: "0.7rem",
    textTransform: "uppercase"
  },
  orderItems: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    fontSize: "0.8rem",
    color: "#ffffff",
    marginBottom: "12px"
  },
  orderTotal: {
    fontSize: "1.1rem",
    fontWeight: "700",
    color: "#ffffff",
    textAlign: "right"
  },
  loginPrompt: {
    textAlign: "center",
    padding: "60px",
    color: "#fff",
    backgroundColor: "#0a0a0a",
    minHeight: "100vh"
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(6px)"
  },
  modalContainer: {
    backgroundColor: "#111111",
    borderRadius: "28px",
    padding: "32px",
    width: "90%",
    maxWidth: "480px",
    border: "1px solid #ffffff"
  },
  modalTitle: {
    fontSize: "1.5rem",
    marginBottom: "24px",
    color: "#ffffff"
  },
  modalInput: {
    width: "100%",
    padding: "14px",
    marginBottom: "16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1rem",
    boxSizing: "border-box"
  },
  modalTextarea: {
    width: "100%",
    padding: "14px",
    marginBottom: "24px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "1rem",
    minHeight: "100px",
    fontFamily: "inherit",
    boxSizing: "border-box"
  },
  modalActions: {
    display: "flex",
    gap: "16px"
  },
  confirmOrderBtn: {
    flex: 2,
    padding: "14px",
    backgroundColor: "#52e629",
    color: "#ffffff",
    border: "none",
    borderRadius: "40px",
    fontWeight: "700",
    cursor: "pointer"
  },
  cancelModalBtn: {
    flex: 1,
    padding: "14px",
    backgroundColor: "#2a2a2a",
    color: "#fff",
    border: "none",
    borderRadius: "40px",
    cursor: "pointer"
  }
};

export default Cart;