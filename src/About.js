import React from "react";

function About() {
  return (
    <div style={container}>
      <h1 style={title}>About AROHA HUB</h1>

      <div style={section}>
        <h2 style={sectionTitle}>Welcome to AROHA HUB</h2>
        <p style={paragraph}>
          AROHA HUB is a small eCommerce platform connecting local sellers and buyers. 
          Our mission is to make it easy for sellers to start their business legally without licences or GST, and for users to discover and purchase unique products directly from them. 
          All operations follow the rules for unregistered small sellers in India, ensuring a safe and legal environment.
        </p>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>For Sellers 🟢</h2>
        <p style={paragraph}>
          Sellers can list products and sell legally without GST or business registration, if they follow these conditions:
        </p>
        <ol style={list}>
          <li>Sell only within their own state (no inter-state sales).</li>
          <li>Keep yearly income below ₹20 lakh (₹10 lakh in North-East states).</li>
          <li>Avoid selling on marketplaces that require GST like Amazon, Flipkart, or Meesho.</li>
          <li>Receive payments via personal UPI or bank accounts (Google Pay, PhonePe, Paytm Personal).</li>
          <li>Mention “No GST applicable” on invoices, messages, or receipts.</li>
        </ol>
        <p style={note}>✅ Legally allowed as an unregistered small seller in India.</p>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>For Buyers 🟢</h2>
        <p style={paragraph}>
          Buyers can safely browse and purchase products directly from local sellers on AROHA HUB. 
          As sellers are small-scale and unregistered, products are sold legally without GST. 
          Payments are handled securely via personal UPI or bank transfers, and buyers are advised to check product details and seller information before purchase.
        </p>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>Restrictions Sellers Must Know 🔴</h2>
        <p style={paragraph}>
          Sellers must obtain GST registration or other licences if they:
        </p>
        <ul style={list}>
          <li>Sell on large online marketplaces (Amazon, Flipkart, Meesho).</li>
          <li>Sell outside their state (interstate sales).</li>
          <li>Have a turnover above ₹20 lakh/year.</li>
          <li>Want to print invoices legally or claim business expenses.</li>
          <li>Open a business bank account or integrate payment gateways requiring GST.</li>
        </ul>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>⚙ How to Start Selling Legally</h2>
        <ol style={list}>
          <li>Create an Instagram page, WhatsApp Business account, or small website.</li>
          <li>Add product pictures, description, and prices.</li>
          <li>Receive payments via personal UPI accounts.</li>
          <li>Ship items manually using India Post or courier services with personal details.</li>
          <li>Always mention “No GST applicable” on invoices or receipts.</li>
        </ol>
        <p style={note}>This ensures you operate legally under Indian small seller laws.</p>
      </div>

      <div style={section}>
        <h2 style={sectionTitle}>🧾 Summary — Selling Without Licence</h2>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Activity</th>
              <th style={th}>Legal Without Licence?</th>
              <th style={th}>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sell products on Instagram/WhatsApp locally</td>
              <td>✅</td>
              <td>Within state only</td>
            </tr>
            <tr>
              <td>Receive payment via personal UPI</td>
              <td>✅</td>
              <td>Small scale, personal accounts</td>
            </tr>
            <tr>
              <td>Sell on Amazon/Flipkart</td>
              <td>❌</td>
              <td>GST registration required</td>
            </tr>
            <tr>
              <td>Sell outside state</td>
              <td>❌</td>
              <td>GST registration required</td>
            </tr>
            <tr>
              <td>Annual sales &lt; ₹20 lakh</td>
              <td>✅</td>
              <td>No GST needed</td>
            </tr>
            <tr>
              <td>Annual sales &gt; ₹20 lakh</td>
              <td>❌</td>
              <td>GST mandatory</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={section}>
        <p style={footerNote}>
          AROHA HUB enables small sellers to operate legally and allows buyers to discover and purchase unique products safely. 
          This platform is designed for hobbyists, local sellers, and small businesses under the legal unregistered small seller rules in India.
        </p>
      </div>
    </div>
  );
}

// ===== STYLES =====
const container = {
  maxWidth: "900px",
  margin: "50px auto",
  padding: "30px",
  border: "1px solid #ccc",
  borderRadius: "12px",
  backgroundColor: "#fdfdfd",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  lineHeight: 1.6,
};

const title = {
  textAlign: "center",
  fontSize: "36px",
  marginBottom: "30px",
  color: "#000",
};

const section = {
  marginBottom: "30px",
};

const sectionTitle = {
  fontSize: "24px",
  marginBottom: "15px",
  color: "#111",
};

const paragraph = {
  fontSize: "16px",
  marginBottom: "15px",
  color: "#333",
};

const list = {
  marginLeft: "20px",
  marginBottom: "15px",
};

const note = {
  fontSize: "15px",
  color: "#006400",
  fontWeight: "600",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "15px",
};

const th = {
  border: "1px solid #ccc",
  padding: "10px",
  background: "#f2f2f2",
  textAlign: "left",
};

const footerNote = {
  fontSize: "16px",
  fontStyle: "italic",
  color: "#555",
};

export default About;
