import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!user);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // Always fetch fresh from /customers/me — don't trust stale client state
      // HttpOnly cookie is sent automatically via withCredentials
      try {
        const { data } = await api.get('/customers/me');
        const u = data.customer ?? data;
        if (!cancelled) {
          if (u && (u._id || u.email)) {
            setUser(u);
          } else {
            setUser(null);
            navigate('/login', { replace: true });
          }
        }
      } catch (err) {
        if (!cancelled) {
          const status = err.response?.status;
          if (status === 401) {
            setUser(null);
            navigate('/login', { replace: true });
          } else {
            setError('Failed to load profile. Please try again.');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // If context already has user, no need to fetch; but refresh anyway to stay consistent
    if (!user) load();
    else setLoading(false);

    return () => { cancelled = true; };
  }, [user, setUser, navigate]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center">
        <div className="bg-white rounded-[32px] shadow-sm border border-[#eef3f9] px-10 py-12 text-center">
          <div className="w-8 h-8 border-3 border-[#e6eef7] border-t-[#5a8dee] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[14px] text-[#7c9cb6]">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] flex items-center justify-center p-6">
        <div className="bg-white rounded-[32px] p-8 text-center shadow-sm">{error}</div>
      </div>
    );
  }

  // Guard: if still no user after fetch, RequireAuth will redirect — but render nothing briefly
  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f4f7fb] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Welcome hero */}
        <div className="bg-white rounded-[32px] shadow-[0_20px_60px_rgba(74,95,120,0.12)] border border-white p-8 sm:p-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold tracking-widest uppercase text-[#5a8dee]">ShopKart</p>
              <h1 className="mt-1 text-[28px] font-bold tracking-tight text-[#4a5f78]">Welcome, {user.fullName || 'Customer'}!</h1>
              <p className="mt-2 text-[14px] text-[#7c9cb6]">You&apos;re logged in. Here&apos;s your profile from <code className="bg-[#f4f7fb] px-1.5 py-0.5 rounded text-[#4a5f78]">GET /customers/me</code></p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#8da4be] flex items-center justify-center text-white font-bold shrink-0">✓</div>
          </div>

          {/* Customer info cards */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-[#f4f7fb] border border-[#e6eef7] p-5">
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Full Name</p>
              <p className="mt-1 text-[15px] font-semibold text-[#4a5f78] break-words">{user.fullName}</p>
            </div>
            <div className="rounded-3xl bg-[#f4f7fb] border border-[#e6eef7] p-5">
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Phone Number</p>
              <p className="mt-1 text-[15px] font-semibold text-[#4a5f78]">{user.phone}</p>
            </div>
            <div className="rounded-3xl bg-[#f4f7fb] border border-[#e6eef7] p-5 sm:col-span-2">
              <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Email</p>
              <p className="mt-1 text-[15px] font-semibold text-[#4a5f78] break-all">{user.email}</p>
            </div>
            {user.createdAt && (
              <div className="rounded-3xl bg-[#f4f7fb] border border-[#e6eef7] p-5 sm:col-span-2">
                <p className="text-[11px] font-bold tracking-widest uppercase text-[#7c9cb6]">Member Since</p>
                <p className="mt-1 text-[14px] font-medium text-[#4a5f78]">{new Date(user.createdAt).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>

        {/* Secondary info */}
        <div className="bg-white rounded-[24px] border border-[#eef3f9] p-6 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">🔒</div>
          <p className="text-[13px] text-[#7c9cb6]"><span className="font-semibold text-[#4a5f78]">Protected route.</span> This page is only accessible with a valid HttpOnly JWT cookie. Unauthenticated users are redirected to <code className="bg-[#f4f7fb] px-1 py-0.5 rounded">/login</code>.</p>
        </div>
      </div>
    </div>
  );
}
