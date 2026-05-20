import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile'; // <-- İŞTE EKSİK OLAN PARÇA!
import Portfolio from "./pages/Portfolio";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tradein_token"));

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0f1d] text-white">
        <Routes>
          <Route 
            path="/" 
            element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} 
          />
          <Route 
            path="/login" 
            element={<Login setIsLoggedIn={setIsLoggedIn} />} 
          />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route 
            path="/profile/:username?" 
            element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;