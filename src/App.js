// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./Homepage";
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
      </Routes>
      {/* Add Analytics here */}
      <Analytics />
    </Router>
  );
}

export default App;
