# Govern-AI Landing Page PRD

## Project Overview
**Client:** Martin Lepage, PhD  
**Domain:** AI Governance Consulting  
**Created:** March 2026
**Last Updated:** March 2026

## Brand Identity
- **Mission:** AI governance as decision machinery, not observability theater
- **Visual Style:** Light/airy base with dark purple (#581C87), navy (#0F172A), black accents
- **Typography:** Chivo (headings), Inter (body), JetBrains Mono (data)
- **Logos:** ML monogram (nav), Needle/Compass (hero, with transparent bg)

## Core User Personas
1. **CTOs/Tech Leaders** - Need defensible AI systems before shipping
2. **Compliance Officers** - Need audit-grade evidence trails
3. **AI/ML Team Leads** - Need practical governance without bureaucracy

## Implemented Features (MVP - March 2026)

### Landing Page
- [x] **Homepage** - Hero with lavender translucent circle behind logo, royal blue accents
- [x] **About** - Full bio with professional copy, connect sidebar, frameworks links
- [x] **Services** - 8 services grid + AurorAI/CompassAI detail sections
- [x] **Portfolio** - 5 real case studies (LLM Governance, Clinical Trials, Procurement, Underwriting, Incident Response)
- [x] **Publications/Blog** - Full blog with CRUD, tag filtering, full article view (NEW - March 2026)
- [x] **Assessment Tool** - 8-question AI governance assessment with GPT-powered analysis
- [x] **Contact** - Email form (Resend) + Calendly booking widget

### Publications/Blog Section (NEW - March 2026)
- [x] **Publication List** - Display articles with date, title, abstract, and tags
- [x] **Tag Filtering** - Filter publications by clicking tags
- [x] **Full Article View** - Click to read full content with markdown rendering
- [x] **Admin CRUD** - Admin can create, edit, delete publications
- [x] **Seed Data** - 3 pre-written articles with full content (Decision Machinery, Agentic Governance, Evidence Artifacts)

### Authentication System
- [x] **Google OAuth** - Via Emergent Auth, professional single-sign-on
- [x] **Admin Role** - martinlepage.ai@gmail.com has full access
- [x] **Client Role** - Requires approval to access CompassAI/AurorAI
- [x] **Request Access Page** - Public form for clients to request access
- [x] **Admin Dashboard** - Approve/reject access requests, manage users
- [x] **Protected Routes** - AurorAI/CompassAI behind authentication
- [x] **Session Management** - 7-day sessions with secure cookies

### Multi-Tenancy (Completed - March 2026)
- [x] **CompassAI** - Full multi-tenant data isolation (clients only see their own use cases)
- [x] **AurorAI** - Full multi-tenant data isolation (clients only see their own documents)
- [x] **Admin Bypass** - Admin user sees all data across all tenants

### CompassAI Governance Engine
- [x] **Dashboard** - Stats overview (use cases, tiers, approvals, controls, policies)
- [x] **Use Case Registry** - CRUD with status tracking (draft → approved)
- [x] **Risk Engine** - T0-T3 tier calculation based on data sensitivity, automation level, regulated domain
- [x] **Control Catalog** - 12 pre-defined controls (RBAC, Audit Trail, HITL, PII Masking, etc.)
- [x] **Policy Engine** - 3 declarative policies for PII/regulated/automated systems
- [x] **Deliverable Generator** - System Cards, Risk Assessments auto-generated
- [x] **Audit Export** - JSON bundle with evidence index, decisions, signatures

### AurorAI IDP Engine
- [x] **Dashboard** - Document processing stats by status and category
- [x] **Document Upload** - Drag-and-drop with multi-format support (PDF, DOC, images)
- [x] **Classification** - Auto-classify documents by category (financial, legal, HR, etc.) and type
- [x] **Schema-based Extraction** - 4 schemas (Invoice, Contract, Insurance Claim, ID Card)
- [x] **Extraction Results** - Field values with confidence scores and evidence (page, snippet, bbox)
- [x] **HITL Review Queue** - Targeted validation for low-confidence extractions
- [x] **Audit Trail** - Immutable logging of all document actions
- [x] **Evidence Pack Generation** - Pipeline version, schema, fields, validation checks for CompassAI
- [x] **Library** - Searchable document repository with status filters

### Integrations
- [x] **Resend** - Contact form emails to martinlepage.ai@gmail.com
- [x] **Calendly** - Embedded booking (martinlepage-ai)
- [x] **OpenAI (GPT-5.2)** - AI analysis for assessment results via Emergent LLM key
- [x] **MongoDB** - Contact submissions, assessments, CompassAI data stored

## Technical Stack
- **Frontend:** React 19, Tailwind CSS, Framer Motion, react-calendly
- **Backend:** FastAPI, MongoDB, emergentintegrations
- **APIs:** Resend, Calendly embed, OpenAI via Emergent

## P1 Backlog (Next)
- [ ] LinkedIn API Integration - Auto-post blog articles to LinkedIn
- [ ] Evidence ingestion API for AurorAI → CompassAI flow
- [ ] Approval workflow with digital signatures
- [ ] Email notifications for access request workflow (approval/rejection emails)
- [ ] Document processing webhooks (document.uploaded, document.extracted, etc.)

## P2 Backlog
- [ ] Dynamic case study management (admin CRUD for portfolio)
- [ ] Dark mode toggle
- [ ] Multi-language support (EN/FR)
- [ ] Jira/ServiceNow integration for gap tickets
- [ ] Executive dashboards
- [ ] DMS connectors (SharePoint, Box)

## Publications API Reference
```
GET  /api/publications - List publications (optional: ?tag=X to filter)
GET  /api/publications/{id} - Get single publication with full content
GET  /api/publications/tags/all - Get all unique tags
POST /api/publications - Create publication (admin only)
PUT  /api/publications/{id} - Update publication (admin only)
DELETE /api/publications/{id} - Delete publication (admin only)
```

## AurorAI API Reference
```
POST /api/aurora/documents/upload - Upload document (multipart)
POST /api/aurora/documents/{id}/classify - Classify document
POST /api/aurora/documents/{id}/extract - Extract fields
GET  /api/aurora/documents - List documents
GET  /api/aurora/documents/{id} - Get document
GET  /api/aurora/documents/{id}/export - Export document
GET  /api/aurora/documents/{id}/evidence-pack - Generate evidence pack
GET  /api/aurora/schemas - List extraction schemas
GET  /api/aurora/reviews - List HITL review tasks
PATCH /api/aurora/reviews/{id} - Submit review corrections
GET  /api/aurora/audit/{doc_id} - Get audit log
```

## CompassAI API Reference
```
POST /api/compass/usecases - Create use case
GET  /api/compass/usecases - List use cases
GET  /api/compass/usecases/{id} - Get use case
POST /api/compass/risk/assess?usecase_id={id} - Run risk assessment
POST /api/compass/deliverables/generate/{id} - Generate deliverables
GET  /api/compass/audit/export/{id} - Export audit bundle
GET  /api/compass/controls - List controls
GET  /api/compass/policies - List policies
```

## URLs
- **LinkedIn:** https://www.linkedin.com/in/martin-lepage-ai/
- **GitHub:** https://github.com/martinlepage26-bit
- **Calendly:** https://calendly.com/martinlepage-ai
