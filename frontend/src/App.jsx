import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthChat from './components/AuthChat';

function ProtectedHome() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
      <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(74,95,120,0.12)] p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-[#8da4be] flex items-center justify-center mx-auto text-white text-xl">✓</div>
        <h1 className="mt-4 text-2xl font-bold text-[#4a5f78]">Welcome{user?.fullName ? `, ${user.fullName}` : ''}!</h1>
        <p className="mt-2 text-[#7c9cb6] text-sm break-all">{user?.email}</p>
        <button
          onClick={logout}
          className="mt-6 w-full rounded-full bg-[#8da4be] text-white font-semibold py-3 hover:bg-[#7d94ad] transition"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

function AuthRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <AuthChat />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthRoute />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <ProtectedHome />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}
