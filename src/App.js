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
import ResetPassword from "./resetpassword";
import Terms from "./Termsandconditions";
import SellerAuth from "./SellerAuth";
import AdminDashboard from "./Admissiondashboard";
import SellerProfile from "./sellerprofile";
import About from "./About";
import PromotionPage from "./promotions";
import UserCoupons from "./UserCoupons";
import ProductManagement from "./ProductManagement";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
          <Route path="/About" element={<About/>} />
         <Route path="/ResetPassword" element={<ResetPassword/>} />
 <Route path="/Termsandconditions" element={<Terms/>} />


<Route path="/PromotionPage" element={<PromotionPage/>} />



<Route path="/SellerAuth" element={<SellerAuth/>} />

    <Route path="/SellerProfile" element={<SellerProfile/>} />
<Route path="/AdminDashboard" element={<AdminDashboard/>} />    {/* Dashboard main page */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Direct routes for other pages */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/AddProduct" element={<AddProduct />} />
        <Route path="/product-management" element={<ProductManagement />} />
        <Route path="/seller-orders" element={<SellerOrders />} />
        <Route path="/Orders" element={<Orders />} />
        <Route path="/coupons" element={<UserCoupons />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Analytics />
    </Router>
  );
}

export default App;
