import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Portfolio from './pages/Portfolio';
import Alarms from './pages/Alarms';
import Settings from './pages/Settings';
import Markets from './pages/Markets';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tradein_token"));
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const pageBg = isDark ? 'bg-[#0a0f1d]' : 'bg-slate-100';
  const pageText = isDark ? 'text-white' : 'text-gray-900';

  return (
    <BrowserRouter>
      <div className={`min-h-screen ${pageBg} ${pageText} transition-colors duration-300`}>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<Portfolio isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/profile/:username?" element={isLoggedIn ? <Profile isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />} />
          <Route path="/alarms" element={<Alarms isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/settings" element={<Settings isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
           <Route path="/markets" element={<Markets isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
