import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function SellerProtectedRoute({ children }) {
  const location = useLocation();
  const seller = JSON.parse(localStorage.getItem("sellerData") || "null");
  const token = localStorage.getItem("sellerToken");

  if (!seller?._id || !token) {
    return <Navigate to="/SellerAuth" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default SellerProtectedRoute;
