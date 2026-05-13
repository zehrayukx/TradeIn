import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TickerTape from './components/TickerTape';
import Home from './pages/Home';
import Profile from './pages/Profile';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // MANUEL KONTROL: Burayı true/false yaparak test edebilirsin.
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  return (
    <Router>
      <div className="min-h-screen bg-[#0f1117] text-white font-sans selection:bg-blue-500/30">
        <TickerTape />
        <Navbar 
          isLoggedIn={isLoggedIn} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        <div className="flex relative">
          <Sidebar 
            isOpen={isSidebarOpen} 
            isLoggedIn={isLoggedIn} 
            setIsLoggedIn={setIsLoggedIn} 
          />

          <main className="flex-1 transition-all duration-300">
            <div className="max-w-[1400px] mx-auto px-4 pt-4">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<div className="p-10 text-center text-2xl font-bold uppercase tracking-widest">Giriş Yap</div>} />
                <Route 
                  path="/profile" 
                  element={isLoggedIn ? <Profile /> : <Navigate to="/login" replace />} 
                />
                <Route path="/profile/:username" element={<Profile />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;