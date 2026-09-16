import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

// ──────────────────────────────────────────────────────────
// Friendly pill robot — stroke #5a8dee, soft / airy
// ──────────────────────────────────────────────────────────
function RobotSVG() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="w-[160px] h-[160px] lg:w-[180px] lg:h-[180px]"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* antenna */}
      <line x1="100" y1="38" x2="100" y2="18" stroke="#5a8dee" strokeWidth="4" strokeLinecap="round" />
      <circle cx="100" cy="12" r="8" fill="#5a8dee" />
      <circle cx="100" cy="12" r="3.5" fill="white" opacity="0.85" />
      {/* antenna side dots */}
      <circle cx="100" cy="12" r="12" stroke="#5a8dee" strokeWidth="1.5" opacity="0.15" />

      {/* ears / side nodes */}
      <rect x="34" y="82" width="14" height="44" rx="7" fill="white" stroke="#5a8dee" strokeWidth="3" />
      <rect x="152" y="82" width="14" height="44" rx="7" fill="white" stroke="#5a8dee" strokeWidth="3" />
      <circle cx="41" cy="104" r="3" fill="#5a8dee" opacity="0.6" />
      <circle cx="159" cy="104" r="3" fill="#5a8dee" opacity="0.6" />

      {/* head — pill shape */}
      <rect x="52" y="42" width="96" height="108" rx="48" fill="white" stroke="#5a8dee" strokeWidth="3.5" />

      {/* face highlight */}
      <rect x="62" y="56" width="76" height="88" rx="38" fill="#f4f7fb" opacity="0.9" />

      {/* eyes — friendly, slightly rounded */}
      <g>
        {/* left eye */}
        <rect x="73" y="80" width="22" height="26" rx="11" fill="#4a5f78" />
        <circle cx="84" cy="90" r="5" fill="white" opacity="0.95" />
        <circle cx="81" cy="88" r="1.6" fill="white" />
        {/* right eye */}
        <rect x="105" y="80" width="22" height="26" rx="11" fill="#4a5f78" />
        <circle cx="116" cy="90" r="5" fill="white" opacity="0.95" />
        <circle cx="113" cy="88" r="1.6" fill="white" />
        {/* eye shine */}
      </g>

      {/* blush */}
      <ellipse cx="64" cy="112" rx="10" ry="5" fill="#8da4be" opacity="0.18" />
      <ellipse cx="136" cy="112" rx="10" ry="5" fill="#8da4be" opacity="0.18" />

      {/* smile — soft U */}
      <path
        d="M 84 122 Q 100 138 116 122"
        stroke="#4a5f78"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* smile inner */}
      <path d="M 90 128 Q 100 136 110 128" stroke="#5a8dee" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" fill="none" />

      {/* chin detail line */}
      <path d="M 86 144 Q 100 150 114 144" stroke="#5a8dee" strokeWidth="1.2" strokeLinecap="round" opacity="0.2" fill="none" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 bg-white border border-[#e6eef7] rounded-3xl rounded-bl-lg px-5 py-4 shadow-sm w-fit">
      <span className="w-2 h-2 rounded-full bg-[#5a8dee] animate-bounce [animation-delay:-0.3s]" />
      <span className="w-2 h-2 rounded-full bg-[#5a8dee] animate-bounce [animation-delay:-0.15s]" />
      <span className="w-2 h-2 rounded-full bg-[#5a8dee] animate-bounce" />
    </div>
  );
}

const LOGIN_STEPS = ['email', 'password'];
const REGISTER_STEPS = ['fullName', 'email', 'password', 'phone'];

const PROMPTS = {
  login: {
    email: "Welcome back! What's your email?",
    password: 'And your password?',
  },
  register: {
    fullName: "Awesome! Let's create your account.\nWhat's your full name?",
    email: 'Lovely! What email should we use?',
    password: 'Great — now create a password (at least 6 characters).',
    phone: "Almost there! What's your phone number?",
  },
};

export default function AuthChat() {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState(null); // 'login' | 'register' | null
  const [step, setStep] = useState(null); // current field key
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: "Hey there! I'm your ShopKart assistant \u2728" },
    { id: 2, sender: 'bot', text: 'Do you want to Sign In or Create an Account?' },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const steps = mode === 'login' ? LOGIN_STEPS : REGISTER_STEPS;

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // focus input when step changes
  useEffect(() => {
    if (step && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const pushBot = (text) =>
    setMessages((m) => [...m, { id: Date.now() + Math.random(), sender: 'bot', text }]);

  const pushUser = (text, isPassword = false) =>
    setMessages((m) => [
      ...m,
      { id: Date.now() + Math.random(), sender: 'user', text, isPassword },
    ]);

  const botSayAfter = (text, delay = 480) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      pushBot(text);
    }, delay);
  };

  const handleChoice = (choice) => {
    setMode(choice);
    setFormData({});
    setStepIndex(0);
    const first = choice === 'login' ? 'email' : 'fullName';
    setStep(first);
    setInputValue('');

    // echo choice as user bubble
    const label = choice === 'login' ? 'Sign In' : 'Create an Account';
    pushUser(label);

    const prompt = PROMPTS[choice][first];
    botSayAfter(prompt);
  };

  const handleLogin = async (payload) => {
    setIsTyping(true);
    try {
      await api.post('/customers/login', {
        email: payload.email,
        password: payload.password,
      });
      // silently hydrate context
      const { data } = await api.get('/customers/me');
      const user = data.customer ?? data;
      setUser(user);
      setIsTyping(false);
      pushBot("You're in! Redirecting you now \u2728");
      setTimeout(() => navigate('/home'), 700);
    } catch (err) {
      setIsTyping(false);
      const status = err.response?.status;
      if (status === 401) {
        // conversational reset — no red banner
        pushBot("Hmm, that didn't work. Let's try again. What's your email?");
        setFormData({});
        setMode('login');
        setStep('email');
        setStepIndex(0);
        setInputValue('');
      } else {
        pushBot('Something went wrong on our side. Could you try again in a moment?');
      }
    }
  };

  const handleRegister = async (payload) => {
    setIsTyping(true);
    try {
      await api.post('/customers/register', {
        fullName: payload.fullName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
      });
      // auto sign-in for seamless UX
      pushBot('Account created! Signing you in \u2026');
      setIsTyping(true);
      try {
        await api.post('/customers/login', {
          email: payload.email,
          password: payload.password,
        });
        const { data } = await api.get('/customers/me');
        const user = data.customer ?? data;
        setUser(user);
        setIsTyping(false);
        pushBot("You're all set! Welcome to ShopKart \uD83C\uDF89");
        setTimeout(() => navigate('/home'), 700);
      } catch {
        setIsTyping(false);
        pushBot('Account created! Now please sign in with your new credentials.');
        setMode('login');
        setStep('password');
        setStepIndex(1);
        setFormData({ email: payload.email });
        setInputValue('');
        setTimeout(() => pushBot("What's your password?"), 500);
      }
    } catch (err) {
      setIsTyping(false);
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message;
      if (status === 409) {
        // seamless switch to login
        pushBot("It looks like that email is already registered! Let's log you in. What's your password?");
        setMode('login');
        setStep('password');
        setStepIndex(1);
        setFormData((prev) => ({ email: prev.email }));
        setInputValue('');
      } else if (status === 400) {
        pushBot(serverMsg || "That doesn't look quite right — let's try again.");
        // re-ask current step
        const current = steps[stepIndex];
        if (current) botSayAfter(PROMPTS[mode][current], 600);
      } else {
        pushBot('Something went wrong. Please try again in a moment.');
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) return;

    const isPassword = step === 'password';
    // render dots for password in history, keep real value in formData only
    pushUser(isPassword ? '••••••••' : val, isPassword);

    const nextData = { ...formData, [step]: val };
    setFormData(nextData);
    setInputValue('');

    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      const nextField = steps[nextIndex];
      setStepIndex(nextIndex);
      setStep(nextField);
      botSayAfter(PROMPTS[mode][nextField]);
    } else {
      // flow complete — fire API
      if (mode === 'login') handleLogin(nextData);
      else handleRegister(nextData);
    }
  };

  const showChoice = mode === null;
  const showInput = mode !== null && step !== null;

  return (
    <div className="min-h-screen w-full bg-[#f4f7fb] flex items-center justify-center p-0 lg:p-6">
      {/* floating card */}
      <div className="w-full max-w-5xl bg-white flex overflow-hidden shadow-[0_20px_60px_rgba(74,95,120,0.12)] lg:rounded-[40px] rounded-none lg:h-[800px] h-[100dvh] lg:max-h-[800px] max-h-none border border-white">
        {/* LEFT — branding (desktop only) */}
        <div className="hidden lg:flex w-1/2 bg-[#f4f7fb]/60 flex-col items-center justify-center p-10 relative overflow-hidden">
          {/* soft decorative blobs */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#5a8dee]/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#8da4be]/15 rounded-full blur-2xl" />

          {/* circular robot container */}
          <div className="relative w-[340px] h-[340px] rounded-full bg-white shadow-[0_12px_40px_rgba(90,141,238,0.12)] border border-[#e6eef7] flex items-center justify-center">
            <RobotSVG />
            {/* tiny floating accent */}
            <div className="absolute -top-1 -right-2 w-10 h-10 rounded-full bg-[#5a8dee] flex items-center justify-center shadow-md">
              <span className="text-white text-[16px]">✦</span>
            </div>
            <div className="absolute -bottom-2 -left-1 w-7 h-7 rounded-full bg-[#8da4be] opacity-90" />
          </div>

          <div className="mt-8 text-center max-w-[320px]">
            <h1 className="text-[28px] font-bold tracking-tight text-[#4a5f78] leading-none">ShopKart</h1>
            <p className="mt-1 text-[15px] font-semibold tracking-wide text-[#5a8dee] uppercase">Your friendly assistant</p>
            <p className="mt-4 text-[14.5px] leading-6 text-[#7c9cb6]">
              Chat with me to sign in or create your account. I&apos;ll walk you through it step by step.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5a8dee]" />
              <span className="w-2 h-2 rounded-full bg-[#8da4be]/40" />
              <span className="w-2 h-2 rounded-full bg-[#8da4be]/40" />
            </div>
          </div>

          <p className="absolute bottom-6 text-[12px] text-[#7c9cb6] tracking-wide">
            Secure \u00B7 Encrypted \u00B7 Trusted
          </p>
        </div>

        {/* RIGHT — chat (full on mobile, half on desktop) */}
        <div className="flex-1 lg:w-1/2 w-full flex flex-col bg-white relative min-w-0">
          {/* header */}
          <div className="shrink-0 flex items-center gap-3 px-5 lg:px-7 py-4 border-b border-[#eef3f9] bg-white">
            <div className="w-9 h-9 rounded-full bg-[#5a8dee] flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-[13px] font-bold">SK</span>
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold leading-none text-[#4a5f78]">ShopKart Assistant</p>
              <p className="text-[12px] leading-none mt-1 flex items-center gap-1.5 text-[#7c9cb6]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Online — replies instantly
              </p>
            </div>
            <div className="ml-auto hidden lg:flex items-center gap-1 text-[#7c9cb6]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8da4be]/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8da4be]/60" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#8da4be]/60" />
            </div>
          </div>

          {/* messages — iMessage feel */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-4 bg-[#f4f7fb]/40 scroll-smooth">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.sender === 'bot' ? (
                  <div className="flex gap-2.5 max-w-[78%] items-end">
                    <div className="hidden sm:flex w-7 h-7 rounded-full bg-[#5a8dee] items-center justify-center shrink-0 mb-1 shadow-sm">
                      <span className="text-[10px]">🤖</span>
                    </div>
                    <div className="bg-white border border-[#e6eef7] text-[#4a5f78] rounded-3xl rounded-bl-lg px-5 py-3.5 shadow-sm text-[14.5px] leading-6 whitespace-pre-wrap">
                      {m.text}
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#8da4be] text-white rounded-3xl rounded-br-lg px-5 py-3.5 shadow-sm text-[14.5px] leading-6 max-w-[78%] whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2.5 items-end">
                  <div className="hidden sm:flex w-7 h-7 rounded-full bg-[#5a8dee] items-center justify-center shrink-0 mb-1">
                    <span className="text-[10px]">🤖</span>
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>

          {/* composer / choice area */}
          <div className="shrink-0 bg-white border-t border-[#eef3f9] p-4 lg:p-5">
            {showChoice ? (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleChoice('login')}
                  className="w-full rounded-full bg-[#8da4be] text-white font-semibold py-4 px-6 shadow-[0_6px_18px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] active:scale-[0.99] transition text-[15px]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleChoice('register')}
                  className="w-full rounded-full bg-white border-2 border-[#8da4be] text-[#4a5f78] font-semibold py-4 px-6 hover:bg-[#f4f7fb] active:scale-[0.99] transition text-[15px]"
                >
                  Create an Account
                </button>
                <p className="text-center text-[12px] text-[#7c9cb6] mt-1">Secure authentication with HttpOnly cookies</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    type={step === 'password' ? 'password' : step === 'email' ? 'email' : step === 'phone' ? 'tel' : 'text'}
                    placeholder={
                      step === 'fullName'
                        ? 'Your full name'
                        : step === 'email'
                          ? 'you@example.com'
                          : step === 'password'
                            ? 'Your password'
                            : step === 'phone'
                              ? 'Your phone number'
                              : 'Type a message…'
                    }
                    autoComplete={step === 'password' ? 'current-password' : step === 'email' ? 'email' : 'off'}
                    className="w-full rounded-full bg-[#f4f7fb] border border-[#e6eef7] text-[#4a5f78] placeholder:text-[#7c9cb6]/70 px-5 py-4 pr-12 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#5a8dee]/30 focus:border-[#5a8dee]/40 transition"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping}
                  aria-label="Send"
                  className="w-12 h-12 rounded-full bg-[#8da4be] text-white flex items-center justify-center shadow-[0_6px_18px_rgba(141,164,190,0.35)] hover:bg-[#7d94ad] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition shrink-0"
                >
                  {/* send arrow */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" fill="white" stroke="white" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
