// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./Homepage";
import Login from "./login";
import Signup from "./signup";
import Dashboard from "./dashboard";
import Cart from "./cart";
import Profile from "./profile";
import AddProduct from "./Addproduct";
import { Analytics } from "@vercel/analytics/react";
import Orders from "./orders";
import SellerOrders from "./SellerOrders";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard main page */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Direct routes for other pages */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/AddProduct" element={<AddProduct />} />
<Route path="/seller-orders" element={<SellerOrders />} />

<Route path="/Orders" element={<Orders />} />
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Analytics />
    </Router>
  );
}

export default App;
