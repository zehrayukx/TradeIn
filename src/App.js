import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import TickerTape from './components/TickerTape';
import Home from './pages/Home';
import './index.css';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f1117] text-white font-sans">
        <TickerTape />
        <Navbar />
        <div className="flex max-w-[1400px] mx-auto px-4 gap-6 pt-4">
          <Sidebar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/markets" element={<div className="p-10 text-2xl">Piyasalar Sayfası</div>} />
              <Route path="/login" element={<div className="p-10 text-2xl">Giriş Yap</div>} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
