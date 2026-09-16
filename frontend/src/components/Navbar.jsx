import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Backend clears HttpOnly cookie; must send credentials
      await api.post('/customers/logout');
    } catch {
      // even if API fails, clear client state
    } finally {
      setUser(null);
      navigate('/login', { replace: true });
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#eef3f9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        <Link to={user ? '/home' : '/login'} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#5a8dee] flex items-center justify-center text-white font-bold text-[13px] shadow-sm">SK</div>
          <span className="text-[18px] font-bold tracking-tight text-[#4a5f78]">ShopKart</span>
        </Link>

        <div className="flex items-center gap-2">
          {!user ? (
            <>
              <Link to="/products" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">
                Products
              </Link>
              <Link to="/login" className="hidden sm:inline-flex px-5 py-2.5 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">
                Login
              </Link>
              <Link to="/register" className="inline-flex px-6 py-2.5 rounded-full bg-[#8da4be] text-white text-[14px] font-semibold shadow-[0_6px_18px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] transition">
                Create Account
              </Link>
            </>
          ) : (
            <>
              <span className="hidden sm:inline text-[14px] text-[#7c9cb6] mr-2 truncate max-w-[160px]">{user.email}</span>
              <Link to="/home" className="hidden sm:inline-flex px-4 py-2 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">Home</Link>
              <Link to="/products" className="hidden sm:inline-flex px-4 py-2 rounded-full text-[14px] font-semibold text-[#4a5f78] hover:bg-[#f4f7fb] transition">Products</Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#8da4be] text-white text-[14px] font-semibold hover:bg-[#7d94ad] active:scale-[0.98] transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
