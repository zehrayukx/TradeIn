// src/App.js
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> 
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function AuthPlaceholderPage({ title, buttonText }) {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1d] px-6 text-white">
      <div className="w-full max-w-md rounded-[28px] border border-white/5 bg-[#182640] p-8 text-center shadow-2xl shadow-black/30">
        <h1 className="mb-4 text-3xl font-black">{title}</h1>
        <p className="mb-8 leading-7 text-slate-400">
          Bu sayfa şu an placeholder olarak hazır. Backend bağlandığında burada
          gerçek kimlik doğrulama formu çalışacak.
        </p>
        <button
          type="button"
          onClick={handleContinue}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-black text-white transition hover:bg-blue-500"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

export default App;