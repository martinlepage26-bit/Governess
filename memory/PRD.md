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
- [x] **Homepage** - Hero, value proposition, services preview, updated agentic governance section
- [x] **About** - NEW - Full bio with your professional copy, connect sidebar, frameworks links
- [x] **Services** - 8 services grid + AurorAI/CompassAI detail sections with "Try CompassAI" CTA
- [x] **Portfolio** - Mock case studies (Financial Services, Healthcare, E-commerce)
- [x] **Publications** - Research papers/articles with LinkedIn links
- [x] **Assessment Tool** - 8-question AI governance assessment with GPT-powered analysis
- [x] **Contact** - Email form (Resend) + Calendly booking widget

### CompassAI Governance Engine (NEW)
- [x] **Dashboard** - Stats overview (use cases, tiers, approvals, controls, policies)
- [x] **Use Case Registry** - CRUD with status tracking (draft → approved)
- [x] **Risk Engine** - T0-T3 tier calculation based on data sensitivity, automation level, regulated domain
- [x] **Control Catalog** - 12 pre-defined controls (RBAC, Audit Trail, HITL, PII Masking, etc.)
- [x] **Policy Engine** - 3 declarative policies for PII/regulated/automated systems
- [x] **Deliverable Generator** - System Cards, Risk Assessments auto-generated
- [x] **Audit Export** - JSON bundle with evidence index, decisions, signatures

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
- [ ] **AurorAI Integration** - Pull in AurorAI execution engine
- [ ] Admin dashboard for managing publications/case studies
- [ ] Evidence ingestion API for AurorAI → CompassAI flow
- [ ] Approval workflow with digital signatures
- [ ] Monitoring engine for drift/violations

## P2 Backlog
- [ ] Dark mode toggle
- [ ] Multi-language support (EN/FR)
- [ ] Jira/ServiceNow integration for gap tickets
- [ ] Executive dashboards

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
