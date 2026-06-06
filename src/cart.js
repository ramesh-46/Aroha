import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "./sweetalertConfig";
import { FaTrashAlt, FaTruck, FaShoppingBag, FaSearch, FaFilter, FaMinus, FaPlus, FaChevronDown } from "react-icons/fa";

// --- ICONS COMPONENT ---
const IconSVG = ({ name }) => {
  const paths = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    cart: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm11 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  };

  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={paths[name]} />
    </svg>
  );
};

function Cart() {
  // --- STATE MANAGEMENT ---
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
  const [activeTab, setActiveTab] = useState("cart");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const user = JSON.parse(localStorage.getItem("user"));
  const navigate = useNavigate();

  // --- EFFECTS ---
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
        () => {} // Ignore error
      );
    }
  }, []);

  // --- API CALLS ---
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`https://aroha.onrender.com/cart/${user._id}`);
      setCart(res.data);
      if (res.data.items.length > 0 && selectedItems.length === 0) {
        setSelectedItems(res.data.items.map(i => i.productId._id));
      }
    } catch (err) {
      console.error("Fetch Cart Error:", err);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    try {
      const res = await axios.get(`https://aroha.onrender.com/orders/${user._id}`);
      setPreviousOrders(res.data);
    } catch (err) {
      console.error("Fetch Orders Error:", err);
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

  // --- LOGIC HELPERS ---
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

  // --- HANDLERS ---
  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    if (tabId === "home") {
      navigate("/maindashboard");
    } else if (tabId === "heart") {
      navigate("/wishlist");
    } else if (tabId === "cart") {
      navigate("/cart");
    } else if (tabId === "user") {
      navigate("/profile");
    }
  };

  const toggleSelect = (productId) => {
    if (selectedItems.includes(productId)) {
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } else {
      setSelectedItems([...selectedItems, productId]);
    }
  };

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
      Swal.fire("Error", "Could not update quantity", "error");
    }
  };

  const removeItem = async (productId) => {
    try {
      await axios.delete(`https://aroha.onrender.com/cart/removeItem/${user._id}/${productId}`);
      fetchCart();
      setSelectedItems(selectedItems.filter(id => id !== productId));
    } catch (err) {
      console.log(err);
    }
  };

  const handleApplyCoupon = async () => {
    try {
      setCouponError("");
      const selectedCartItems = cart.items
        .filter((item) => selectedItems.includes(item.productId._id))
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        }));

      if (selectedCartItems.length === 0) {
        setCouponError("Select items to apply coupon");
        return;
      }

      const res = await axios.post("https://aroha.onrender.com/coupons/apply", {
        code: couponCode,
        items: selectedCartItems
      });

      if (res.data.success) {
        const coupon = res.data.coupon;
        setAppliedCoupon({ ...coupon, computedDiscountAmount: res.data.discountAmount });
        setCouponError("");
        Swal.fire("Success", "Coupon applied!", "success");
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || "Invalid coupon");
      setAppliedCoupon(null);
    }
  };

  const handlePlaceOrder = async () => {
    const itemsToOrder = cart.items.filter(item => selectedItems.includes(item.productId._id));
    if (!itemsToOrder.length) return Swal.fire("Select items to order!", "", "error");

    if (!customerDetails.name || !customerDetails.mobile || !customerDetails.address) {
      return Swal.fire("Details Missing", "Please fill in all delivery details.", "warning");
    }

    if (checkoutSettings && checkoutSettings.checkoutEnabled === false) {
      return Swal.fire("Checkout Disabled", "Checkout is temporarily disabled by admin.", "warning");
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
      Swal.fire("Order Failed", "Could not place order. Please try again.", "error");
    }
  };

  // --- CALCULATIONS ---
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

  if (!user) return <div className="cart-login-prompt">Please log in to view your cart.</div>;

  return (
    <div className="cart-page-container">
      {/* INJECT CSS STYLES */}
      <style>{`
        .cart-page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          min-height: calc(100vh - 80px);
          padding-bottom: ${isMobile ? '80px' : '20px'};
        }

        /* Header */
        .cart-header {
          display: ${isMobile ? 'none' : 'flex'};
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          color: #000;
          letter-spacing: 1px;
        }

        .header-center {
          flex: 1;
          max-width: 500px;
          margin: 0 20px;
          position: relative;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1px solid #ddd;
          border-radius: 20px;
          padding: 8px 16px;
          width: 100%;
        }

        .search-bar input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
          color: #666;
        }

        .search-bar .search-icon {
          color: #999;
          margin-right: 8px;
        }

        .search-bar .dropdown-icon {
          color: #999;
          margin-left: 8px;
        }

        .header-right {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .nav-item-desktop {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: #666;
          font-size: 0.8rem;
          gap: 4px;
          cursor: pointer;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .nav-item-desktop:hover, .nav-item-desktop.active {
          color: #000;
          background: #f3f4f6;
          font-weight: 600;
        }

        /* Layout Grid */
        .cart-content-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .cart-content-grid { grid-template-columns: 1fr; }
        }

        /* Cart Items List */
        .cart-list {
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .cart-item-row {
          display: flex;
          padding: 20px;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.2s;
        }
        .cart-item-row:last-child { border-bottom: none; }
        .cart-item-row:hover { background-color: #fafafa; }

        .item-left { display: flex; gap: 16px; flex: 1; }
        .item-checkbox { margin-top: 10px; accent-color: #000; transform: scale(1.2); cursor: pointer; }
        .item-image {
          width: 100px;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        .item-details { flex: 1; display: flex; flex-direction: column; justify-content: center; }
        .item-name { font-weight: 600; font-size: 1rem; margin: 0 0 4px 0; color: #111; }
        .item-brand { font-size: 0.85rem; color: #6b7280; margin: 0 0 8px 0; }
        .item-price-box { display: flex; gap: 8px; align-items: center; }
        .price-current { font-weight: 700; color: #059669; font-size: 1.1rem; }
        .price-old { text-decoration: line-through; color: #9ca3af; font-size: 0.9rem; }

        .item-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          min-width: 140px;
        }
        .qty-control {
          display: flex;
          align-items: center;
          background: #f3f4f6;
          border-radius: 6px;
          padding: 4px;
        }
        .qty-btn {
          background: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #374151;
        }
        .qty-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .qty-val { margin: 0 10px; font-weight: 600; font-size: 0.95rem; }

        .item-total-price { font-weight: 700; font-size: 1.1rem; color: #111; margin-top: auto; }
        .remove-btn {
          background: none;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 0.85rem;
          margin-top: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .remove-btn:hover { text-decoration: underline; }

        /* Order Summary */
        .order-summary-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          position: sticky;
          top: 20px;
        }
        .summary-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 20px; color: #111; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; color: #4b5563; font-size: 0.95rem; }
        .summary-total {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
          margin-top: 16px;
          font-weight: 800;
          font-size: 1.2rem;
          color: #111;
          display: flex;
          justify-content: space-between;
        }
        .total-green { color: #059669; }

        /* Coupon */
        .coupon-box { display: flex; gap: 8px; margin: 20px 0; }
        .coupon-input {
          flex: 1;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          outline: none;
        }
        .coupon-btn {
          padding: 10px 16px;
          background: #111;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }
        .coupon-error { color: #ef4444; font-size: 0.85rem; margin-top: -10px; margin-bottom: 10px; }
        .coupon-success { color: #059669; font-size: 0.85rem; margin-top: -10px; margin-bottom: 10px; }

        /* Checkout Button */
        .checkout-btn {
          width: 100%;
          padding: 14px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }
        .checkout-btn:hover { background: #047857; }
        .checkout-btn:disabled { background: #9ca3af; cursor: not-allowed; }

        /* Empty State */
        .empty-cart-state {
          text-align: center;
          padding: 60px 20px;
          background: white;
          border-radius: 12px;
        }
        .empty-icon { color: #d4af37; margin-bottom: 16px; }
        .shop-now-btn {
          margin-top: 20px;
          padding: 12px 24px;
          background: #111;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
        }

        /* Modal */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          width: 90%;
          max-width: 450px;
        }
        .modal-input {
          width: 100%;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          box-sizing: border-box;
        }
        .modal-actions { display: flex; gap: 12px; margin-top: 10px; }
        .btn-confirm { flex: 2; background: #059669; color: white; padding: 12px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .btn-cancel { flex: 1; background: #f3f4f6; color: #374151; padding: 12px; border: none; border-radius: 8px; cursor: pointer; }

        /* Bottom Nav Mobile */
        .bottom-nav-mobile {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: white;
          border-top: 1px solid #eee;
          display: ${isMobile ? 'flex' : 'none'};
          justify-content: space-around;
          padding: 10px 0;
          z-index: 900;
        }
        .nav-item {
          display: flex; flex-direction: column; align-items: center;
          color: #9ca3af; font-size: 0.75rem; gap: 4px; cursor: pointer;
        }
        .nav-item.active { color: #000; font-weight: 600; }

        .login-prompt { text-align: center; padding: 50px; font-size: 1.2rem; color: #666; }
      `}</style>

      {/* HEADER (ONLY ON LARGE SCREENS) */}
      {!isMobile && (
        <div className="cart-header">
          <div className="header-left">
            <div className="logo">AROHA HUB</div>
          </div>
          <div className="header-center">
            <div className="search-bar">
              <FaSearch className="search-icon" size={14} />
              <input type="text" placeholder="Search luxury items..." />
              <FaChevronDown className="dropdown-icon" size={12} />
            </div>
          </div>
          <div className="header-right">
            {[
              { id: "home", label: "Home" },
              { id: "heart", label: "Wishlist" },
              { id: "cart", label: "Cart" },
              { id: "user", label: "Profile" }
            ].map((tab) => (
              <div
                key={tab.id}
                className={`nav-item-desktop ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => handleNavClick(tab.id)}
              >
                <IconSVG name={tab.id} />
                <span>{tab.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="empty-cart-state">
          <FaShoppingBag size={64} className="empty-icon" />
          <h3>Your cart is empty</h3>
          <p>Looks like you haven't added anything yet.</p>
          <button className="shop-now-btn" onClick={() => navigate("/maindashboard")}>Start Shopping</button>
        </div>
      ) : (
        <div className="cart-content-grid">
          {/* LEFT COLUMN: CART ITEMS */}
          <div className="cart-list">
            {cart.items.map(item => {
              const isSelected = selectedItems.includes(item.productId._id);
              const unitPrice = getEffectiveUnitPrice(item.productId);
              const itemTotal = unitPrice * item.quantity;

              return (
                <div key={item.productId._id} className="cart-item-row">
                  <div className="item-left">
                    <input
                      type="checkbox"
                      className="item-checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.productId._id)}
                    />
                    <img
                      src={item.productId.images?.[0]?.startsWith("http") ? item.productId.images[0] : `https://aroha.onrender.com/uploads/${item.productId.images?.[0]}`}
                      alt={item.productId.name}
                      className="item-image"
                    />
                    <div className="item-details">
                      <h4 className="item-name">{item.productId.name}</h4>
                      <p className="item-brand">{item.productId.brand}</p>
                      <div className="item-price-box">
                        <span className="price-current">₹{unitPrice.toLocaleString()}</span>
                        {item.productId.price > unitPrice && (
                          <span className="price-old">₹{item.productId.price.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="item-right">
                    <div className="qty-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId._id, false)}
                        disabled={item.quantity <= 1}
                      >
                        <FaMinus size={10} />
                      </button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId._id, true)}
                      >
                        <FaPlus size={10} />
                      </button>
                    </div>
                    <div className="item-total-price">
                      ₹{itemTotal.toLocaleString()}
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => removeItem(item.productId._id)}
                    >
                      <FaTrashAlt size={12} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          {selectedItems.length > 0 ? (
            <div className="order-summary-card">
              <h3 className="summary-title">Order Summary</h3>

              <div className="summary-row">
                <span>Subtotal ({selectedItems.length} items)</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>

              {appliedCoupon && discountAmount > 0 && (
                <div className="summary-row" style={{ color: "#059669" }}>
                  <span>Coupon Discount</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}

              <div className="summary-row">
                <span>Delivery Charge</span>
                <span>₹{deliveryCharge.toLocaleString()}</span>
              </div>

              <div className="summary-total">
                <span>Total Payable</span>
                <span className="total-green">₹{finalAmountToPay.toLocaleString()}</span>
              </div>

              <div className="coupon-box">
                <input
                  type="text"
                  className="coupon-input"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={appliedCoupon !== null}
                />
                {appliedCoupon ? (
                  <button className="coupon-btn" style={{background: '#ef4444'}} onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}>Remove</button>
                ) : (
                  <button className="coupon-btn" onClick={handleApplyCoupon}>Apply</button>
                )}
              </div>

              {couponError && <p className="coupon-error">{couponError}</p>}
              {appliedCoupon && discountAmount > 0 && <p className="coupon-success">✓ Coupon applied successfully</p>}

              {checkoutSettings && (
                <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaTruck /> {checkoutSettings.message}
                </div>
              )}

              <button
                className="checkout-btn"
                onClick={() => setShowOrderModal(true)}
                disabled={checkoutSettings?.checkoutEnabled === false}
              >
                {checkoutSettings?.checkoutEnabled === false ? "Checkout Disabled" : "Proceed to Checkout"}
              </button>
            </div>
          ) : (
            <div className="order-summary-card" style={{ textAlign: 'center', color: '#666' }}>
              <p>Select items to view summary</p>
            </div>
          )}
        </div>
      )}

      {/* PREVIOUS ORDERS */}
      {previousOrders.length > 0 && (
        <div style={{ marginTop: '40px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px' }}>Recent Orders</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {previousOrders.slice(0, 3).map(order => (
              <div key={order._id} style={{ background: 'white', padding: '16px', borderRadius: '8px', border: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#666' }}>#{order._id.slice(-8).toUpperCase()}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: '600', color: order.status === "delivered" ? "#059669" : "#666" }}>{order.status}</span>
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '8px' }}>
                  {order.items.slice(0, 1).map((item, idx) => (
                    <span key={idx}>{item.productId.name} x{item.quantity}</span>
                  ))}
                  {order.items.length > 1 && <span style={{color: '#999'}}> +{order.items.length - 1} more</span>}
                </div>
                <div style={{ fontWeight: '700' }}>₹{Math.round(order.totalAmount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ORDER MODAL */}
      {showOrderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Delivery Details</h3>
            <input
              type="text"
              className="modal-input"
              placeholder="Full Name"
              value={customerDetails.name}
              onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})}
            />
            <input
              type="tel"
              className="modal-input"
              placeholder="Mobile Number"
              value={customerDetails.mobile}
              onChange={e => setCustomerDetails({...customerDetails, mobile: e.target.value})}
            />
            <textarea
              className="modal-input"
              placeholder="Complete Address"
              value={customerDetails.address}
              onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})}
              rows="3"
            />
            <div className="modal-actions">
              <button className="btn-confirm" onClick={handlePlaceOrder}>Confirm Order</button>
              <button className="btn-cancel" onClick={() => setShowOrderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAV (ONLY ON SMALL SCREENS) */}
      <div className="bottom-nav-mobile">
        {[
          { id: "home", label: "Home" },
          { id: "heart", label: "Wishlist" },
          { id: "cart", label: "Cart" },
          { id: "user", label: "Profile" }
        ].map((tab) => (
          <div
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleNavClick(tab.id)}
          >
            <IconSVG name={tab.id} />
            <span>{tab.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Cart;
