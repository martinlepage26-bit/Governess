import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Activity,
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Download,
  Search,
  Filter,
  RefreshCw,
  X,
  ChevronRight,
  Clock,
  FileCheck,
  FileWarning,
  Layers,
  Settings
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api/aurora`;

// Status colors
const STATUS_COLORS = {
  uploaded: "bg-slate-100 text-slate-600",
  reading: "bg-blue-100 text-blue-700",
  classified: "bg-indigo-100 text-indigo-700",
  extracted: "bg-emerald-100 text-emerald-700",
  needs_review: "bg-amber-100 text-amber-700",
  validated: "bg-green-100 text-green-700",
  exported: "bg-slate-200 text-slate-600",
  archived: "bg-slate-300 text-slate-500",
  failed: "bg-red-100 text-red-700"
};

const CATEGORY_COLORS = {
  financial: "bg-emerald-100 text-emerald-700",
  legal: "bg-violet-100 text-violet-700",
  hr: "bg-blue-100 text-blue-700",
  operations: "bg-orange-100 text-orange-700",
  compliance: "bg-red-100 text-red-700",
  other: "bg-slate-100 text-slate-600"
};

// Dashboard
const Dashboard = ({ stats, onRefresh }) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="font-heading font-bold text-2xl">Document Processing Dashboard</h2>
      <button onClick={onRefresh} className="btn-secondary text-xs py-2 px-4">
        <RefreshCw className="w-4 h-4" /> Refresh
      </button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card p-6">
        <p className="text-slate-500 text-sm mb-1">Total Documents</p>
        <p className="font-heading font-bold text-3xl">{stats.total_documents}</p>
      </div>
      <div className="card p-6">
        <p className="text-slate-500 text-sm mb-1">Pending Reviews</p>
        <p className="font-heading font-bold text-3xl text-amber-600">{stats.pending_reviews}</p>
      </div>
      <div className="card p-6">
        <p className="text-slate-500 text-sm mb-1">Schemas</p>
        <p className="font-heading font-bold text-3xl">{stats.schemas_count}</p>
      </div>
      <div className="card p-6">
        <p className="text-slate-500 text-sm mb-1">Pipeline</p>
        <p className="font-heading font-bold text-lg text-violet-900">{stats.pipeline_version}</p>
      </div>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="font-heading font-bold text-lg mb-4">By Status</h3>
        <div className="space-y-3">
          {Object.entries(stats.by_status || {}).filter(([_, count]) => count > 0).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs ${STATUS_COLORS[status] || 'bg-slate-100'}`}>
                {status.replace(/_/g, ' ')}
              </span>
              <span className="font-mono font-bold">{count}</span>
            </div>
          ))}
          {Object.values(stats.by_status || {}).every(v => v === 0) && (
            <p className="text-slate-400 text-sm">No documents yet</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="font-heading font-bold text-lg mb-4">By Category</h3>
        <div className="space-y-3">
          {Object.entries(stats.by_category || {}).filter(([_, count]) => count > 0).map(([cat, count]) => (
            <div key={cat} className="flex items-center justify-between">
              <span className={`px-2 py-1 text-xs ${CATEGORY_COLORS[cat] || 'bg-slate-100'}`}>
                {cat}
              </span>
              <span className="font-mono font-bold">{count}</span>
            </div>
          ))}
          {Object.values(stats.by_category || {}).every(v => v === 0) && (
            <p className="text-slate-400 text-sm">No categorized documents</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

// Upload Component
const UploadZone = ({ onUpload, uploading }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files[0]);
  }, [onUpload]);

  const handleChange = (e) => {
    if (e.target.files?.length > 0) onUpload(e.target.files[0]);
  };

  return (
    <div
      className={`border-2 border-dashed p-12 text-center transition-colors ${
        dragOver ? 'border-violet-500 bg-violet-50' : 'border-slate-300 hover:border-slate-400'
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
      <p className="text-slate-600 mb-2">
        {uploading ? 'Uploading...' : 'Drag and drop a document here'}
      </p>
      <p className="text-slate-400 text-sm mb-4">PDF, DOC, DOCX, images supported</p>
      <label className="btn-primary cursor-pointer">
        <input
          type="file"
          className="hidden"
          onChange={handleChange}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.tiff"
          disabled={uploading}
        />
        Select File
      </label>
    </div>
  );
};

// Document List
const DocumentList = ({ documents, onSelect }) => {
  const [filter, setFilter] = useState("");

  const filtered = documents.filter(doc =>
    doc.filename.toLowerCase().includes(filter.toLowerCase()) ||
    doc.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search documents..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field pl-10"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-12 text-slate-500">
            No documents found. Upload your first document to get started.
          </div>
        ) : (
          filtered.map(doc => (
            <motion.div
              key={doc.id}
              className="card cursor-pointer hover:border-violet-300 transition-colors"
              onClick={() => onSelect(doc)}
              whileHover={{ y: -2 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {doc.status === 'needs_review' ? (
                    <FileWarning className="w-5 h-5 text-amber-600" />
                  ) : doc.status === 'validated' || doc.status === 'exported' ? (
                    <FileCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-slate-400">{doc.id}</span>
                    <span className={`px-2 py-0.5 text-xs ${STATUS_COLORS[doc.status]}`}>
                      {doc.status.replace(/_/g, ' ')}
                    </span>
                    {doc.classification && (
                      <span className={`px-2 py-0.5 text-xs ${CATEGORY_COLORS[doc.classification.category]}`}>
                        {doc.classification.document_type}
                      </span>
                    )}
                  </div>
                  <h3 className="font-medium truncate">{doc.filename}</h3>
                  <p className="text-xs text-slate-400">
                    {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

// Document Detail
const DocumentDetail = ({ document, onBack, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [audit, setAudit] = useState([]);

  useEffect(() => {
    fetchAudit();
  }, [document.id]);

  const fetchAudit = async () => {
    try {
      const res = await axios.get(`${API}/audit/${document.id}`);
      setAudit(res.data);
    } catch (e) {
      console.error("Failed to fetch audit", e);
    }
  };

  const runClassification = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/documents/${document.id}/classify`);
      onUpdate();
    } catch (e) {
      console.error("Classification failed", e);
    } finally {
      setLoading(false);
    }
  };

  const runExtraction = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/documents/${document.id}/extract`);
      onUpdate();
    } catch (e) {
      console.error("Extraction failed", e);
    } finally {
      setLoading(false);
    }
  };

  const exportDocument = async () => {
    try {
      const res = await axios.get(`${API}/documents/${document.id}/export`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${document.id}.json`;
      a.click();
      onUpdate();
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const generateEvidencePack = async () => {
    try {
      const res = await axios.get(`${API}/documents/${document.id}/evidence-pack`);
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evidence-pack-${document.id}.json`;
      a.click();
    } catch (e) {
      console.error("Evidence pack generation failed", e);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: Eye },
    { id: "extraction", label: "Extraction", icon: Layers },
    { id: "audit", label: "Audit Trail", icon: Clock }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="btn-secondary py-2 px-4">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-slate-400">{document.id}</span>
            <span className={`px-2 py-0.5 text-xs ${STATUS_COLORS[document.status]}`}>
              {document.status.replace(/_/g, ' ')}
            </span>
          </div>
          <h2 className="font-heading font-bold text-xl truncate">{document.filename}</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={generateEvidencePack} className="btn-secondary py-2 px-4">
            <FileText className="w-4 h-4" /> Evidence Pack
          </button>
          <button onClick={exportDocument} className="btn-primary py-2 px-4">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Action buttons based on status */}
      {document.status === 'uploaded' && (
        <div className="card bg-blue-50 border-blue-200 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">Ready for Classification</h4>
            <p className="text-sm text-blue-700">Run classification to identify document type</p>
          </div>
          <button onClick={runClassification} disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Classify Document'}
          </button>
        </div>
      )}

      {document.status === 'classified' && (
        <div className="card bg-indigo-50 border-indigo-200 flex items-center justify-between">
          <div>
            <h4 className="font-medium text-indigo-900">Ready for Extraction</h4>
            <p className="text-sm text-indigo-700">Extract structured fields from document</p>
          </div>
          <button onClick={runExtraction} disabled={loading} className="btn-primary">
            {loading ? 'Processing...' : 'Extract Fields'}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="font-heading font-bold mb-4">Document Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Filename</dt>
                  <dd className="font-medium truncate max-w-xs">{document.filename}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Size</dt>
                  <dd>{(document.file_size / 1024).toFixed(1)} KB</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">MIME Type</dt>
                  <dd className="font-mono text-xs">{document.mime_type}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Hash</dt>
                  <dd className="font-mono text-xs truncate max-w-xs">{document.file_hash?.substring(0, 16)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Uploaded</dt>
                  <dd>{new Date(document.created_at).toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            {document.classification && (
              <div className="card">
                <h3 className="font-heading font-bold mb-4">Classification</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <dt className="text-slate-500">Category</dt>
                    <dd className={`px-2 py-1 text-xs ${CATEGORY_COLORS[document.classification.category]}`}>
                      {document.classification.category}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-slate-500">Document Type</dt>
                    <dd className="font-medium">{document.classification.document_type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Confidence</dt>
                    <dd className="font-mono">{(document.classification.confidence * 100).toFixed(1)}%</dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}

        {activeTab === "extraction" && (
          <div className="space-y-4">
            {document.extraction ? (
              <>
                <div className="card bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-bold">Extraction Results</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Schema:</span>
                      <span className="font-mono text-sm">{document.extraction.schema_id}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Overall Confidence:</span>
                      <span className={`font-mono font-bold ${
                        document.extraction.overall_confidence >= 0.85 ? 'text-emerald-600' :
                        document.extraction.overall_confidence >= 0.7 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {(document.extraction.overall_confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(document.extraction.fields || {}).map(([fieldName, field]) => (
                    <div key={fieldName} className="card">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium capitalize">{fieldName.replace(/_/g, ' ')}</h4>
                          <p className="text-lg font-mono mt-1">
                            {typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-mono ${
                            field.confidence >= 0.9 ? 'bg-emerald-100 text-emerald-700' :
                            field.confidence >= 0.8 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {(field.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      {field.evidence && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            Page {field.evidence.page} • "{field.evidence.snippet}"
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {document.extraction.missing_or_ambiguous?.length > 0 && (
                  <div className="card bg-amber-50 border-amber-200">
                    <h4 className="font-medium text-amber-900 mb-2">Missing or Ambiguous Fields</h4>
                    <div className="flex flex-wrap gap-2">
                      {document.extraction.missing_or_ambiguous.map((field, i) => (
                        <span key={i} className="px-2 py-1 bg-amber-100 text-amber-800 text-sm">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card text-center py-12 text-slate-500">
                No extraction results yet. Classify and extract the document to see results.
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-3">
            {audit.length === 0 ? (
              <div className="card text-center py-12 text-slate-500">
                No audit events recorded yet.
              </div>
            ) : (
              audit.map((event, i) => (
                <div key={i} className="card flex items-start gap-4">
                  <div className="w-10 h-10 bg-slate-100 flex items-center justify-center flex-shrink-0 rounded-full">
                    {event.event_type === 'uploaded' && <Upload className="w-5 h-5 text-slate-600" />}
                    {event.event_type === 'classified' && <FileText className="w-5 h-5 text-indigo-600" />}
                    {event.event_type === 'extracted' && <Layers className="w-5 h-5 text-emerald-600" />}
                    {event.event_type === 'reviewed' && <CheckCircle className="w-5 h-5 text-blue-600" />}
                    {event.event_type === 'exported' && <Download className="w-5 h-5 text-slate-600" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium capitalize">{event.event_type}</span>
                      <span className="text-xs text-slate-400">by {event.actor}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <pre className="mt-2 text-xs bg-slate-50 p-2 overflow-x-auto">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Main AurorAI App
const AurorAIApp = () => {
  const [view, setView] = useState("dashboard");
  const [stats, setStats] = useState({
    total_documents: 0,
    pending_reviews: 0,
    schemas_count: 0,
    pipeline_version: "IDP-v0.1",
    by_status: {},
    by_category: {}
  });
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, docsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/documents`)
      ]);
      setStats(statsRes.data);
      setDocuments(docsRes.data);
    } catch (e) {
      console.error("Failed to fetch data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API}/documents/upload`, formData);
      fetchData();
      // Auto-select the new document
      const newDoc = await axios.get(`${API}/documents/${res.data.document_id}`);
      setSelectedDoc(newDoc.data);
      setView("detail");
    } catch (e) {
      console.error("Upload failed", e);
    } finally {
      setUploading(false);
    }
  };

  const handleDocUpdate = async () => {
    if (selectedDoc) {
      const res = await axios.get(`${API}/documents/${selectedDoc.id}`);
      setSelectedDoc(res.data);
    }
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-slate-500">Loading AurorAI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="auroraai-app">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-900 flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-2xl">AurorAI</h1>
            <p className="text-slate-500 text-sm">Intelligent Document Processing</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => { setView("dashboard"); setSelectedDoc(null); }}
            className={`px-4 py-2 text-sm font-medium ${view === "dashboard" ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => { setView("upload"); setSelectedDoc(null); }}
            className={`px-4 py-2 text-sm font-medium ${view === "upload" ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Upload
          </button>
          <button
            onClick={() => { setView("library"); setSelectedDoc(null); }}
            className={`px-4 py-2 text-sm font-medium ${view === "library" ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
          >
            Library
          </button>
        </div>
      </div>

      {/* Content */}
      {view === "dashboard" && (
        <Dashboard stats={stats} onRefresh={fetchData} />
      )}

      {view === "upload" && (
        <div className="space-y-6">
          <UploadZone onUpload={handleUpload} uploading={uploading} />
          {documents.length > 0 && (
            <>
              <h3 className="font-heading font-bold text-lg">Recent Documents</h3>
              <DocumentList
                documents={documents.slice(0, 5)}
                onSelect={(doc) => { setSelectedDoc(doc); setView("detail"); }}
              />
            </>
          )}
        </div>
      )}

      {view === "library" && !selectedDoc && (
        <DocumentList
          documents={documents}
          onSelect={(doc) => { setSelectedDoc(doc); setView("detail"); }}
        />
      )}

      {view === "detail" && selectedDoc && (
        <DocumentDetail
          document={selectedDoc}
          onBack={() => { setSelectedDoc(null); setView("library"); }}
          onUpdate={handleDocUpdate}
        />
      )}
    </div>
  );
};

export default AurorAIApp;
