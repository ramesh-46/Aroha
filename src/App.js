// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "./Homepage";
import UserLogin from "./UserLogin";
import Signup from "./signup";
import Dashboard from "./dashboard";
import Cart from "./cart";
import Profile from "./profile";
import AddProduct from "./Addproduct";
import { Analytics } from "@vercel/analytics/react";
import Orders from "./orders";
import OrderSuccess from "./OrderSuccess";
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
import SellerProtectedRoute from "./SellerProtectedRoute";
import StoreControlPanel from "./StoreControlPanel";
import UserManagement from "./UserManagement";
import SupportCenter from "./SupportCenter";

import MainDashboard from "./maindashboard";
import MainHeader from "./mainheader";


function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Homepage />} />
  <Route path="/login" element={<UserLogin />} />
        <Route path="/signup" element={<Signup />} />
          <Route path="/About" element={<About/>} />
         <Route path="/ResetPassword" element={<ResetPassword/>} />
 <Route path="/Termsandconditions" element={<Terms/>} />


<Route path="/PromotionPage" element={<SellerProtectedRoute><PromotionPage/></SellerProtectedRoute>} />



<Route path="/SellerAuth" element={<SellerAuth/>} />
<Route path="/product/:productId" element={<Dashboard />} />
<Route path="/SellerProfile" element={<SellerProtectedRoute><SellerProfile/></SellerProtectedRoute>} />
<Route path="/AdminDashboard" element={<SellerProtectedRoute><AdminDashboard/></SellerProtectedRoute>} />    {/* Dashboard main page */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Direct routes for other pages */}
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/AddProduct" element={<SellerProtectedRoute><AddProduct /></SellerProtectedRoute>} />
        <Route path="/product-management" element={<SellerProtectedRoute><ProductManagement /></SellerProtectedRoute>} />
        <Route path="/seller-orders" element={<SellerProtectedRoute><SellerOrders /></SellerProtectedRoute>} />
        <Route path="/store-controls" element={<SellerProtectedRoute><StoreControlPanel /></SellerProtectedRoute>} />
        <Route path="/user-management" element={<SellerProtectedRoute><UserManagement /></SellerProtectedRoute>} />
        <Route path="/support-center" element={<SellerProtectedRoute><SupportCenter /></SellerProtectedRoute>} />
        <Route path="/Orders" element={<Orders />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/coupons" element={<UserCoupons />} />

<Route path="/MainDashboard" element={<MainDashboard />} />
<Route path="/MainHeader" element={<MainHeader />} />





        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      <Analytics />
    </Router>
  );
}


export default App;
