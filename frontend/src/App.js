import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 🚀 DÜZELTME 1: useTheme yerine, tüm sistemi saracak olan ThemeProvider'ı çağırıyoruz
import { ThemeProvider } from './context/ThemeContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Portfolio from './pages/Portfolio';
import Alarms from './pages/Alarms';
import Settings from './pages/Settings';
import Markets from './pages/Markets';
import Notifications from './pages/Notifications';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("tradein_token"));

  return (
    // 🚀 DÜZELTME 2: Tüm rotaları (ve tüm siteyi) ThemeProvider içine alıyoruz.
    // Artık içerideki tüm sayfalar (Home, Settings, Alarms vs.) temaya otomatik erişebilecek.
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/portfolio" element={<Portfolio isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/profile/:username?" element={isLoggedIn ? <Profile isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} /> : <Navigate to="/login" />} />
          <Route path="/alarms" element={<Alarms isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/settings" element={<Settings isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/markets" element={<Markets isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/notifications" element={<Notifications isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;