import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import AuthChat from './components/AuthChat';

function RequireAuth({ children }) {
  const { user } = useAuth();
  // Protected: unauthenticated → /login (Home also double-checks via GET /customers/me)
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/home" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Lab 02 required routes */}
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/home" element={<RequireAuth><Home /></RequireAuth>} />

        {/* Bonus: conversational robot UI kept at /auth */}
        <Route path="/auth" element={<PublicOnly><AuthChat /></PublicOnly>} />

        {/* Root and catch-all */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
