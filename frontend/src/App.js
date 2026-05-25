import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Portfolio from './pages/Portfolio';
import Alarms from './pages/Alarms';
import Markets from './pages/Markets';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tradein_token"));

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0a0f1d] text-white">
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<Portfolio isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/profile/:username?" element={isLoggedIn ? <Profile isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />} />
          <Route path="/alarms" element={<Alarms isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/markets" element={<Markets isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
