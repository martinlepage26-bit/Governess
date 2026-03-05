import React, { useState, useEffect, createContext, useContext } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { InlineWidget } from "react-calendly";
import axios from "axios";
import { 
  Compass, 
  Activity, 
  Menu, 
  X, 
  ArrowRight, 
  Mail, 
  Linkedin, 
  Github, 
  FileText, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Send,
  BookOpen,
  Briefcase,
  ClipboardCheck,
  LayoutDashboard,
  TrendingUp,
  Lock,
  LogOut,
  User,
  Users,
  Plus,
  Edit2,
  Trash2,
  Tag,
  Calendar,
  ArrowLeft,
  Save
} from "lucide-react";
import CompassAIApp from "./CompassAI";
import AurorAIApp from "./AurorAI";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============ AUTH CONTEXT ============
const AuthContext = createContext(null);

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // CRITICAL: If returning from OAuth callback, skip the /me check
    // AuthCallback will exchange the session_id and establish the session first
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API}/auth/me`, { withCredentials: true });
      setUser(res.data);
    } catch (e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    } catch (e) {
      console.error("Logout error", e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// Auth Callback Component
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = window.location.hash;
      const sessionId = hash.split('session_id=')[1]?.split('&')[0];
      
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const res = await axios.post(`${API}/auth/session`, 
          { session_id: sessionId },
          { withCredentials: true }
        );
        setUser(res.data);
        // Redirect based on role
        if (res.data.role === 'admin') {
          navigate('/admin');
        } else if (res.data.approved) {
          navigate('/dashboard');
        } else {
          navigate('/pending-approval');
        }
      } catch (e) {
        console.error("Auth error", e);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500">Authenticating...</p>
    </div>
  );
};

// Protected Route
const ProtectedRoute = ({ children, requireAdmin = false, requireApproved = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireApproved && !user.approved && user.role !== 'admin') {
    return <Navigate to="/pending-approval" replace />;
  }

  return children;
};

// Logo Components
const NeedleLogo = ({ className = "w-10 h-10", withCircle = false }) => (
  <div className={`relative ${withCircle ? 'flex items-center justify-center' : ''}`}>
    {withCircle && (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-200/60 to-indigo-100/40 rounded-full blur-sm" />
    )}
    <img 
      src="https://customer-assets.emergentagent.com/job_landing-guide-8/artifacts/4azal0zf_needle.png" 
      alt="Govern-AI" 
      className={`relative ${className}`}
      style={{ 
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
        mixBlendMode: 'multiply'
      }}
    />
  </div>
);

const MonogramLogo = ({ className = "w-10 h-10" }) => (
  <img 
    src="https://customer-assets.emergentagent.com/job_landing-guide-8/artifacts/8p7f3fb8_Sans%20titre.png" 
    alt="ML" 
    className={className}
    style={{ mixBlendMode: 'multiply' }}
  />
);

const Monogram = ({ className = "text-xl" }) => (
  <div className={`font-heading font-black tracking-tighter border-2 border-slate-900 px-2 py-0.5 ${className}`}>
    ML
  </div>
);

// Navigation
const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { user, login, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicLinks = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/services", label: "Services" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/publications", label: "Publications" },
    { path: "/assessment", label: "Assessment" },
    { path: "/contact", label: "Contact" }
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass border-b border-slate-100 shadow-sm' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3" data-testid="nav-logo">
            <MonogramLogo className="w-8 h-8" />
            <span className="font-heading font-bold text-lg text-slate-900 hidden sm:block">Govern-AI</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {publicLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-violet-900' : 'text-slate-600 hover:text-slate-900'}`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
            <Link 
              to="/request-access"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1"
              data-testid="nav-request-access"
            >
              <Lock className="w-3.5 h-3.5" /> Client Portal
            </Link>
            <a 
              href="https://www.linkedin.com/in/martin-lepage-ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="nav-linkedin"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            {user ? (
              <div className="flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
                <Link 
                  to={user.role === 'admin' ? '/admin' : '/dashboard'}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  {user.name?.split(' ')[0]}
                </Link>
                <button onClick={logout} className="text-slate-400 hover:text-slate-600">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            data-testid="nav-mobile-toggle"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass border-b border-slate-100"
          >
            <div className="px-6 py-4 space-y-4">
              {publicLinks.map(link => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`block text-base font-medium ${location.pathname === link.path ? 'text-violet-900' : 'text-slate-600'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link 
                to="/request-access"
                className="block text-base font-medium text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                Client Portal
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

// Footer
const Footer = () => (
  <footer className="bg-slate-900 text-white py-16">
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Monogram className="text-lg border-white text-white" />
            <span className="font-heading font-bold">Martin Lepage, PhD</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            AI governance as decision machinery, not observability theater.
          </p>
        </div>
        
        <div>
          <h4 className="font-heading font-bold mb-4">Connect</h4>
          <div className="space-y-3">
            <a href="mailto:Consult@govern-ai.ca" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm" data-testid="footer-email">
              <Mail className="w-4 h-4" /> Consult@govern-ai.ca
            </a>
            <a href="https://www.linkedin.com/in/martin-lepage-ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm" data-testid="footer-linkedin">
              <Linkedin className="w-4 h-4" /> LinkedIn
            </a>
            <a href="https://github.com/martinlepage26-bit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm" data-testid="footer-github">
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-heading font-bold mb-4">Frameworks</h4>
          <div className="space-y-3">
            <a href="https://github.com/martinlepage26-bit/AurorAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <Activity className="w-4 h-4" /> AurorAI
            </a>
            <a href="https://github.com/martinlepage26-bit/CompassAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
              <Compass className="w-4 h-4" /> CompassAI
            </a>
          </div>
        </div>
      </div>
      
      <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} Martin Lepage. All rights reserved.
      </div>
    </div>
  </footer>
);

// Home Page
const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-32">
          <div className="grid lg:grid-cols-5 gap-12 items-center">
            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">MARTIN LEPAGE, PHD</p>
                <h1 className="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 leading-tight mb-6">
                  Governance as<br />
                  <span className="text-violet-900">Decision Machinery</span>
                </h1>
                <p className="text-slate-600 text-lg lg:text-xl leading-relaxed mb-8 max-w-2xl">
                  I design AI governance that converts leadership intent into constraint design embedded in real workflow gates. Not observability theater.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link to="/assessment" className="btn-primary" data-testid="hero-cta-assessment">
                    Assess Your Governance <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link to="/contact" className="btn-secondary" data-testid="hero-cta-contact">
                    Book Consultation
                  </Link>
                </div>
              </motion.div>
            </div>
            
            <div className="lg:col-span-2 flex justify-center lg:justify-end">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="w-64 h-64 lg:w-80 lg:h-80 relative flex items-center justify-center">
                  {/* Lavender translucent circle behind logo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-violet-200/50 via-indigo-100/40 to-blue-100/30 rounded-full blur-md" />
                  <div className="absolute inset-4 bg-gradient-to-br from-violet-100/60 to-slate-50/40 rounded-full" />
                  <NeedleLogo className="relative w-48 h-48 lg:w-64 lg:h-64" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-white section-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="max-w-3xl">
            <h2 className="font-heading font-light text-2xl lg:text-3xl text-slate-900 leading-relaxed">
              Shipping decisions become <span className="font-black text-violet-900">defensible</span>, <span className="font-black text-violet-900">reconstructable</span>, and <span className="font-black text-violet-900">accountable</span> under scrutiny.
            </h2>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 lg:py-32 section-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-12">
            <p className="text-violet-900 font-mono text-sm mb-2 tracking-wide">FRAMEWORKS</p>
            <h2 className="font-heading font-black text-3xl lg:text-4xl text-slate-900">Productized Governance</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AurorAI */}
            <motion.div 
              className="card group"
              whileHover={{ y: -4 }}
              data-testid="service-aurorai"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-slate-900 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl">AurorAI</h3>
                  <p className="text-slate-500 text-sm">Governance Engine</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Built for teams deploying AI features, model integrations, or automations that need inspection-ready control without bureaucracy.
              </p>
              <p className="font-mono text-sm text-violet-900 mb-6">
                AurorAI governs shipping.
              </p>
              <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 group-hover:text-violet-900 transition-colors">
                Learn more <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>

            {/* CompassAI */}
            <motion.div 
              className="card group"
              whileHover={{ y: -4 }}
              data-testid="service-compassai"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-violet-900 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl">CompassAI</h3>
                  <p className="text-slate-500 text-sm">Agentic Governance</p>
                </div>
              </div>
              <p className="text-slate-600 mb-6">
                Built for agentic systems that route tasks, call tools, and act under delegated authority where the risk is unauthorized action.
              </p>
              <p className="font-mono text-sm text-violet-900 mb-6">
                CompassAI governs delegated agency.
              </p>
              <Link to="/services" className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 group-hover:text-violet-900 transition-colors">
                Learn more <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Agentic Governance */}
      <section className="py-20 lg:py-32 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-violet-400 font-mono text-sm mb-4 tracking-wide">AGENTIC GOVERNANCE</p>
              <h2 className="font-heading font-black text-3xl lg:text-4xl mb-6">The Governance Object Has Changed</h2>
              <div className="space-y-4 text-slate-300 leading-relaxed">
                <p>
                  Agentic AI changes the governance object. The problem is no longer "a model that predicts." The problem is "a system that acts": it plans, routes tasks, calls tools, writes to systems, and produces outcomes that can materially affect people, operations, and reputation.
                </p>
                <p>
                  Hallucinations still matter, but delegated authority becomes the dominant risk surface.
                </p>
                <p>
                  Agentic governance starts by making agency legible. You define what the agent can do, what it can touch, and what it must never do without explicit approval. You then bind those limits to controls that actually execute in the stack, not just on paper.
                </p>
              </div>
            </div>
            <div className="bg-slate-800 p-8">
              <h3 className="font-heading font-bold text-lg mb-6">Practical Agentic Governance Baseline</h3>
              <ul className="space-y-4 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Agency boundaries</span>
                    <p className="text-sm mt-1">Allowed actions, prohibited actions, and escalation thresholds.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Tool permissions</span>
                    <p className="text-sm mt-1">Which tools can be called, under which conditions, with which scopes.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Data rights</span>
                    <p className="text-sm mt-1">Read and write permissions, retention, and redaction rules.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Material decision gates</span>
                    <p className="text-sm mt-1">What requires a human, what can run autonomously, and how overrides work.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Evidence and replayability</span>
                    <p className="text-sm mt-1">Logs that support investigation, audit, and post-incident accountability.</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-white font-medium">Stop mechanisms</span>
                    <p className="text-sm mt-1">Rate limits, circuit breakers, and a kill switch with named owners.</p>
                  </div>
                </li>
              </ul>
              <p className="mt-6 pt-6 border-t border-slate-700 text-slate-400 text-sm">
                The goal is simple: delegated action must remain reviewable, bounded, and defensible, especially when the system operates at speed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-32 section-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-heading font-black text-3xl lg:text-4xl text-slate-900 mb-6">
            Ready to build defensible AI?
          </h2>
          <p className="text-slate-600 text-lg mb-8 max-w-2xl mx-auto">
            Start with a free governance assessment to identify gaps and priorities.
          </p>
          <Link to="/assessment" className="btn-primary" data-testid="cta-assessment">
            Take the Assessment <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

// About Page
const About = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <div className="lg:col-span-2">
              <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">ABOUT</p>
              <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-8">
                Martin Lepage, PhD
              </h1>
              <div className="prose prose-lg max-w-none text-slate-600 leading-relaxed space-y-6">
                <p>
                  I build inspection-ready AI governance by embedding constraint design into real workflow gates, so evidence stays legible and decisions hold under scrutiny.
                </p>
                <p>
                  Most organizations have capable leaders and legal awareness, but they lack an executable language that converts intent into controls, controls into proof, and proof into defensible outcomes across the AI lifecycle.
                </p>
                <p>
                  My work focuses on the operational layer where risk tiering, safeguards, approvals, and monitoring triggers become enforceable, reviewable, and repeatable.
                </p>
                <p>
                  I treat AI systems as socio-technical infrastructure: models plus data, tools, interfaces, permissions, branding claims, and institutional accountability.
                </p>
                <p>
                  The result is governance with teeth, not compliance theater: clear boundaries, defined authority, auditable evidence trails, and incident-ready response pathways.
                </p>
                <p className="text-slate-900 font-medium">
                  AurorAI and CompassAI support this work by standardizing intake, control selection, evidence mapping, and decision records across teams.
                </p>
              </div>
            </div>
            <div className="lg:col-span-1">
              <div className="sticky top-32 space-y-6">
                <div className="card">
                  <h3 className="font-heading font-bold text-lg mb-4">Connect</h3>
                  <div className="space-y-3">
                    <a href="https://www.linkedin.com/in/martin-lepage-ai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-violet-900 transition-colors">
                      <Linkedin className="w-5 h-5" />
                      <span>LinkedIn</span>
                    </a>
                    <a href="https://github.com/martinlepage26-bit" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-600 hover:text-violet-900 transition-colors">
                      <Github className="w-5 h-5" />
                      <span>GitHub</span>
                    </a>
                    <a href="mailto:Consult@govern-ai.ca" className="flex items-center gap-3 text-slate-600 hover:text-violet-900 transition-colors">
                      <Mail className="w-5 h-5" />
                      <span>Consult@govern-ai.ca</span>
                    </a>
                  </div>
                </div>
                <div className="card bg-slate-900 text-white">
                  <h3 className="font-heading font-bold text-lg mb-3">Frameworks</h3>
                  <div className="space-y-3">
                    <a href="https://github.com/martinlepage26-bit/AurorAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                      <Activity className="w-5 h-5" />
                      <div>
                        <span className="block font-medium text-white">AurorAI</span>
                        <span className="text-xs">Governs shipping</span>
                      </div>
                    </a>
                    <a href="https://github.com/martinlepage26-bit/CompassAI" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors">
                      <Compass className="w-5 h-5" />
                      <div>
                        <span className="block font-medium text-white">CompassAI</span>
                        <span className="text-xs">Governs delegated agency</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Services Page
const Services = () => {
  const services = [
    {
      title: "Governance Assessment and Roadmap",
      description: "Rapid diagnostic of current AI use, gaps, and the shortest path to audit-grade governance.",
      icon: ClipboardCheck
    },
    {
      title: "AI System Inventory and Boundary Mapping",
      description: "What exists, where it runs, what it touches, who it affects, and where authority actually sits.",
      icon: FileText
    },
    {
      title: "Risk Tiering and Control Design",
      description: "Risk classification aligned to your context, then safeguards that bind to real build and release steps.",
      icon: AlertTriangle
    },
    {
      title: "Workflow Gates and Approval Mechanisms",
      description: "Pre-deploy, post-deploy, and change gates that require evidence before shipping or scaling.",
      icon: Shield
    },
    {
      title: "Evidence Architecture and Decision Ledger",
      description: "What gets logged, retained, reviewed, and replayed so decisions remain defensible under scrutiny.",
      icon: BookOpen
    },
    {
      title: "Procurement and Vendor Governance Pack",
      description: "Due diligence questions, contract clauses, control requirements, and acceptance criteria that can be enforced.",
      icon: Briefcase
    },
    {
      title: "Agentic AI Governance and Tool-Use Controls",
      description: "Permissions, tool access, human-in-the-loop thresholds, and kill switches for delegated action systems.",
      icon: Compass
    },
    {
      title: "Incident Readiness and Response Protocols",
      description: "Detection triggers, escalation paths, rollback authority, communications, and post-incident learning.",
      icon: Activity
    }
  ];

  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">SERVICES</p>
          <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
            AI Governance Services
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            From rapid assessment to full implementation. Governance with teeth, not compliance theater.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-12 bg-white section-divider">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-2 gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                className="card group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-100 transition-colors">
                    <service.icon className="w-6 h-6 text-slate-600 group-hover:text-violet-900 transition-colors" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-2">{service.title}</h3>
                    <p className="text-slate-600">{service.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AurorAI */}
      <section className="py-20 section-divider" data-testid="services-aurorai-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-slate-900 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-3xl">AurorAI</h2>
                  <p className="text-slate-500">Governance Engine for Shipping Systems</p>
                </div>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Built for teams deploying AI features, model integrations, or automations that need inspection-ready control without turning governance into a bureaucracy.
              </p>
              <a 
                href="https://github.com/martinlepage26-bit/AurorAI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Github className="w-4 h-4" /> View on GitHub
              </a>
            </div>
            <div className="space-y-4">
              {[
                "Use case intake, system boundary, and data/interface map",
                "Risk tiering and control set selection",
                "Gate design for lifecycle moments (pre-deploy, post-deploy, change, retrain)",
                "Evidence ledger design (who decided, on what basis, with what tests)",
                "Exception protocol (how deviation is permitted)",
                "Monitoring and incident triggers"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50">
                  <CheckCircle className="w-5 h-5 text-slate-900 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CompassAI */}
      <section className="py-20 bg-white section-divider" data-testid="services-compassai-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="lg:order-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-violet-900 flex items-center justify-center">
                  <Compass className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-black text-3xl">CompassAI</h2>
                  <p className="text-slate-500">Agentic Governance for Delegated Action</p>
                </div>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed mb-8">
                Built for agentic systems that route tasks, call tools, and act under delegated authority where the primary risk is unauthorized action, not bad text.
              </p>
              <div className="flex gap-4">
                <a 
                  href="https://github.com/martinlepage26-bit/CompassAI" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn-secondary"
                >
                  <Github className="w-4 h-4" /> View on GitHub
                </a>
                <Link to="/compass" className="btn-primary">
                  Try CompassAI <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
            <div className="space-y-4 lg:order-1">
              {[
                "Agency map and permissions model",
                "Tooling boundaries and material-decision thresholds",
                "Logging, retention, replayability, and audit trace requirements",
                "Kill switch, rollback, and containment design",
                "Change-control discipline for prompts, tools, policies",
                "Incident playbooks for delegated action failures"
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-slate-50">
                  <CheckCircle className="w-5 h-5 text-violet-900 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-heading font-black text-3xl mb-6">Ready to build defensible AI?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Start with a governance assessment to identify gaps and the shortest path to audit-readiness.
          </p>
          <Link to="/contact" className="btn-primary bg-white text-slate-900 hover:bg-slate-100">
            Schedule a Call <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};

// Portfolio Page
const Portfolio = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const res = await axios.get(`${API}/portfolio`);
        setCases(res.data);
      } catch (e) {
        console.error("Failed to fetch portfolio", e);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">PORTFOLIO</p>
          <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
            Case Studies
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mb-12">
            Real governance challenges, practical solutions, measurable outcomes.
          </p>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading cases...</div>
          ) : (
            <div className="grid gap-8">
              {cases.map((c, i) => (
                <motion.div 
                  key={c.id}
                  className="card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  data-testid={`case-study-${c.id}`}
                >
                  <div className="flex flex-wrap gap-2 mb-4">
                    {c.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h3 className="font-heading font-bold text-xl mb-2">{c.title}</h3>
                  <p className="text-violet-900 font-mono text-sm mb-4">{c.client_type}</p>
                  
                  <div className="grid md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-2">Challenge</h4>
                      <p className="text-slate-600 text-sm">{c.challenge}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-2">Approach</h4>
                      <p className="text-slate-600 text-sm">{c.approach}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-500 uppercase tracking-wide mb-2">Outcome</h4>
                      <p className="text-slate-600 text-sm">{c.outcome}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Publications Page - Blog Section
const Publications = () => {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState(null);
  const [allTags, setAllTags] = useState([]);
  const [selectedPub, setSelectedPub] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPub, setEditingPub] = useState(null);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchPubs();
    fetchTags();
  }, [selectedTag]);

  const fetchPubs = async () => {
    try {
      const params = selectedTag ? `?tag=${encodeURIComponent(selectedTag)}` : '';
      const res = await axios.get(`${API}/publications${params}`);
      setPubs(res.data);
    } catch (e) {
      console.error("Failed to fetch publications", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const res = await axios.get(`${API}/publications/tags/all`);
      setAllTags(res.data);
    } catch (e) {
      console.error("Failed to fetch tags", e);
    }
  };

  const handleDelete = async (pubId) => {
    if (!window.confirm('Are you sure you want to delete this publication?')) return;
    try {
      await axios.delete(`${API}/publications/${pubId}`, { withCredentials: true });
      fetchPubs();
    } catch (e) {
      console.error("Failed to delete publication", e);
    }
  };

  const handleEdit = (pub) => {
    setEditingPub(pub);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPub(null);
    setShowEditor(true);
  };

  const handleViewArticle = async (pub) => {
    try {
      const res = await axios.get(`${API}/publications/${pub.id}`);
      setSelectedPub(res.data);
    } catch (e) {
      setSelectedPub(pub);
    }
  };

  // Article Modal View
  if (selectedPub) {
    return (
      <div className="min-h-screen pt-20">
        <section className="py-12 lg:py-20">
          <div className="max-w-4xl mx-auto px-6 lg:px-12">
            <button 
              onClick={() => setSelectedPub(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
              data-testid="back-to-publications"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Publications
            </button>
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="font-mono text-sm text-violet-900">{selectedPub.date}</span>
                {selectedPub.tags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-mono">
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="font-heading font-black text-3xl lg:text-4xl text-slate-900 mb-6">
                {selectedPub.title}
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed mb-8 border-l-4 border-violet-200 pl-4">
                {selectedPub.abstract}
              </p>
              {selectedPub.content ? (
                <div className="prose prose-lg max-w-none prose-headings:font-heading prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-violet-900">
                  {selectedPub.content.split('\n').map((line, i) => {
                    // Helper to render inline bold text
                    const renderInlineBold = (text) => {
                      const parts = text.split(/(\*\*[^*]+\*\*)/g);
                      return parts.map((part, idx) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={idx}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      });
                    };
                    
                    if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{renderInlineBold(line.slice(2))}</h1>;
                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold mt-6 mb-3">{renderInlineBold(line.slice(3))}</h2>;
                    if (line.startsWith('- ')) return <li key={i} className="ml-6 mb-2">{renderInlineBold(line.slice(2))}</li>;
                    if (line.trim() === '') return <br key={i} />;
                    return <p key={i} className="mb-4">{renderInlineBold(line)}</p>;
                  })}
                </div>
              ) : (
                <p className="text-slate-500 italic">Full article content not available.</p>
              )}
              {selectedPub.link && (
                <div className="mt-12 pt-8 border-t border-slate-200">
                  <a 
                    href={selectedPub.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <ExternalLink className="w-4 h-4" /> View on LinkedIn
                  </a>
                </div>
              )}
            </motion.article>
          </div>
        </section>
      </div>
    );
  }

  // Editor Modal
  if (showEditor) {
    return (
      <PublicationEditor 
        publication={editingPub}
        onClose={() => { setShowEditor(false); setEditingPub(null); }}
        onSave={() => { setShowEditor(false); setEditingPub(null); fetchPubs(); }}
      />
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">PUBLICATIONS</p>
              <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
                Research & Writing
              </h1>
              <p className="text-slate-600 text-lg max-w-2xl">
                Thoughts on AI governance, decision machinery, and building defensible systems.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={handleCreate}
                className="btn-primary flex-shrink-0"
                data-testid="create-publication-btn"
              >
                <Plus className="w-4 h-4" /> New Publication
              </button>
            )}
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2 items-center">
              <Tag className="w-4 h-4 text-slate-400" />
              <button
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1.5 text-sm font-mono transition-colors ${
                  selectedTag === null 
                    ? 'bg-violet-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                data-testid="filter-all"
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-3 py-1.5 text-sm font-mono transition-colors ${
                    selectedTag === tag 
                      ? 'bg-violet-900 text-white' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  data-testid={`filter-${tag.toLowerCase().replace(/\s/g, '-')}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading publications...</div>
          ) : pubs.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              {selectedTag ? `No publications found with tag "${selectedTag}"` : 'No publications yet.'}
            </div>
          ) : (
            <div className="space-y-6">
              {pubs.map((pub, i) => (
                <motion.div 
                  key={pub.id}
                  className="card group cursor-pointer"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  data-testid={`publication-${pub.id}`}
                  onClick={() => handleViewArticle(pub)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="font-mono text-sm text-slate-400">{pub.date}</span>
                      </div>
                      <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-violet-900 transition-colors">
                        {pub.title}
                      </h3>
                      <p className="text-slate-600 mb-4">{pub.abstract}</p>
                      <div className="flex flex-wrap gap-2">
                        {pub.tags?.map(tag => (
                          <span 
                            key={tag} 
                            className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-mono"
                            onClick={(e) => { e.stopPropagation(); setSelectedTag(tag); }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(pub); }}
                            className="p-2 border border-slate-200 hover:border-violet-900 hover:bg-violet-50 transition-colors"
                            data-testid={`edit-${pub.id}`}
                          >
                            <Edit2 className="w-4 h-4 text-slate-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(pub.id); }}
                            className="p-2 border border-slate-200 hover:border-red-500 hover:bg-red-50 transition-colors"
                            data-testid={`delete-${pub.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-slate-400" />
                          </button>
                        </>
                      )}
                      <div className="p-2 border border-slate-200 group-hover:border-violet-900 transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-violet-900" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Publication Editor Component
const PublicationEditor = ({ publication, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: publication?.title || '',
    abstract: publication?.abstract || '',
    content: publication?.content || '',
    date: publication?.date || new Date().toISOString().slice(0, 7),
    link: publication?.link || '',
    tags: publication?.tags?.join(', ') || '',
    published: publication?.published !== false
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const data = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (publication) {
        await axios.put(`${API}/publications/${publication.id}`, data, { withCredentials: true });
      } else {
        await axios.post(`${API}/publications`, data, { withCredentials: true });
      }
      onSave();
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to save publication');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-6 lg:px-12">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </button>
          
          <h1 className="font-heading font-black text-3xl text-slate-900 mb-8">
            {publication ? 'Edit Publication' : 'New Publication'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                placeholder="Publication title"
                data-testid="pub-title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Abstract *</label>
              <textarea
                required
                rows={3}
                value={form.abstract}
                onChange={e => setForm(prev => ({ ...prev, abstract: e.target.value }))}
                className="input-field resize-none"
                placeholder="Brief summary of the publication"
                data-testid="pub-abstract"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Content (Markdown)</label>
              <textarea
                rows={15}
                value={form.content}
                onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                className="input-field resize-none font-mono text-sm"
                placeholder="# Main Heading&#10;&#10;## Section&#10;&#10;Content goes here..."
                data-testid="pub-content"
              />
              <p className="text-xs text-slate-400 mt-1">Supports basic Markdown: # headings, ## subheadings, - lists, **bold**</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                <input
                  type="text"
                  required
                  value={form.date}
                  onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                  className="input-field"
                  placeholder="YYYY-MM"
                  data-testid="pub-date"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">External Link</label>
                <input
                  type="url"
                  value={form.link}
                  onChange={e => setForm(prev => ({ ...prev, link: e.target.value }))}
                  className="input-field"
                  placeholder="https://..."
                  data-testid="pub-link"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tags</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                className="input-field"
                placeholder="AI Governance, Controls, Audit (comma-separated)"
                data-testid="pub-tags"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={e => setForm(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4"
                data-testid="pub-published"
              />
              <label htmlFor="published" className="text-sm text-slate-700">Published (visible to public)</label>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary disabled:opacity-50"
                data-testid="save-publication"
              >
                {submitting ? 'Saving...' : <><Save className="w-4 h-4" /> Save Publication</>}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
};

// Assessment Page
const Assessment = () => {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API}/assessment/questions`);
        setQuestions(res.data);
      } catch (e) {
        console.error("Failed to fetch questions", e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (questionId, optionIndex) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/assessment/submit`, { answers });
      setResult(res.data);
    } catch (e) {
      console.error("Failed to submit assessment", e);
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <p className="text-slate-500">Loading assessment...</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen pt-20">
        <section className="py-20 lg:py-32">
          <div className="max-w-3xl mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">ASSESSMENT COMPLETE</p>
              <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-8">
                Your Governance Score
              </h1>

              <div className="card mb-8" data-testid="assessment-result">
                <div className="text-center mb-8">
                  <p className={`font-heading font-black text-7xl ${getScoreColor(result.overall_score)}`}>
                    {result.overall_score}
                  </p>
                  <p className="text-slate-500 text-lg">out of 100</p>
                </div>

                <div className="mb-8">
                  <h3 className="font-heading font-bold text-lg mb-4">Category Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(result.category_scores).map(([cat, score]) => (
                      <div key={cat} className="flex items-center justify-between">
                        <span className="text-slate-600">{cat}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-slate-100 overflow-hidden">
                            <div 
                              className="h-full bg-violet-900 transition-all duration-500"
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="font-mono text-sm w-8">{score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="font-heading font-bold text-lg mb-4">Analysis</h3>
                  <p className="text-slate-600">{result.analysis}</p>
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg mb-4">Recommendations</h3>
                  <div className="space-y-3">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 bg-slate-50">
                        <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/contact" className="btn-primary" data-testid="result-cta-contact">
                  Discuss Your Results <ArrowRight className="w-4 h-4" />
                </Link>
                <button 
                  onClick={() => { setResult(null); setCurrentStep(0); setAnswers({}); }}
                  className="btn-secondary"
                  data-testid="result-retake"
                >
                  Retake Assessment
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 lg:py-32">
        <div className="max-w-3xl mx-auto px-6 lg:px-12">
          {/* Progress */}
          <div className="mb-12">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-mono text-slate-500">Question {currentStep + 1} of {questions.length}</span>
              <span className="font-mono text-slate-500">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-slate-200 overflow-hidden">
              <motion.div 
                className="h-full bg-violet-900"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-violet-900 font-mono text-sm mb-4">{currentQuestion.category}</p>
              <h2 className="font-heading font-bold text-2xl lg:text-3xl text-slate-900 mb-8">
                {currentQuestion.question}
              </h2>

              <div className="space-y-4 mb-12">
                {currentQuestion.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(currentQuestion.id, i)}
                    className={`w-full text-left p-6 border-2 transition-all ${
                      answers[currentQuestion.id] === i 
                        ? 'border-violet-900 bg-violet-50' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                    data-testid={`option-${i}`}
                  >
                    <span className="font-mono text-sm text-slate-400 mr-3">{String.fromCharCode(65 + i)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="assessment-prev"
            >
              Previous
            </button>

            {currentStep === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length < questions.length || submitting}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="assessment-submit"
              >
                {submitting ? 'Analyzing...' : 'Get Results'} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion.id] === undefined}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="assessment-next"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

// AurorAI Page Wrapper
const AurorAIPage = () => {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <AurorAIApp />
        </div>
      </section>
    </div>
  );
};

// CompassAI Page Wrapper
const CompassAIPage = () => {
  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <CompassAIApp />
        </div>
      </section>
    </div>
  );
};

// Contact Page
const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await axios.post(`${API}/contact`, form);
      setSuccess(true);
      setForm({ name: '', email: '', company: '', message: '' });
    } catch (e) {
      setError('Failed to send message. Please try emailing directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">CONTACT</p>
              <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
                Let's Talk Governance
              </h1>
              <p className="text-slate-600 text-lg mb-8">
                Have questions about AI governance? Want to discuss a specific challenge? Reach out.
              </p>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card bg-emerald-50 border-emerald-200"
                  data-testid="contact-success"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-heading font-bold text-lg text-emerald-900">Message Sent</h3>
                  </div>
                  <p className="text-emerald-700">
                    Thank you for reaching out. I'll respond within 24-48 hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6" data-testid="contact-form">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Your name"
                      data-testid="contact-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      placeholder="your@email.com"
                      data-testid="contact-email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                      className="input-field"
                      placeholder="Your company (optional)"
                      data-testid="contact-company"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={form.message}
                      onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                      className="input-field resize-none"
                      placeholder="Tell me about your governance challenge..."
                      data-testid="contact-message"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="btn-primary w-full disabled:opacity-50"
                    data-testid="contact-submit"
                  >
                    {submitting ? 'Sending...' : 'Send Message'} <Send className="w-4 h-4" />
                  </button>
                </form>
              )}

              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-slate-500 text-sm mb-4">Or reach out directly:</p>
                <a href="mailto:Consult@govern-ai.ca" className="flex items-center gap-2 text-slate-900 hover:text-violet-900 transition-colors">
                  <Mail className="w-5 h-5" /> Consult@govern-ai.ca
                </a>
              </div>
            </div>

            {/* Calendly */}
            <div>
              <h2 className="font-heading font-bold text-2xl text-slate-900 mb-6">
                Schedule a Consultation
              </h2>
              <p className="text-slate-600 mb-6">
                Book a free 30-minute call to discuss your AI governance needs.
              </p>
              <div className="card p-0 overflow-hidden" data-testid="calendly-widget">
                <InlineWidget 
                  url="https://calendly.com/martinlepage-ai"
                  styles={{ height: '700px', minWidth: '320px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// ============ AUTH PAGES ============

// Login Page
const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard');
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-16 h-16 bg-slate-900 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Client Portal</h1>
          <p className="text-slate-600 mb-8">
            Sign in to access your governance dashboard
          </p>
          <button
            onClick={login}
            className="btn-primary w-full justify-center"
            data-testid="login-google-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          <p className="text-xs text-slate-400 mt-6">
            Don't have access? <Link to="/request-access" className="text-blue-600 hover:underline">Request access</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

// Request Access Page
const RequestAccessPage = () => {
  const [form, setForm] = useState({ name: '', email: '', company: '', use_case: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API}/auth/request-access`, form);
      setSuccess(true);
    } catch (e) {
      console.error("Failed to submit request", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20">
        <div className="max-w-2xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-blue-600 font-mono text-sm mb-4 tracking-wide">CLIENT PORTAL</p>
            <h1 className="font-heading font-black text-4xl text-slate-900 mb-4">
              Request Access
            </h1>
            <p className="text-slate-600 text-lg mb-8">
              Access to AurorAI and CompassAI is by invitation. Submit your request below and I'll review it within 24-48 hours.
            </p>

            {success ? (
              <div className="card bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <h3 className="font-heading font-bold text-lg text-emerald-900">Request Submitted</h3>
                </div>
                <p className="text-emerald-700 mb-4">
                  Your access request has been received. You'll receive an email once approved.
                </p>
                <p className="text-sm text-emerald-600">
                  Already have access? <button onClick={login} className="underline font-medium">Sign in here</button>
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card space-y-6" data-testid="request-access-form">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))}
                      className="input-field"
                      placeholder="work@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={e => setForm(prev => ({ ...prev, company: e.target.value }))}
                    className="input-field"
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Use Case *</label>
                  <select
                    required
                    value={form.use_case}
                    onChange={e => setForm(prev => ({ ...prev, use_case: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">Select your primary use case...</option>
                    <option value="document_processing">Document Processing (AurorAI)</option>
                    <option value="governance_tracking">AI Governance Tracking (CompassAI)</option>
                    <option value="both">Both - Full Governance Suite</option>
                    <option value="evaluation">Evaluation / Demo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Additional Context</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                    className="input-field resize-none"
                    placeholder="Tell me about your governance needs..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'} <ArrowRight className="w-4 h-4" />
                </button>
                <p className="text-center text-sm text-slate-500">
                  Already have access? <button type="button" onClick={login} className="text-blue-600 hover:underline">Sign in</button>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Pending Approval Page
const PendingApprovalPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen pt-20 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <div className="w-16 h-16 bg-amber-100 flex items-center justify-center mx-auto mb-6 rounded-full">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="font-heading font-bold text-2xl mb-2">Access Pending</h1>
          <p className="text-slate-600 mb-6">
            Hi {user?.name?.split(' ')[0]}, your account is awaiting approval. You'll receive an email once access is granted.
          </p>
          <div className="p-4 bg-slate-50 text-left mb-6">
            <p className="text-sm text-slate-500">Signed in as</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <button onClick={logout} className="btn-secondary w-full justify-center">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
};

// Client Dashboard
const ClientDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="mb-8">
            <p className="text-blue-600 font-mono text-sm mb-2">WELCOME BACK</p>
            <h1 className="font-heading font-bold text-3xl">{user?.name}</h1>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* AurorAI Card */}
            <Link to="/client/aurora" className="card group hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-slate-900 flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Activity className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">AurorAI</h2>
                  <p className="text-slate-500 text-sm">Document Processing</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                Upload documents for intelligent extraction. View your processed files and extraction results.
              </p>
              <span className="text-blue-600 font-medium flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            {/* CompassAI Card */}
            <Link to="/client/compass" className="card group hover:border-violet-300 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-violet-900 flex items-center justify-center group-hover:bg-violet-700 transition-colors">
                  <Compass className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-heading font-bold text-xl">CompassAI</h2>
                  <p className="text-slate-500 text-sm">Governance Dashboard</p>
                </div>
              </div>
              <p className="text-slate-600 mb-4">
                View your governance use cases, risk assessments, and generated deliverables.
              </p>
              <span className="text-violet-600 font-medium flex items-center gap-2">
                Open Dashboard <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

// Admin Dashboard
const AdminDashboard = () => {
  const [accessRequests, setAccessRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [reqRes, userRes] = await Promise.all([
        axios.get(`${API}/auth/access-requests`, { withCredentials: true }),
        axios.get(`${API}/auth/users`, { withCredentials: true })
      ]);
      setAccessRequests(reqRes.data);
      setUsers(userRes.data);
    } catch (e) {
      console.error("Failed to fetch admin data", e);
    }
  };

  const approveRequest = async (id) => {
    try {
      await axios.post(`${API}/auth/access-requests/${id}/approve`, {}, { withCredentials: true });
      fetchData();
    } catch (e) {
      console.error("Failed to approve", e);
    }
  };

  const rejectRequest = async (id) => {
    try {
      await axios.post(`${API}/auth/access-requests/${id}/reject`, {}, { withCredentials: true });
      fetchData();
    } catch (e) {
      console.error("Failed to reject", e);
    }
  };

  const toggleUserApproval = async (userId, currentlyApproved) => {
    try {
      const endpoint = currentlyApproved ? 'revoke' : 'approve';
      await axios.post(`${API}/auth/users/${userId}/${endpoint}`, {}, { withCredentials: true });
      fetchData();
    } catch (e) {
      console.error("Failed to update user", e);
    }
  };

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  return (
    <div className="min-h-screen pt-20">
      <section className="py-12 lg:py-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-600 font-mono text-sm mb-2">ADMIN</p>
              <h1 className="font-heading font-bold text-3xl">Governance Admin</h1>
            </div>
            <div className="flex gap-4">
              <Link to="/admin/aurora" className="btn-secondary">
                <Activity className="w-4 h-4" /> AurorAI
              </Link>
              <Link to="/admin/compass" className="btn-primary">
                <Compass className="w-4 h-4" /> CompassAI
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("requests")}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === "requests" ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
              }`}
            >
              Access Requests {pendingRequests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === "users" ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'
              }`}
            >
              Users ({users.length})
            </button>
          </div>

          {activeTab === "requests" && (
            <div className="space-y-4">
              {accessRequests.length === 0 ? (
                <div className="card text-center py-12 text-slate-500">
                  No access requests yet.
                </div>
              ) : (
                accessRequests.map(req => (
                  <div key={req.id} className={`card ${req.status === 'pending' ? 'border-amber-200 bg-amber-50/30' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs text-slate-400">{req.id}</span>
                          <span className={`px-2 py-0.5 text-xs ${
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {req.status}
                          </span>
                        </div>
                        <h3 className="font-medium">{req.name}</h3>
                        <p className="text-sm text-slate-500">{req.email} • {req.company || 'No company'}</p>
                        <p className="text-sm text-slate-600 mt-2">Use case: {req.use_case}</p>
                        {req.message && <p className="text-sm text-slate-500 mt-1 italic">"{req.message}"</p>}
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveRequest(req.id)}
                            className="btn-primary py-2 px-4 text-sm"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                          <button
                            onClick={() => rejectRequest(req.id)}
                            className="btn-secondary py-2 px-4 text-sm"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              {users.map(u => (
                <div key={u.user_id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {u.picture ? (
                      <img src={u.picture} alt="" className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{u.name}</h3>
                        <span className={`px-2 py-0.5 text-xs ${
                          u.role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {u.role}
                        </span>
                        {u.role !== 'admin' && (
                          <span className={`px-2 py-0.5 text-xs ${
                            u.approved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {u.approved ? 'Approved' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </div>
                  </div>
                  {u.role !== 'admin' && (
                    <button
                      onClick={() => toggleUserApproval(u.user_id, u.approved)}
                      className={u.approved ? 'btn-secondary py-2 px-4 text-sm' : 'btn-primary py-2 px-4 text-sm'}
                    >
                      {u.approved ? 'Revoke' : 'Approve'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

// Client Aurora Page
const ClientAuroraPage = () => (
  <div className="min-h-screen pt-20">
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <AurorAIApp />
      </div>
    </section>
  </div>
);

// Client Compass Page  
const ClientCompassPage = () => (
  <div className="min-h-screen pt-20">
    <section className="py-12 lg:py-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <CompassAIApp />
      </div>
    </section>
  </div>
);

// App Router (handles session_id detection)
const AppRouter = () => {
  const location = useLocation();
  
  // Check URL fragment for session_id - must be synchronous during render
  if (location.hash?.includes('session_id=')) {
    return <AuthCallback />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/services" element={<Services />} />
      <Route path="/portfolio" element={<Portfolio />} />
      <Route path="/publications" element={<Publications />} />
      <Route path="/assessment" element={<Assessment />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/request-access" element={<RequestAccessPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />

      {/* Client Routes */}
      <Route path="/dashboard" element={<ProtectedRoute requireApproved><ClientDashboard /></ProtectedRoute>} />
      <Route path="/client/aurora" element={<ProtectedRoute requireApproved><ClientAuroraPage /></ProtectedRoute>} />
      <Route path="/client/compass" element={<ProtectedRoute requireApproved><ClientCompassPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/aurora" element={<ProtectedRoute requireAdmin><ClientAuroraPage /></ProtectedRoute>} />
      <Route path="/admin/compass" element={<ProtectedRoute requireAdmin><ClientCompassPage /></ProtectedRoute>} />
    </Routes>
  );
};

// Main App
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Navigation />
          <AppRouter />
          <Footer />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
