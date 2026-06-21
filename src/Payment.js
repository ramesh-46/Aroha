import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import Swal from "sweetalert2";
import Tesseract from "tesseract.js";
import { 
  FaShieldAlt, 
  FaCheckCircle, 
  FaUpload, 
  FaFileInvoiceDollar, 
  FaUser, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaQrcode, 
  FaShareAlt, 
  FaSpinner,
  FaReceipt,
  FaMobileAlt,
  FaGooglePay, // Note: react-icons might not have specific brand icons for all, using generic or text
  FaWallet
} from "react-icons/fa";

// Simple SVG Icons for UPI Apps to ensure they render without external dependencies issues
const AppIcons = {
  gpay: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21.6 12.27C21.6 11.48 21.53 10.73 21.4 10H12V13.8H17.45C17.21 15.09 16.48 16.18 15.4 16.9V19.4H18.65C20.55 17.65 21.6 15.09 21.6 12.27Z" fill="#4285F4"/><path d="M12 22C14.7 22 16.95 21.1 18.65 19.4L15.4 16.9C14.48 17.52 13.35 17.88 12 17.88C9.4 17.88 7.2 16.13 6.4 13.75H3.05V16.35C4.75 19.7 8.15 22 12 22Z" fill="#34A853"/><path d="M6.4 13.75C6.2 13.15 6.08 12.5 6.08 11.85C6.08 11.2 6.2 10.55 6.4 9.95V7.35H3.05C2.35 8.75 2 10.25 2 11.85C2 13.45 2.35 14.95 3.05 16.35L6.4 13.75Z" fill="#FBBC05"/><path d="M12 5.82C13.45 5.82 14.75 6.32 15.8 7.32L18.7 4.42C16.95 2.78 14.7 1.7 12 1.7C8.15 1.7 4.75 4 3.05 7.35L6.4 9.95C7.2 7.57 9.4 5.82 12 5.82Z" fill="#EA4335"/></svg>,
  phonepe: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#5f259f"/><path d="M12 6C8.686 6 6 8.686 6 12C6 15.314 8.686 18 12 18C15.314 18 18 15.314 18 12C18 8.686 15.314 6 12 6ZM12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16Z" fill="white"/><path d="M12 10C10.895 10 10 10.895 10 12C10 13.105 10.895 14 12 14C13.105 14 14 13.105 14 12C14 10.895 13.105 10 12 10Z" fill="#5f259f"/></svg>,
  paytm: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#00BAF2"/><path d="M7 7H10V17H7V7Z" fill="white"/><path d="M14 7H17V17H14V7Z" fill="white"/><path d="M10 10H14V14H10V10Z" fill="white"/></svg>,
  bhim: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#E31E24"/><path d="M12 6L18 18H6L12 6Z" fill="white"/><path d="M12 10L15 16H9L12 10Z" fill="#E31E24"/></svg>,
  supermoney: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#000000"/><text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">SM</text></svg>
};

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State
  const [transactionId, setTransactionId] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [ocrData, setOcrData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [file, setFile] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect Device Type
  useEffect(() => {
    const checkMobile = () => {
      const ua = navigator.userAgent || navigator.vendor || window.opera;
      return (/android/i.test(ua) || /iPad|iPhone|iPod/.test(ua));
    };
    setIsMobile(checkMobile());
  }, []);

  // Load order data
  useEffect(() => {
    if (!location.state || !location.state.orderId) {
      console.warn("No valid order data found. Redirecting to cart.");
      navigate("/cart", { replace: true });
      return;
    }
    setOrderData(location.state);
  }, [location.state, navigate]);

  // --- DEEP LINKING LOGIC ---
  const handleAppPayment = (appName) => {
    if (!orderData?.upiUrl) return;

    // Construct Deep Links based on App
    // Note: upi://pay?pa=...&pn=...&am=...&cu=INR is the standard
    // Some apps support specific schemes like tez:// for GPay, but upi:// is universal
    
    let url = orderData.upiUrl; 
    
    // Optional: Add specific parameters for better compatibility if needed
    // For now, the standard UPI URL generated in backend works for all
    
    try {
      window.location.href = url;
      
      // Fallback timeout: If app doesn't open in 2 seconds, show QR
      setTimeout(() => {
        // If user is still on this page, it likely failed to open app
        Swal.fire({
          title: "App didn't open?",
          text: "Please make sure the app is installed, or scan the QR code below.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Show QR Code",
          cancelButtonText: "Try Again"
        }).then((result) => {
          if (result.isConfirmed) {
            document.getElementById('qr-section')?.scrollIntoView({ behavior: 'smooth' });
          } else if (result.dismiss === Swal.DismissReason.cancel) {
            window.location.href = url;
          }
        });
      }, 2000);
      
    } catch (err) {
      console.error("Deep link error", err);
      Swal.fire("Error", "Could not open payment app. Please use QR Code.", "error");
    }
  };

  // --- ADVANCED OCR LOGIC ---
  const handleScreenshotUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setScreenshot(URL.createObjectURL(uploadedFile));
    setIsLoading(true);
    setOcrData(null); 

    try {
      const { data: { text } } = await Tesseract.recognize(uploadedFile, "eng", {
        logger: (m) => console.log(m),
      });

      const parsedData = parseOcrText(text);
      setOcrData(parsedData);
      
      if (parsedData.transactionId && parsedData.transactionId !== "-") {
        setTransactionId(parsedData.transactionId);
      }

    } catch (err) {
      console.error("OCR Error:", err);
      Swal.fire("Error", "Failed to extract text from screenshot", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const parseOcrText = (text) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lowerText = text.toLowerCase();
    
    const data = { transactionId: "-", amount: 0, upiApp: "Unknown", date: "-", receiverUpi: "-" };

    // 1. Detect App Name
    if (lowerText.includes("phonepe")) data.upiApp = "PhonePe";
    else if (lowerText.includes("google pay") || lowerText.includes("gpay")) data.upiApp = "Google Pay";
    else if (lowerText.includes("paytm")) data.upiApp = "Paytm";
    else if (lowerText.includes("amazon pay")) data.upiApp = "Amazon Pay";
    else if (lowerText.includes("bhim")) data.upiApp = "BHIM";
    else if (lowerText.includes("supermoney")) data.upiApp = "SuperMoney";

    // 2. Extract Transaction ID / UTR
    const txnKeywords = ["upi transaction id", "transaction id", "utr no", "ref no", "reference no", "txn id"];
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();
      if (txnKeywords.some(kw => lineLower.includes(kw))) {
        let val = "";
        const parts = lines[i].split(/[: ]+/);
        if (parts.length > 1 && /\d/.test(parts[parts.length-1])) val = parts[parts.length-1];
        else if (lines[i+1]) val = lines[i+1];

        if (val) {
            const cleanVal = val.replace(/[^a-zA-Z0-9]/g, '');
            if (cleanVal.length > 8) {
                data.transactionId = cleanVal;
                break; 
            }
        }
      }
    }

    // 3. Extract Amount
    const amountRegex = /(?:₹|rs\.?\s*)([0-9,]+)/gi;
    let matches = [...text.matchAll(amountRegex)];
    if (matches.length > 0) {
        for (let match of matches) {
            const numStr = match[1].replace(/,/g, "");
            const num = parseInt(numStr, 10);
            if (num > 0) {
                data.amount = num;
                if (num >= 10) break; 
            }
        }
    }

    // 4. Extract Date/Time
    const dateRegex = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{4})|(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
    const timeRegex = /(\d{1,2}:\d{2}\s*(?:am|pm))/i;
    const dateMatch = text.match(dateRegex);
    const timeMatch = text.match(timeRegex);
    if (dateMatch) {
        data.date = dateMatch[0];
        if (timeMatch) data.date += ` ${timeMatch[0]}`;
    } else if (timeMatch) data.date = timeMatch[0];

    // 5. Receiver UPI ID
    const upiRegex = /([a-zA-Z0-9.\-_]+@[a-zA-Z]+)/;
    const upiMatch = text.match(upiRegex);
    if (upiMatch) data.receiverUpi = upiMatch[0];

    return data;
  };

  // --- SHARE QR FUNCTIONALITY ---
  const handleShareQR = async () => {
    if (!orderData?.upiUrl) return;
    const canvas = document.querySelector('canvas'); 
    if (canvas) {
        try {
            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], "payment-qr.png", { type: "image/png" });
                if (navigator.share) {
                    try {
                        await navigator.share({ title: 'Pay for Order', text: `Scan to pay ₹${orderData.amount}`, files: [file] });
                    } catch (e) { console.log('Share canceled'); }
                } else {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `payment-qr-${orderData.orderId}.png`;
                    a.click();
                }
            });
        } catch (err) { console.error("Share error", err); }
    }
  };

  // Handle Confirm
  const handleConfirmPayment = async () => {
    if (!transactionId) return Swal.fire("Error", "Please enter Transaction ID", "error");
    if (!file) return Swal.fire("Error", "Please upload payment screenshot", "error");
    
    const finalAmount = ocrData?.amount > 0 ? ocrData.amount : orderData.amount;

    try {
      const formData = new FormData();
      formData.append("orderId", orderData.orderId);
      formData.append("transactionId", transactionId);
      formData.append("ocrData", JSON.stringify(ocrData || {}));
      formData.append("screenshot", file);

      const response = await axios.post("https://aroha.onrender.com/payment/verify-payment", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        Swal.fire({
          title: "Success",
          text: "Order placed successfully! Verification pending.",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          navigate("/order-success", { state: { orderId: orderData.orderId } });
        });
      }
    } catch (err) {
      console.error("Payment confirmation error:", err);
      Swal.fire("Error", err.response?.data?.error || "Failed to confirm payment", "error");
    }
  };

  if (!orderData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f9fafb" }}>
        <div style={{ textAlign: "center" }}>
          <FaSpinner className="spin" size={40} color="#059669" />
          <p style={{ marginTop: "10px", color: "#666" }}>Loading Secure Gateway...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "40px auto", padding: "0 20px", fontFamily: "'Inter', sans-serif", color: "#1f2937" }}>
      
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#111", marginBottom: "8px" }}>Complete Payment</h1>
        <p style={{ color: "#6b7280" }}>Order #{orderData.orderId.slice(-8).toUpperCase()}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "30px", alignItems: "start" }}>
        
        {/* LEFT COLUMN: Info & QR */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Order Summary Card */}
          <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
            <h3 style={{ marginTop: 0, marginBottom: "20px", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaFileInvoiceDollar style={{ color: "#059669" }} /> Order Details
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "0.95rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "12px", borderBottom: "1px solid #f3f4f6" }}>
                <span style={{ color: "#6b7280" }}>Total Amount</span>
                <span style={{ fontWeight: "800", fontSize: "1.2rem", color: "#059669" }}>₹{orderData.amount?.toLocaleString()}</span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#374151" }}>
                <FaUser style={{ color: "#9ca3af", width: "16px" }} />
                <span>{orderData.customerDetails?.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#374151" }}>
                <FaPhone style={{ color: "#9ca3af", width: "16px" }} />
                <span>{orderData.customerDetails?.mobile}</span>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#374151" }}>
                <FaMapMarkerAlt style={{ color: "#9ca3af", width: "16px", marginTop: "4px" }} />
                <span style={{ lineHeight: "1.4" }}>{orderData.customerDetails?.address}</span>
              </div>
            </div>
          </div>

          {/* QR Code Card */}
          <div id="qr-section" style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6", textAlign: "center", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaQrcode style={{ color: "#059669" }} /> Scan to Pay
                </h3>
                <button 
                    onClick={handleShareQR}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#059669", fontSize: "0.9rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "5px" }}
                >
                    <FaShareAlt /> Share
                </button>
            </div>
            
            <div style={{ display: "inline-block", padding: "16px", background: "#fff", borderRadius: "12px", border: "2px dashed #e5e7eb", marginBottom: "16px" }}>
              <QRCodeCanvas value={orderData.upiUrl} size={200} />
            </div>
            
            <div style={{ background: "#f0fdf4", padding: "12px", borderRadius: "8px", marginBottom: "12px", display: "inline-block" }}>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "#065f46", fontWeight: "600" }}>
                {orderData.upiId}
              </p>
            </div>
            
            <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
              Use any UPI app (GPay, PhonePe, Paytm)
            </p>
          </div>

          {/* MOBILE ONLY: Direct App Buttons */}
          {isMobile && (
            <div style={{ background: "#ffffff", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f3f4f6" }}>
               <h3 style={{ margin: "0 0 16px 0", fontSize: "1.1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaMobileAlt style={{ color: "#059669" }} /> Pay Directly via App
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "16px" }}>
                Tap an app below to pay instantly without scanning.
              </p>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px" }}>
                {[
                  { name: "Google Pay", icon: AppIcons.gpay, color: "#fff", border: "#eee" },
                  { name: "PhonePe", icon: AppIcons.phonepe, color: "#5f259f", text: "#fff" },
                  { name: "Paytm", icon: AppIcons.paytm, color: "#00BAF2", text: "#fff" },
                  { name: "BHIM", icon: AppIcons.bhim, color: "#E31E24", text: "#fff" },
                  { name: "SuperMoney", icon: AppIcons.supermoney, color: "#000", text: "#fff" }
                ].map((app) => (
                  <button
                    key={app.name}
                    onClick={() => handleAppPayment(app.name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                      padding: "12px",
                      borderRadius: "10px",
                      border: `1px solid ${app.border || "transparent"}`,
                      background: app.color,
                      color: app.text || "#333",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "transform 0.1s"
                    }}
                    onMouseDown={(e) => e.target.style.transform = "scale(0.98)"}
                    onMouseUp={(e) => e.target.style.transform = "scale(1)"}
                  >
                    <app.icon />
                    <span>{app.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Verification Form */}
        <div style={{ background: "#ffffff", padding: "30px", borderRadius: "16px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "1px solid #f3f4f6" }}>
          <h3 style={{ marginTop: 0, marginBottom: "24px", fontSize: "1.25rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
            <FaCheckCircle style={{ color: "#059669" }} /> Verify Payment
          </h3>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.9rem", color: "#374151" }}>Transaction ID / UTR</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter 12-digit UTR or Transaction ID"
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "1rem",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", fontSize: "0.9rem", color: "#374151" }}>Upload Payment Screenshot</label>
            <div style={{ border: "2px dashed #d1d5db", borderRadius: "8px", padding: "20px", textAlign: "center", cursor: "pointer", background: "#f9fafb", transition: "all 0.2s" }}>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleScreenshotUpload}
                style={{ display: "none" }}
                id="screenshot-upload"
              />
              <label htmlFor="screenshot-upload" style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                {isLoading ? <FaSpinner className="spin" size={24} color="#059669"/> : <FaUpload size={24} style={{ color: "#9ca3af" }} />}
                <span style={{ fontSize: "0.9rem", color: "#6b7280" }}>
                    {isLoading ? "Processing Image..." : "Click to upload screenshot"}
                </span>
              </label>
            </div>
            
            {screenshot && !isLoading && (
              <div style={{ marginTop: "16px", borderRadius: "8px", overflow: "hidden", border: "1px solid #e5e7eb" }}>
                <img src={screenshot} alt="Preview" style={{ width: "100%", maxHeight: "180px", objectFit: "contain", background: "#f3f4f6" }} />
              </div>
            )}
          </div>

          {/* OCR Results Panel - WITH FALLBACK INPUTS */}
          {ocrData && (
            <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", marginBottom: "24px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ margin: "0 0 16px 0", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                <FaReceipt /> Auto-Detected Details
              </h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.95rem" }}>
                
                {/* Transaction ID */}
                <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Transaction ID</span>
                    <strong style={{ color: "#1f2937", wordBreak: "break-all" }}>{ocrData.transactionId}</strong>
                </div>

                {/* Amount (Editable if missing) */}
                <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Amount Paid</span>
                    {ocrData.amount > 0 ? (
                        <strong style={{ color: "#059669", fontSize: "1.1rem" }}>₹{ocrData.amount.toLocaleString()}</strong>
                    ) : (
                        <input 
                            type="number" 
                            placeholder="Enter Amount" 
                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px", color: "#ef4444", fontWeight: "bold" }}
                            onChange={(e) => setOcrData({...ocrData, amount: parseInt(e.target.value)})}
                        />
                    )}
                </div>

                {/* App Name */}
                <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Payment App</span>
                    <strong style={{ color: "#1f2937" }}>{ocrData.upiApp}</strong>
                </div>

                {/* Date (Editable if missing) */}
                <div>
                    <span style={{ display: "block", fontSize: "0.8rem", color: "#9ca3af", marginBottom: "4px" }}>Date & Time</span>
                    {ocrData.date !== "-" ? (
                        <strong style={{ color: "#1f2937" }}>{ocrData.date}</strong>
                    ) : (
                        <input 
                            type="text" 
                            placeholder="Enter Date/Time" 
                            style={{ width: "100%", padding: "6px", border: "1px solid #cbd5e1", borderRadius: "4px", color: "#ef4444", fontWeight: "bold" }}
                            onChange={(e) => setOcrData({...ocrData, date: e.target.value})}
                        />
                    )}
                </div>

              </div>
              <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "12px", fontStyle: "italic" }}>
                * If details are missing above, please edit the fields manually.
              </p>
            </div>
          )}

          <button
            onClick={handleConfirmPayment}
            style={{
              width: "100%",
              padding: "16px",
              background: "#059669",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "1.05rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: "0 4px 6px -1px rgba(5, 150, 105, 0.3)"
            }}
            onMouseOver={(e) => { e.target.style.background = "#047857"; e.target.style.transform = "translateY(-1px)"; }}
            onMouseOut={(e) => { e.target.style.background = "#059669"; e.target.style.transform = "translateY(0)"; }}
          >
            Confirm Payment & Place Order
          </button>
          
          <p style={{ textAlign: "center", fontSize: "0.8rem", color: "#9ca3af", marginTop: "16px" }}>
            <FaShieldAlt style={{ verticalAlign: "middle", marginRight: "4px" }} /> Your payment details are encrypted and secure.
          </p>
        </div>
      </div>
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
};

export default PaymentPage;