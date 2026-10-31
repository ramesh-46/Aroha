import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBox, FaTags, FaPercent, FaStore, FaUsers, FaHeadset, FaUserCircle,
  FaSignOutAlt, FaShoppingCart, FaChartLine, FaClipboardList, FaGift, FaArrowRight, FaShieldAlt
} from "react-icons/fa";

function AdminDashboard() {
  const navigate = useNavigate();
  let seller = null;
  try { seller = JSON.parse(localStorage.getItem("sellerData") || "null"); } catch (error) { console.warn("[ADMIN] Invalid seller profile cache"); }

  const cards = [
    { title: "Add Product", description: "Create a product with photos, stock, pricing and variants.", path: "/addproduct", icon: <FaBox/>, group: "CATALOG" },
    { title: "Manage Products", description: "Search, edit, remove products and update inventory or prices.", path: "/product-management", icon: <FaTags/>, group: "CATALOG" },
    { title: "Order Management", description: "Review orders, update fulfilment status and inspect payment details.", path: "/seller-orders", icon: <FaShoppingCart/>, group: "OPERATIONS", featured: true },
    { title: "Coupon Management", description: "Create and manage promotional codes and usage limits.", path: "/PromotionPage", icon: <FaPercent/>, group: "GROWTH" },
    { title: "Referral & Rewards", description: "Configure referral bonuses, purchase coins and redemption value.", path: "/referral-rewards", icon: <FaGift/>, group: "GROWTH" },
    { title: "Store Controls", description: "Manage sale banners, checkout availability and delivery settings.", path: "/store-controls", icon: <FaStore/>, group: "STORE" },
    { title: "User Management", description: "View customer profiles, edit account details and review order history.", path: "/user-management", icon: <FaUsers/>, group: "CUSTOMERS" },
    { title: "Customer Support", description: "Review customer requests and reply from the support workspace.", path: "/support-center", icon: <FaHeadset/>, group: "CUSTOMERS" },
    { title: "User Activity Logs", description: "Inspect persistent user-linked audit events and security activity.", path: "/user-logs", icon: <FaShieldAlt/>, group: "SECURITY" },
    { title: "Runtime Logs", description: "Monitor recent server events and errors.", path: "/logs", icon: <FaClipboardList/>, group: "SECURITY" },
    { title: "Seller Profile", description: "View your seller account and business information.", path: "/SellerProfile", icon: <FaUserCircle/>, group: "ACCOUNT" }
  ];

  const handleLogout = () => {
    ["sellerData", "sellerToken"].forEach((key) => localStorage.removeItem(key));
    navigate("/SellerAuth", { replace: true });
  };

  return <main className="aroha-admin-home">
    <style>{css}</style>
    <header className="ah-hero">
      <div className="ah-brand"><span className="ah-mark">A</span><span>AROHA <small>ADMIN WORKSPACE</small></span></div>
      <button className="ah-logout" onClick={handleLogout}><FaSignOutAlt/> Sign out</button>
      <div className="ah-welcome"><span className="ah-eyebrow">YOUR STORE, ONE WORKSPACE</span><h1>Good to see you, {seller?.companyName || seller?.name || "Admin"}.</h1><p>Manage your catalogue, orders, customers and store settings from one place.</p></div>
      <div className="ah-hero-meta"><span><i/> Admin access active</span><span>{cards.length} management tools</span></div>
    </header>

    <section className="ah-summary">
      <div><FaChartLine/><span><b>{cards.length}</b><small>Management tools</small></span></div>
      <div><FaClipboardList/><span><b>One place</b><small>Store operations</small></span></div>
      <div><FaGift/><span><b>Connected</b><small>Growth & rewards</small></span></div>
    </section>

    <div className="ah-section-head"><div><span className="ah-eyebrow">WORKSPACE</span><h2>Manage your store</h2></div><p>Select a section to get started</p></div>
    <section className="ah-grid">{cards.map((card, index) => <button key={card.path} type="button" className={"ah-card " + (card.featured ? "ah-featured" : "")} onClick={() => navigate(card.path)} style={{ "--delay": index * 35 + "ms" }}>
      <div className="ah-card-top"><span className="ah-card-icon">{card.icon}</span><span className="ah-group">{card.group}</span></div>
      <h3>{card.title}</h3><p>{card.description}</p><span className="ah-open">Open section <FaArrowRight/></span>
    </button>)}</section>
    <footer className="ah-footer">AROHA ADMIN · Keep your store running smoothly</footer>
  </main>;
}

const css = `
.aroha-admin-home{min-height:100vh;padding:clamp(15px,3vw,34px);background:#f5f5f4;color:#171717;font-family:Inter,system-ui,-apple-system,sans-serif;box-sizing:border-box}.aroha-admin-home *{box-sizing:border-box}.ah-hero{position:relative;overflow:hidden;padding:clamp(22px,4vw,42px);border-radius:22px;background:#171717;color:#fff;box-shadow:0 18px 45px #00000015}.ah-hero:after{content:"";position:absolute;width:340px;height:340px;border:1px solid #ffffff16;border-radius:50%;right:-110px;top:-185px;box-shadow:0 0 0 35px #ffffff08,0 0 0 75px #ffffff05;pointer-events:none}.ah-brand{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:900;letter-spacing:2px}.ah-brand small{display:block;margin-top:3px;color:#a3a3a3;font-size:9px;letter-spacing:2px}.ah-mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid #777;border-radius:10px;font-family:Georgia,serif;font-size:22px}.ah-logout{position:absolute;right:clamp(20px,4vw,42px);top:clamp(20px,4vw,42px);z-index:1;display:flex;align-items:center;gap:8px;padding:10px 14px;border:1px solid #555;border-radius:10px;background:#292929;color:#fff;font-weight:700;cursor:pointer;transition:.2s}.ah-logout:hover{background:#fff;color:#171717;transform:translateY(-2px)}.ah-welcome{position:relative;z-index:1;margin-top:clamp(38px,6vw,65px);max-width:700px}.ah-eyebrow{font-size:10px;font-weight:800;letter-spacing:2px;color:#a3a3a3}.ah-welcome h1{margin:10px 0;font-size:clamp(27px,4.5vw,42px);line-height:1.12;letter-spacing:-1.2px}.ah-welcome p{max-width:580px;margin:0;color:#c4c4c4;font-size:14px;line-height:1.7}.ah-hero-meta{position:relative;z-index:1;display:flex;gap:20px;flex-wrap:wrap;margin-top:28px;padding-top:16px;border-top:1px solid #ffffff20;color:#bdbdbd;font-size:11px}.ah-hero-meta span{display:flex;align-items:center;gap:8px}.ah-hero-meta i{width:7px;height:7px;border-radius:50%;background:#69c58b;box-shadow:0 0 0 4px #69c58b22}.ah-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:18px 0 30px}.ah-summary>div{display:flex;align-items:center;gap:13px;padding:16px;background:#fff;border:1px solid #e7e5e4;border-radius:14px}.ah-summary svg{font-size:19px;color:#555}.ah-summary span{display:grid;gap:3px}.ah-summary b{font-size:15px}.ah-summary small{color:#737373;font-size:11px}.ah-section-head{display:flex;justify-content:space-between;align-items:end;gap:12px;margin-bottom:14px}.ah-section-head h2{margin:5px 0 0;font-size:clamp(20px,3vw,26px);letter-spacing:-.5px}.ah-section-head>p{margin:0;color:#737373;font-size:12px}.ah-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:13px}.ah-card{min-width:0;display:flex;flex-direction:column;align-items:flex-start;text-align:left;padding:19px;border:1px solid #e7e5e4;border-radius:16px;background:#fff;color:#171717;cursor:pointer;box-shadow:0 3px 12px #00000006;transition:transform .2s,border-color .2s,box-shadow .2s;animation:ah-enter .35s both;animation-delay:var(--delay)}.ah-card:hover{transform:translateY(-4px);border-color:#a3a3a3;box-shadow:0 14px 30px #0000000d}.ah-card:focus-visible,.ah-logout:focus-visible{outline:3px solid #737373;outline-offset:3px}.ah-featured{border-color:#a3a3a3;background:linear-gradient(145deg,#fff,#f5f5f4)}.ah-card-top{width:100%;display:flex;justify-content:space-between;align-items:center}.ah-card-icon{display:grid;place-items:center;width:42px;height:42px;border-radius:12px;background:#f0efed;color:#222;font-size:18px}.ah-group{font-size:9px;letter-spacing:1.5px;color:#8a8a8a;font-weight:800}.ah-card h3{margin:17px 0 7px;font-size:16px}.ah-card p{margin:0;color:#737373;font-size:12px;line-height:1.6;min-height:39px}.ah-open{display:flex;align-items:center;gap:8px;margin-top:17px;font-size:11px;font-weight:800;color:#333}.ah-open svg{transition:transform .2s}.ah-card:hover .ah-open svg{transform:translateX(4px)}.ah-footer{text-align:center;padding:27px 0 5px;color:#a3a3a3;font-size:10px;letter-spacing:1px}@keyframes ah-enter{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@media(max-width:600px){.ah-logout{top:18px;right:18px;padding:9px 10px;font-size:11px}.ah-welcome{margin-top:40px}.ah-summary{grid-template-columns:1fr;gap:8px}.ah-summary>div{padding:12px}.ah-section-head{align-items:flex-start;flex-direction:column}.ah-grid{grid-template-columns:minmax(0,1fr)}.ah-card{padding:16px}.ah-card p{min-height:0}}@media(prefers-reduced-motion:reduce){.aroha-admin-home *{animation:none!important;transition:none!important}}
`;

export default AdminDashboard;
