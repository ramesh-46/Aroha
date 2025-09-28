import React, { useEffect, useState } from "react";
import axios from "axios";

function Cart() {
  const [cart, setCart] = useState({ items: [] });
  const [selectedItems, setSelectedItems] = useState([]);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({ name: "", mobile: "", address: "" });
  const [previousOrders, setPreviousOrders] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

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

  useEffect(() => {
    fetchCart();
    fetchOrders();
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
    .reduce((sum, item) => sum + (item.productId.finalPrice || item.productId.price) * item.quantity, 0);

  // Place order
  const handlePlaceOrder = async () => {
    const itemsToOrder = cart.items.filter(item => selectedItems.includes(item.productId._id));
    if (!itemsToOrder.length) return alert("Select items to order!");

    try {
      const formattedItems = itemsToOrder.map(i => ({
        productId: i.productId._id,
        quantity: i.quantity
      }));

      await axios.post("https://aroha.onrender.com/orders", {
        userId: user._id,
        items: formattedItems,
        customerName: customerDetails.name,
        customerMobile: customerDetails.mobile,
        deliveryAddress: customerDetails.address
      });

      // Remove ordered items from cart
      for (let i of itemsToOrder) {
        await axios.delete(`https://aroha.onrender.com/cart/removeItem/${user._id}/${i.productId._id}`);
      }

      setShowOrderModal(false);
      setSelectedItems([]);
      setCustomerDetails({ name: "", mobile: "", address: "" });
      fetchCart();
      fetchOrders();
      alert("✅ Order placed successfully! Our agent will contact you.");
    } catch (err) {
      console.log(err);
      alert("Failed to place order. Check console.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "15px" }}>🛒 Your Cart</h2>

      {cart.items.length === 0 ? <p>Your cart is empty.</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: "15px" }}>
          {cart.items.map(item => (
            <div
              key={item.productId._id}
              style={{
                ...cartBox,
                border: selectedItems.includes(item.productId._id) ? "2px solid green" : "1px solid #ccc",
                background: selectedItems.includes(item.productId._id) ? "#f0fff0" : "#fff"
              }}
            >
              <input type="checkbox" checked={selectedItems.includes(item.productId._id)} onChange={() => toggleSelect(item.productId._id)} />
              <img src={`https://aroha.onrender.com/uploads/${item.productId.images?.[0]}`} alt={item.productId.name} style={imgStyle} />
              <h4>{item.productId.name}</h4>
              <p>Price: ₹{item.productId.finalPrice || item.productId.price}</p>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "5px", marginTop: "5px" }}>
                <button onClick={() => updateQuantity(item.productId._id, false)} style={qtyBtn}>-</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId._id, true)} style={qtyBtn}>+</button>
              </div>
              <p>Total: ₹{(item.productId.finalPrice || item.productId.price) * item.quantity}</p>
            </div>
          ))}
        </div>
      )}

      {/* Invoice & Place Order */}
      {selectedItems.length > 0 && (
        <div style={invoiceBox}>
          <h3>Invoice</h3>
          <ul>
            {cart.items.filter(item => selectedItems.includes(item.productId._id)).map(item => (
              <li key={item.productId._id}>{item.productId.name} x {item.quantity} = ₹{(item.productId.finalPrice || item.productId.price) * item.quantity}</li>
            ))}
          </ul>
          <h4>Total: ₹{totalAmount}</h4>
          <button style={orderBtn} onClick={() => setShowOrderModal(true)}>Place Order</button>
        </div>
      )}

      {/* Customer Details Modal */}
      {showOrderModal && (
        <div style={modalStyle}>
          <div style={modalContent}>
            <h3>Enter Customer Details</h3>
            <input type="text" placeholder="Name" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} style={inputStyle} />
            <input type="text" placeholder="Mobile" value={customerDetails.mobile} onChange={e => setCustomerDetails({...customerDetails, mobile: e.target.value})} style={inputStyle} />
            <textarea placeholder="Delivery Address" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})} style={inputStyle} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
              <button style={orderBtn} onClick={handlePlaceOrder}>Confirm Order</button>
              <button style={cancelBtn} onClick={() => setShowOrderModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Previous Orders */}
      {previousOrders.length > 0 && (
        <div style={{ marginTop: "40px" }}>
          <h3>📦 Previous Orders</h3>
          {previousOrders.map(order => (
            <div key={order._id} style={{ ...cartBox, border: "1px dashed #888", background: "#fafafa" }}>
              <p><b>Order ID:</b> {order._id}</p>
              <p><b>Status:</b> {order.status}</p>
              <ul>
                {order.items.map(i => (
                  <li key={i.productId}>{i.productId.name} x {i.quantity}</li>
                ))}
              </ul>
              <p><b>Delivery:</b> {order.deliveryAddress}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

// Styles
const cartBox = { padding: "10px", border: "1px solid #ccc", borderRadius: "8px", textAlign: "center", transition: "0.2s" };
const imgStyle = { width: "100%", height: "120px", objectFit: "cover", borderRadius: "5px" };
const invoiceBox = { marginTop: "20px", padding: "15px", border: "1px solid #888", borderRadius: "8px", background: "#f9f9f9" };
const orderBtn = { padding: "8px 15px", background: "green", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "10px", marginRight: "10px" };
const cancelBtn = { padding: "8px 15px", background: "red", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer", marginTop: "10px" };
const modalStyle = { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" };
const modalContent = { background: "#fff", padding: "20px", borderRadius: "10px", width: "400px", display: "flex", flexDirection: "column", gap: "10px" };
const inputStyle = { padding: "8px", borderRadius: "5px", border: "1px solid #ccc", width: "100%" };
const qtyBtn = { padding: "3px 8px", borderRadius: "5px", cursor: "pointer" };

export default Cart;
