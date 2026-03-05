import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
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
  LayoutDashboard
} from "lucide-react";
import CompassAIApp from "./CompassAI";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Logo Components
const NeedleLogo = ({ className = "w-10 h-10", removeBackground = false }) => (
  <img 
    src="https://customer-assets.emergentagent.com/job_landing-guide-8/artifacts/4azal0zf_needle.png" 
    alt="Govern-AI" 
    className={className}
    style={{ 
      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
      mixBlendMode: removeBackground ? 'multiply' : 'normal'
    }}
  />
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
    { path: "/portfolio", label: "Portfolio" },
    { path: "/publications", label: "Publications" },
    { path: "/assessment", label: "Assessment" },
    { path: "/compass", label: "CompassAI" },
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
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map(link => (
              <Link 
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors ${location.pathname === link.path ? 'text-violet-900' : 'text-slate-600 hover:text-slate-900'}`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
            <a 
              href="https://www.linkedin.com/in/martin-lepage-ai/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-600 hover:text-slate-900 transition-colors"
              data-testid="nav-linkedin"
            >
              <Linkedin className="w-5 h-5" />
            </a>
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
              {navLinks.map(link => (
                <Link 
                  key={link.path}
                  to={link.path}
                  className={`block text-base font-medium ${location.pathname === link.path ? 'text-violet-900' : 'text-slate-600'}`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
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
                  <NeedleLogo className="w-56 h-56 lg:w-72 lg:h-72" removeBackground={true} />
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
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-violet-400 font-mono text-sm mb-4 tracking-wide">CURRENT PERSPECTIVE</p>
              <h2 className="font-heading font-black text-3xl lg:text-4xl mb-6">Agentic AI Changes Everything</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Agentic AI turns autonomy into a governance problem because the system does not only generate outputs—it initiates action under delegated authority.
              </p>
              <p className="text-slate-300 leading-relaxed">
                The center of gravity shifts from "is the model accurate" to "what is the system allowed to do, in whose name, with what permissions, and with what proof."
              </p>
            </div>
            <div className="bg-slate-800 p-8">
              <h3 className="font-heading font-bold text-lg mb-4">A governed agent is defined by:</h3>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Explicit tool permissions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Material-decision gates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Replayable logs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Tested containment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Escalation paths that trigger consequences</span>
                </li>
              </ul>
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

// Services Page
const Services = () => {
  return (
    <div className="min-h-screen pt-20">
      {/* Header */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">SERVICES</p>
          <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
            Productized AI Governance
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl">
            Two frameworks. One mission: make AI systems defensible, reconstructable, and accountable.
          </p>
        </div>
      </section>

      {/* AurorAI */}
      <section className="py-20 bg-white section-divider" data-testid="services-aurorai-section">
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
      <section className="py-20 section-divider" data-testid="services-compassai-section">
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
              <a 
                href="https://github.com/martinlepage26-bit/CompassAI" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Github className="w-4 h-4" /> View on GitHub
              </a>
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
          <h2 className="font-heading font-black text-3xl mb-6">Which framework fits your needs?</h2>
          <p className="text-slate-300 mb-8 max-w-xl mx-auto">
            Book a consultation to discuss your AI governance challenges and find the right approach.
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

// Publications Page
const Publications = () => {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPubs = async () => {
      try {
        const res = await axios.get(`${API}/publications`);
        setPubs(res.data);
      } catch (e) {
        console.error("Failed to fetch publications", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPubs();
  }, []);

  return (
    <div className="min-h-screen pt-20">
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <p className="text-violet-900 font-mono text-sm mb-4 tracking-wide">PUBLICATIONS</p>
          <h1 className="font-heading font-black text-4xl lg:text-5xl text-slate-900 mb-6">
            Research & Writing
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mb-12">
            Thoughts on AI governance, decision machinery, and building defensible systems.
          </p>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading publications...</div>
          ) : (
            <div className="space-y-6">
              {pubs.map((pub, i) => (
                <motion.div 
                  key={pub.id}
                  className="card group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  data-testid={`publication-${pub.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-slate-400 mb-2">{pub.date}</p>
                      <h3 className="font-heading font-bold text-xl mb-3 group-hover:text-violet-900 transition-colors">
                        {pub.title}
                      </h3>
                      <p className="text-slate-600 mb-4">{pub.abstract}</p>
                      <div className="flex flex-wrap gap-2">
                        {pub.tags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-500 text-xs font-mono">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    {pub.link && (
                      <a 
                        href={pub.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex-shrink-0 p-3 border border-slate-200 hover:border-violet-900 transition-colors"
                      >
                        <ExternalLink className="w-5 h-5 text-slate-400" />
                      </a>
                    )}
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

// Main App
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/publications" element={<Publications />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/compass" element={<CompassAIPage />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </div>
  );
}

export default App;
