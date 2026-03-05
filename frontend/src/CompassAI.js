import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Compass,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Shield,
  Users,
  ChevronRight,
  ChevronDown,
  Download,
  Eye,
  Settings,
  Activity,
  Filter,
  Search,
  X,
  ArrowRight,
  RefreshCw
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/compass`;

// Risk tier colors
const TIER_COLORS = {
  T0: { bg: "bg-emerald-100", text: "text-emerald-700", border: "border-emerald-300" },
  T1: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-300" },
  T2: { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-300" },
  T3: { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" }
};

const STATUS_COLORS = {
  draft: "bg-slate-100 text-slate-600",
  in_review: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  approved_with_conditions: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
  retired: "bg-slate-200 text-slate-500"
};

// Dashboard Component
const Dashboard = ({ stats, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-bold text-2xl">Governance Dashboard</h2>
        <button onClick={onRefresh} className="btn-secondary text-xs py-2 px-4">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <p className="text-slate-500 text-sm mb-1">Total Use Cases</p>
          <p className="font-heading font-bold text-3xl">{stats.total_usecases}</p>
        </div>
        <div className="card p-6">
          <p className="text-slate-500 text-sm mb-1">Pending Approvals</p>
          <p className="font-heading font-bold text-3xl text-amber-600">{stats.pending_approvals}</p>
        </div>
        <div className="card p-6">
          <p className="text-slate-500 text-sm mb-1">Controls</p>
          <p className="font-heading font-bold text-3xl">{stats.controls_count}</p>
        </div>
        <div className="card p-6">
          <p className="text-slate-500 text-sm mb-1">Policies</p>
          <p className="font-heading font-bold text-3xl">{stats.policies_count}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-heading font-bold text-lg mb-4">By Risk Tier</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_risk_tier || {}).map(([tier, count]) => (
              <div key={tier} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-mono ${TIER_COLORS[tier]?.bg || 'bg-slate-100'} ${TIER_COLORS[tier]?.text || 'text-slate-600'}`}>
                    {tier}
                  </span>
                  <span className="text-slate-600 text-sm">
                    {tier === 'T0' ? 'Low' : tier === 'T1' ? 'Moderate' : tier === 'T2' ? 'High' : 'Critical'}
                  </span>
                </div>
                <span className="font-mono font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-heading font-bold text-lg mb-4">By Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.by_status || {}).filter(([_, count]) => count > 0).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs ${STATUS_COLORS[status] || 'bg-slate-100 text-slate-600'}`}>
                  {status.replace(/_/g, ' ')}
                </span>
                <span className="font-mono font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Use Case List
const UseCaseList = ({ usecases, onSelect, onNew }) => {
  const [filter, setFilter] = useState("");
  
  const filtered = usecases.filter(uc => 
    uc.purpose.toLowerCase().includes(filter.toLowerCase()) ||
    uc.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search use cases..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input-field pl-10"
            data-testid="usecase-search"
          />
        </div>
        <button onClick={onNew} className="btn-primary" data-testid="new-usecase-btn">
          <Plus className="w-4 h-4" /> New Use Case
        </button>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-slate-500">
            No use cases found. Create your first use case to get started.
          </div>
        ) : (
          filtered.map(uc => (
            <motion.div
              key={uc.id}
              className="card cursor-pointer hover:border-violet-300 transition-colors"
              onClick={() => onSelect(uc)}
              whileHover={{ y: -2 }}
              data-testid={`usecase-${uc.id}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-sm text-slate-400">{uc.id}</span>
                    {uc.risk_tier && (
                      <span className={`px-2 py-0.5 text-xs font-mono ${TIER_COLORS[uc.risk_tier]?.bg} ${TIER_COLORS[uc.risk_tier]?.text}`}>
                        {uc.risk_tier}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 text-xs ${STATUS_COLORS[uc.status]}`}>
                      {uc.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <h3 className="font-medium text-slate-900 mb-1">{uc.purpose}</h3>
                  <p className="text-sm text-slate-500">
                    Owner: {uc.business_owner?.name} • {uc.systems_involved?.length || 0} systems
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// New Use Case Wizard
const NewUseCaseWizard = ({ onClose, onCreated }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    purpose: "",
    business_owner: { name: "", email: "" },
    model_owner: { name: "", email: "" },
    systems_involved: [],
    data_categories: [],
    automation_level: "assistive",
    regulated_domain: false,
    domain_type: "",
    known_unknowns: []
  });
  const [systemInput, setSystemInput] = useState("");
  const [unknownInput, setUnknownInput] = useState("");

  const dataCategories = ["PII", "PHI", "Financial", "Biometrics", "Child Data", "Trade Secrets", "Public Data"];
  const domainTypes = ["Healthcare", "Finance", "Public Sector", "Education", "Legal", "Other"];

  const addSystem = () => {
    if (systemInput.trim()) {
      setForm(prev => ({ ...prev, systems_involved: [...prev.systems_involved, systemInput.trim()] }));
      setSystemInput("");
    }
  };

  const addUnknown = () => {
    if (unknownInput.trim()) {
      setForm(prev => ({ ...prev, known_unknowns: [...prev.known_unknowns, unknownInput.trim()] }));
      setUnknownInput("");
    }
  };

  const toggleDataCategory = (cat) => {
    setForm(prev => ({
      ...prev,
      data_categories: prev.data_categories.includes(cat)
        ? prev.data_categories.filter(c => c !== cat)
        : [...prev.data_categories, cat]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        model_owner: form.model_owner.name ? form.model_owner : null
      };
      const res = await axios.post(`${API}/usecases`, payload);
      onCreated(res.data);
    } catch (e) {
      console.error("Failed to create use case", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        data-testid="new-usecase-wizard"
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <div>
            <p className="text-violet-900 font-mono text-sm">Step {step} of 3</p>
            <h2 className="font-heading font-bold text-xl">New Use Case Intake</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Purpose *</label>
                <textarea
                  value={form.purpose}
                  onChange={e => setForm(prev => ({ ...prev, purpose: e.target.value }))}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Describe the purpose and goal of this AI use case..."
                  data-testid="purpose-input"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Owner Name *</label>
                  <input
                    type="text"
                    value={form.business_owner.name}
                    onChange={e => setForm(prev => ({ ...prev, business_owner: { ...prev.business_owner, name: e.target.value } }))}
                    className="input-field"
                    placeholder="Name"
                    data-testid="owner-name-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Business Owner Email *</label>
                  <input
                    type="email"
                    value={form.business_owner.email}
                    onChange={e => setForm(prev => ({ ...prev, business_owner: { ...prev.business_owner, email: e.target.value } }))}
                    className="input-field"
                    placeholder="email@company.com"
                    data-testid="owner-email-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Systems Involved</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={systemInput}
                    onChange={e => setSystemInput(e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g., AurorAI, ERP, CRM"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSystem())}
                  />
                  <button type="button" onClick={addSystem} className="btn-secondary py-2">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.systems_involved.map((sys, i) => (
                    <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm flex items-center gap-2">
                      {sys}
                      <button onClick={() => setForm(prev => ({ ...prev, systems_involved: prev.systems_involved.filter((_, idx) => idx !== i) }))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Data Categories</label>
                <div className="flex flex-wrap gap-2">
                  {dataCategories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleDataCategory(cat)}
                      className={`px-3 py-2 border transition-colors ${
                        form.data_categories.includes(cat)
                          ? 'border-violet-900 bg-violet-50 text-violet-900'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Automation Level</label>
                <div className="grid grid-cols-3 gap-3">
                  {['informative', 'assistive', 'automated'].map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, automation_level: level }))}
                      className={`p-4 border text-center transition-colors ${
                        form.automation_level === level
                          ? 'border-violet-900 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <p className="font-medium capitalize">{level}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {level === 'informative' ? 'Provides info only' : level === 'assistive' ? 'Assists human decisions' : 'Makes decisions autonomously'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.regulated_domain}
                    onChange={e => setForm(prev => ({ ...prev, regulated_domain: e.target.checked }))}
                    className="w-5 h-5"
                  />
                  <span className="font-medium">Operates in a regulated domain</span>
                </label>
                {form.regulated_domain && (
                  <div className="mt-3 ml-8">
                    <select
                      value={form.domain_type}
                      onChange={e => setForm(prev => ({ ...prev, domain_type: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">Select domain...</option>
                      {domainTypes.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Known Unknowns</label>
                <p className="text-slate-500 text-sm mb-3">
                  What information is missing or uncertain? This helps the risk engine apply appropriate conservatism.
                </p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={unknownInput}
                    onChange={e => setUnknownInput(e.target.value)}
                    className="input-field flex-1"
                    placeholder="e.g., deployment region, retention policy, scale"
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUnknown())}
                  />
                  <button type="button" onClick={addUnknown} className="btn-secondary py-2">Add</button>
                </div>
                <div className="space-y-2">
                  {form.known_unknowns.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="flex-1 text-sm">{u}</span>
                      <button onClick={() => setForm(prev => ({ ...prev, known_unknowns: prev.known_unknowns.filter((_, idx) => idx !== i) }))}>
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200">
                <h4 className="font-medium mb-3">Summary</h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Purpose</dt>
                    <dd className="text-right max-w-xs truncate">{form.purpose || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Owner</dt>
                    <dd>{form.business_owner.name || '-'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Systems</dt>
                    <dd>{form.systems_involved.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Data Categories</dt>
                    <dd>{form.data_categories.length}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Automation</dt>
                    <dd className="capitalize">{form.automation_level}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Regulated</dt>
                    <dd>{form.regulated_domain ? `Yes (${form.domain_type || 'unspecified'})` : 'No'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex justify-between">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="btn-secondary">
              Back
            </button>
          ) : (
            <button onClick={onClose} className="btn-secondary">Cancel</button>
          )}
          
          {step < 3 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && (!form.purpose || !form.business_owner.name || !form.business_owner.email)}
              className="btn-primary disabled:opacity-50"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-primary disabled:opacity-50"
              data-testid="submit-usecase-btn"
            >
              {loading ? 'Creating...' : 'Create Use Case'} <CheckCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Use Case Detail View
const UseCaseDetail = ({ usecase, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [assessment, setAssessment] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAssessment();
    fetchDeliverables();
  }, [usecase.id]);

  const fetchAssessment = async () => {
    try {
      const res = await axios.get(`${API}/risk/assessments/${usecase.id}`);
      if (res.data.length > 0) setAssessment(res.data[0]);
    } catch (e) {
      console.error("Failed to fetch assessment", e);
    }
  };

  const fetchDeliverables = async () => {
    try {
      const res = await axios.get(`${API}/deliverables?usecase_id=${usecase.id}`);
      setDeliverables(res.data);
    } catch (e) {
      console.error("Failed to fetch deliverables", e);
    }
  };

  const runRiskAssessment = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API}/risk/assess?usecase_id=${usecase.id}`);
      setAssessment(res.data);
      onUpdate();
    } catch (e) {
      console.error("Failed to run assessment", e);
    } finally {
      setLoading(false);
    }
  };

  const generateDeliverables = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/deliverables/generate/${usecase.id}`);
      fetchDeliverables();
    } catch (e) {
      console.error("Failed to generate deliverables", e);
    } finally {
      setLoading(false);
    }
  };

  const exportAudit = async () => {
    try {
      const res = await axios.get(`${API}/audit/export/${usecase.id}`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-bundle-${usecase.id}.json`;
      a.click();
    } catch (e) {
      console.error("Failed to export audit", e);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "risk", label: "Risk", icon: AlertTriangle },
    { id: "controls", label: "Controls", icon: Shield },
    { id: "deliverables", label: "Deliverables", icon: FileText }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary py-2 px-4">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-slate-400">{usecase.id}</span>
            {usecase.risk_tier && (
              <span className={`px-2 py-0.5 text-xs font-mono ${TIER_COLORS[usecase.risk_tier]?.bg} ${TIER_COLORS[usecase.risk_tier]?.text}`}>
                {usecase.risk_tier}
              </span>
            )}
            <span className={`px-2 py-0.5 text-xs ${STATUS_COLORS[usecase.status]}`}>
              {usecase.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl">{usecase.purpose}</h2>
        </div>
        <button onClick={exportAudit} className="btn-secondary py-2 px-4" data-testid="export-audit-btn">
          <Download className="w-4 h-4" /> Export Audit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-violet-900 text-violet-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-heading font-bold mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500">Business Owner</dt>
                  <dd className="font-medium">{usecase.business_owner?.name} ({usecase.business_owner?.email})</dd>
                </div>
                {usecase.model_owner?.name && (
                  <div>
                    <dt className="text-slate-500">Model Owner</dt>
                    <dd>{usecase.model_owner.name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500">Automation Level</dt>
                  <dd className="capitalize">{usecase.automation_level}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Regulated Domain</dt>
                  <dd>{usecase.regulated_domain ? `Yes - ${usecase.domain_type || 'unspecified'}` : 'No'}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Created</dt>
                  <dd>{new Date(usecase.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-4">
              <div className="card">
                <h3 className="font-heading font-bold mb-3">Systems Involved</h3>
                <div className="flex flex-wrap gap-2">
                  {usecase.systems_involved?.length > 0 ? (
                    usecase.systems_involved.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-slate-100 text-slate-700 text-sm font-mono">{s}</span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">None specified</p>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="font-heading font-bold mb-3">Data Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {usecase.data_categories?.length > 0 ? (
                    usecase.data_categories.map((d, i) => (
                      <span key={i} className="px-3 py-1 bg-violet-100 text-violet-700 text-sm">{d}</span>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">None specified</p>
                  )}
                </div>
              </div>

              {usecase.known_unknowns?.length > 0 && (
                <div className="card bg-amber-50 border-amber-200">
                  <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Known Unknowns
                  </h3>
                  <ul className="space-y-2">
                    {usecase.known_unknowns.map((u, i) => (
                      <li key={i} className="text-sm text-amber-800">• {u}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "risk" && (
          <div className="space-y-6">
            {!assessment ? (
              <div className="card text-center py-12">
                <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="font-heading font-bold text-lg mb-2">No Risk Assessment</h3>
                <p className="text-slate-500 mb-6">Run a risk assessment to determine the tier and required controls.</p>
                <button
                  onClick={runRiskAssessment}
                  disabled={loading}
                  className="btn-primary"
                  data-testid="run-assessment-btn"
                >
                  {loading ? 'Assessing...' : 'Run Risk Assessment'}
                </button>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`card ${TIER_COLORS[assessment.risk_tier]?.bg} ${TIER_COLORS[assessment.risk_tier]?.border} border-2`}>
                    <p className="text-sm opacity-70 mb-1">Risk Tier</p>
                    <p className={`font-heading font-black text-4xl ${TIER_COLORS[assessment.risk_tier]?.text}`}>
                      {assessment.risk_tier}
                    </p>
                    <p className="text-sm mt-1">
                      {assessment.risk_tier === 'T0' ? 'Low Risk' : assessment.risk_tier === 'T1' ? 'Moderate Risk' : assessment.risk_tier === 'T2' ? 'High Risk' : 'Critical Risk'}
                    </p>
                  </div>
                  <div className="card">
                    <p className="text-slate-500 text-sm mb-1">Required Controls</p>
                    <p className="font-heading font-bold text-2xl">{assessment.required_controls?.length || 0}</p>
                  </div>
                  <div className="card">
                    <p className="text-slate-500 text-sm mb-1">Required Deliverables</p>
                    <p className="font-heading font-bold text-2xl">{assessment.required_deliverables?.length || 0}</p>
                  </div>
                </div>

                <div className="card">
                  <h3 className="font-heading font-bold mb-4">Risk Rationale</h3>
                  <ul className="space-y-2">
                    {assessment.rationale?.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {assessment.uncertainties?.length > 0 && (
                  <div className="card bg-amber-50 border-amber-200">
                    <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Uncertainties
                    </h3>
                    <ul className="space-y-2">
                      {assessment.uncertainties.map((u, i) => (
                        <li key={i} className="text-sm text-amber-800">• {u}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <button onClick={runRiskAssessment} disabled={loading} className="btn-secondary">
                    <RefreshCw className="w-4 h-4" /> Re-assess Risk
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "controls" && (
          <div className="space-y-4">
            {assessment?.required_controls?.length > 0 ? (
              assessment.required_controls.map((controlName, i) => (
                <div key={i} className="card flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{controlName}</h4>
                  </div>
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs">Required</span>
                </div>
              ))
            ) : (
              <div className="card text-center py-12 text-slate-500">
                Run a risk assessment to see required controls.
              </div>
            )}
          </div>
        )}

        {activeTab === "deliverables" && (
          <div className="space-y-4">
            {assessment && deliverables.length === 0 && (
              <div className="card bg-blue-50 border-blue-200 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Generate Deliverables</h4>
                  <p className="text-sm text-blue-700">Based on risk assessment, {assessment.required_deliverables?.length || 0} deliverables are required.</p>
                </div>
                <button
                  onClick={generateDeliverables}
                  disabled={loading}
                  className="btn-primary"
                  data-testid="generate-deliverables-btn"
                >
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            )}

            {deliverables.map((d, i) => (
              <div key={i} className="card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs text-slate-400">{d.id}</span>
                    <h4 className="font-medium">{d.title}</h4>
                  </div>
                  <span className={`px-2 py-1 text-xs ${d.status === 'final' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    {d.status}
                  </span>
                </div>
                <pre className="text-xs bg-slate-50 p-4 overflow-x-auto max-h-48 text-slate-600">
                  {d.content?.substring(0, 500)}...
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Main CompassAI App
const CompassAIApp = () => {
  const [view, setView] = useState("dashboard"); // dashboard, list, detail
  const [stats, setStats] = useState({
    total_usecases: 0,
    pending_approvals: 0,
    controls_count: 0,
    policies_count: 0,
    by_status: {},
    by_risk_tier: {}
  });
  const [usecases, setUsecases] = useState([]);
  const [selectedUsecase, setSelectedUsecase] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usecasesRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/usecases`)
      ]);
      setStats(statsRes.data);
      setUsecases(usecasesRes.data);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUsecaseCreated = (newUsecase) => {
    setUsecases(prev => [newUsecase, ...prev]);
    setShowWizard(false);
    setSelectedUsecase(newUsecase);
    setView("detail");
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Loading CompassAI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="compassai-app">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-violet-900 flex items-center justify-center">
            <Compass className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">CompassAI</h1>
            <p className="text-slate-500 text-sm">AI Governance Engine</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => { setView("dashboard"); setSelectedUsecase(null); }}
            className={`px-4 py-2 text-sm font-medium ${view === "dashboard" ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setView("list"); setSelectedUsecase(null); }}
            className={`px-4 py-2 text-sm font-medium ${view === "list" ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Use Cases
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "dashboard" && (
        <Dashboard stats={stats} onRefresh={fetchData} />
      )}

      {view === "list" && !selectedUsecase && (
        <UseCaseList
          usecases={usecases}
          onSelect={(uc) => { setSelectedUsecase(uc); setView("detail"); }}
          onNew={() => setShowWizard(true)}
        />
      )}

      {view === "detail" && selectedUsecase && (
        <UseCaseDetail
          usecase={selectedUsecase}
          onBack={() => { setSelectedUsecase(null); setView("list"); }}
          onUpdate={fetchData}
        />
      )}

      {/* New Use Case Wizard */}
      <AnimatePresence>
        {showWizard && (
          <NewUseCaseWizard
            onClose={() => setShowWizard(false)}
            onCreated={handleUsecaseCreated}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompassAIApp;
