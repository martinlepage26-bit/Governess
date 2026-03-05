"""
CompassAI - AI Governance Engine
Manages use cases, risk tiering, controls, approvals, and deliverables
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import hashlib
import json

router = APIRouter(prefix="/api/compass", tags=["CompassAI"])

# ============ ENUMS ============

class RiskTier(str, Enum):
    T0 = "T0"  # Low
    T1 = "T1"  # Moderate
    T2 = "T2"  # High
    T3 = "T3"  # Critical

class UseCaseStatus(str, Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    APPROVED_WITH_CONDITIONS = "approved_with_conditions"
    REJECTED = "rejected"
    SUSPENDED = "suspended"
    RETIRED = "retired"

class AutomationLevel(str, Enum):
    INFORMATIVE = "informative"
    ASSISTIVE = "assistive"
    AUTOMATED = "automated"

class UserRole(str, Enum):
    GOVERNANCE_ADMIN = "governance_admin"
    USECASE_OWNER = "usecase_owner"
    RISK_OWNER = "risk_owner"
    APPROVER = "approver"
    AUDITOR_READONLY = "auditor_readonly"
    VIEWER = "viewer"

# ============ MODELS ============

class Owner(BaseModel):
    name: str
    email: str
    role: Optional[str] = None

class UseCase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"UC-{datetime.now().year}-{str(uuid.uuid4())[:4].upper()}")
    purpose: str
    business_owner: Owner
    model_owner: Optional[Owner] = None
    risk_owner: Optional[Owner] = None
    systems_involved: List[str] = []
    data_categories: List[str] = []
    automation_level: AutomationLevel = AutomationLevel.ASSISTIVE
    regulated_domain: bool = False
    domain_type: Optional[str] = None
    known_unknowns: List[str] = []
    status: UseCaseStatus = UseCaseStatus.DRAFT
    risk_tier: Optional[RiskTier] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class UseCaseCreate(BaseModel):
    purpose: str
    business_owner: Owner
    model_owner: Optional[Owner] = None
    systems_involved: List[str] = []
    data_categories: List[str] = []
    automation_level: AutomationLevel = AutomationLevel.ASSISTIVE
    regulated_domain: bool = False
    domain_type: Optional[str] = None
    known_unknowns: List[str] = []

class EvidencePack(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"EV-{str(uuid.uuid4())[:8].upper()}")
    usecase_id: str
    producer: Dict[str, str]  # {system, version}
    artifact_type: str
    schema_version: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    payload: Dict[str, Any]
    hash: Optional[str] = None
    signature: Optional[str] = None

class EvidencePackCreate(BaseModel):
    usecase_id: str
    producer: Dict[str, str]
    artifact_type: str
    schema_version: str
    payload: Dict[str, Any]

class RiskAssessment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"RA-{str(uuid.uuid4())[:8].upper()}")
    usecase_id: str
    risk_tier: RiskTier
    rationale: List[str]
    uncertainties: List[str]
    triggers: List[str]
    required_controls: List[str]
    required_deliverables: List[str]
    assessed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    assessed_by: Optional[str] = None

class Control(BaseModel):
    id: str
    name: str
    category: str  # data, process, human_oversight, quality, security, transparency, monitoring, incident
    description: str
    required_for_tiers: List[RiskTier]
    testable: bool = True

class Approval(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"AP-{str(uuid.uuid4())[:8].upper()}")
    usecase_id: str
    decision: str  # approved, approved_with_conditions, rejected
    conditions: List[str] = []
    approver: Owner
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    gate: str  # intake_complete, risk_assessed, controls_satisfied, deliverables_generated, approved_for_deploy

class ApprovalCreate(BaseModel):
    usecase_id: str
    decision: str
    conditions: List[str] = []
    approver: Owner
    gate: str

class Deliverable(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"DV-{str(uuid.uuid4())[:8].upper()}")
    usecase_id: str
    type: str  # usecase_record, system_card, risk_assessment, dpia, approval_record, monitoring_plan
    title: str
    content: str
    evidence_ids: List[str] = []
    gaps: List[str] = []
    status: str = "draft"  # draft, final
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    version: int = 1

class Policy(BaseModel):
    id: str
    version: str
    name: str
    when: Dict[str, Any]
    require: Dict[str, List[str]]
    active: bool = True

# ============ CONTROL CATALOG ============

CONTROL_CATALOG = [
    Control(id="CTL-001", name="RBAC", category="security", description="Role-based access control with least privilege", required_for_tiers=[RiskTier.T0, RiskTier.T1, RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-002", name="AuditTrail", category="security", description="Immutable audit trail for all actions", required_for_tiers=[RiskTier.T0, RiskTier.T1, RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-003", name="HITL_LowConfidence", category="human_oversight", description="Human-in-the-loop for low confidence decisions", required_for_tiers=[RiskTier.T1, RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-004", name="PII_Masking", category="data", description="PII masked in UI based on role", required_for_tiers=[RiskTier.T1, RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-005", name="DataMinimization", category="data", description="Store structured evidence, avoid raw documents", required_for_tiers=[RiskTier.T1, RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-006", name="DeploymentGates", category="process", description="Mandatory gates before production deployment", required_for_tiers=[RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-007", name="ChangeControl", category="process", description="Formal change control for model/pipeline updates", required_for_tiers=[RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-008", name="RedTeaming", category="quality", description="Independent adversarial testing", required_for_tiers=[RiskTier.T3]),
    Control(id="CTL-009", name="IncidentPlaybook", category="incident", description="Documented incident response procedures", required_for_tiers=[RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-010", name="DriftMonitoring", category="monitoring", description="Statistical drift detection on inputs/outputs", required_for_tiers=[RiskTier.T2, RiskTier.T3]),
    Control(id="CTL-011", name="DualValidation", category="human_oversight", description="Two-person validation for critical decisions", required_for_tiers=[RiskTier.T3]),
    Control(id="CTL-012", name="Encryption", category="security", description="Encryption at rest and in transit", required_for_tiers=[RiskTier.T1, RiskTier.T2, RiskTier.T3]),
]

# ============ POLICY CATALOG ============

POLICY_CATALOG = [
    Policy(
        id="POL-PII-T2-001",
        version="1.0",
        name="PII Data High Risk Policy",
        when={
            "risk_tier_in": ["T2", "T3"],
            "data_categories_any": ["PII", "PHI"],
            "automation_level_in": ["assistive", "automated"]
        },
        require={
            "controls": ["RBAC", "AuditTrail", "HITL_LowConfidence", "PII_Masking"],
            "deliverables": ["risk_assessment", "dpia", "monitoring_plan"],
            "gates": ["risk_assessed", "controls_satisfied", "approved_for_deploy"]
        }
    ),
    Policy(
        id="POL-REG-T2-001",
        version="1.0",
        name="Regulated Domain Policy",
        when={
            "risk_tier_in": ["T2", "T3"],
            "regulated_domain": True
        },
        require={
            "controls": ["RBAC", "AuditTrail", "DeploymentGates", "ChangeControl", "IncidentPlaybook"],
            "deliverables": ["risk_assessment", "system_card", "monitoring_plan", "approval_record"],
            "gates": ["risk_assessed", "controls_satisfied", "deliverables_generated", "approved_for_deploy"]
        }
    ),
    Policy(
        id="POL-AUTO-T3-001",
        version="1.0",
        name="Automated Decision Critical Policy",
        when={
            "risk_tier_in": ["T3"],
            "automation_level_in": ["automated"]
        },
        require={
            "controls": ["RBAC", "AuditTrail", "HITL_LowConfidence", "RedTeaming", "DualValidation", "IncidentPlaybook"],
            "deliverables": ["risk_assessment", "dpia", "system_card", "monitoring_plan", "approval_record"],
            "gates": ["intake_complete", "risk_assessed", "controls_satisfied", "deliverables_generated", "approved_for_deploy"]
        }
    )
]

# ============ RISK ENGINE ============

def calculate_risk_tier(usecase: UseCase, evidence_count: int = 0) -> RiskAssessment:
    """Calculate risk tier based on use case attributes"""
    score = 0
    rationale = []
    uncertainties = []
    triggers = []
    
    # Data Sensitivity scoring
    sensitive_data = ["PII", "PHI", "Financial", "Biometrics", "Child Data"]
    found_sensitive = [d for d in usecase.data_categories if d in sensitive_data]
    if found_sensitive:
        score += len(found_sensitive) * 15
        rationale.append(f"Sensitive data categories: {', '.join(found_sensitive)}")
    
    # Automation level scoring
    if usecase.automation_level == AutomationLevel.AUTOMATED:
        score += 30
        rationale.append("Fully automated decision-making increases risk")
    elif usecase.automation_level == AutomationLevel.ASSISTIVE:
        score += 15
        rationale.append("Assistive automation with human oversight")
    
    # Regulated domain scoring
    if usecase.regulated_domain:
        score += 25
        rationale.append(f"Operates in regulated domain: {usecase.domain_type or 'unspecified'}")
        triggers.append("Regulatory change in domain")
    
    # Known unknowns add uncertainty
    if usecase.known_unknowns:
        uncertainties.extend(usecase.known_unknowns)
        score += len(usecase.known_unknowns) * 5
        rationale.append(f"{len(usecase.known_unknowns)} known unknowns increase uncertainty")
    
    # Evidence availability affects confidence
    if evidence_count == 0:
        uncertainties.append("No evidence packs ingested - assessment based on intake only")
        score += 10  # Conservative scoring when evidence lacking
    
    # Determine tier
    if score >= 70:
        risk_tier = RiskTier.T3
    elif score >= 45:
        risk_tier = RiskTier.T2
    elif score >= 20:
        risk_tier = RiskTier.T1
    else:
        risk_tier = RiskTier.T0
    
    # Determine required controls based on tier
    required_controls = [c.name for c in CONTROL_CATALOG if risk_tier in c.required_for_tiers]
    
    # Determine required deliverables
    deliverable_map = {
        RiskTier.T0: ["usecase_record"],
        RiskTier.T1: ["usecase_record", "system_card", "monitoring_plan"],
        RiskTier.T2: ["usecase_record", "system_card", "risk_assessment", "monitoring_plan"],
        RiskTier.T3: ["usecase_record", "system_card", "risk_assessment", "dpia", "monitoring_plan", "approval_record"]
    }
    required_deliverables = deliverable_map.get(risk_tier, [])
    
    # Add triggers for re-tiering
    triggers.extend([
        "Change in automation level",
        "New data categories added",
        "Deployment to new region",
        "Model/pipeline version change"
    ])
    
    return RiskAssessment(
        usecase_id=usecase.id,
        risk_tier=risk_tier,
        rationale=rationale,
        uncertainties=uncertainties,
        triggers=triggers,
        required_controls=required_controls,
        required_deliverables=required_deliverables
    )

# ============ DELIVERABLE GENERATOR ============

def generate_system_card(usecase: UseCase, assessment: RiskAssessment) -> str:
    """Generate a system/model card in Markdown"""
    return f"""# System Card: {usecase.purpose[:50]}

## Overview
- **Use Case ID**: {usecase.id}
- **Status**: {usecase.status.value}
- **Risk Tier**: {assessment.risk_tier.value}

## Purpose
{usecase.purpose}

## Owners
- **Business Owner**: {usecase.business_owner.name} ({usecase.business_owner.email})
- **Model Owner**: {usecase.model_owner.name if usecase.model_owner else 'Not assigned'}
- **Risk Owner**: {usecase.risk_owner.name if usecase.risk_owner else 'Not assigned'}

## Systems Involved
{chr(10).join(['- ' + s for s in usecase.systems_involved]) or '- None specified'}

## Data Categories
{chr(10).join(['- ' + d for d in usecase.data_categories]) or '- None specified'}

## Automation Level
{usecase.automation_level.value.title()}

## Regulated Domain
{'Yes - ' + (usecase.domain_type or 'Type not specified') if usecase.regulated_domain else 'No'}

## Risk Assessment
- **Tier**: {assessment.risk_tier.value}
- **Rationale**: {'; '.join(assessment.rationale)}

## Required Controls
{chr(10).join(['- ' + c for c in assessment.required_controls])}

## Known Limitations & Uncertainties
{chr(10).join(['- ' + u for u in assessment.uncertainties]) or '- None identified'}

---
*Generated by CompassAI on {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}*
"""

def generate_risk_assessment_doc(usecase: UseCase, assessment: RiskAssessment) -> str:
    """Generate risk assessment document"""
    return f"""# Risk Assessment: {usecase.id}

## Use Case
**{usecase.purpose}**

## Assessment Summary
| Attribute | Value |
|-----------|-------|
| Risk Tier | {assessment.risk_tier.value} |
| Assessed At | {assessment.assessed_at} |

## Risk Rationale
{chr(10).join(['1. ' + r for i, r in enumerate(assessment.rationale)])}

## Uncertainties
{chr(10).join(['- ' + u for u in assessment.uncertainties]) or 'None identified'}

## Re-tiering Triggers
The following events would trigger a risk re-assessment:
{chr(10).join(['- ' + t for t in assessment.triggers])}

## Required Controls
| Control | Category |
|---------|----------|
{chr(10).join(['| ' + c.name + ' | ' + c.category + ' |' for c in CONTROL_CATALOG if c.name in assessment.required_controls])}

## Required Deliverables
{chr(10).join(['- ' + d.replace('_', ' ').title() for d in assessment.required_deliverables])}

---
*Generated by CompassAI Risk Engine*
"""

# ============ IN-MEMORY STORAGE (replace with MongoDB in production) ============
# Using the main db from server.py

def get_db():
    from server import db
    return db

# ============ API ENDPOINTS ============

@router.get("/health")
async def compass_health():
    return {"status": "operational", "service": "CompassAI", "version": "0.1"}

# Use Cases
@router.post("/usecases", response_model=UseCase)
async def create_usecase(data: UseCaseCreate):
    db = get_db()
    usecase = UseCase(**data.model_dump())
    doc = usecase.model_dump()
    await db.compass_usecases.insert_one(doc)
    return usecase

@router.get("/usecases", response_model=List[UseCase])
async def list_usecases(
    status: Optional[UseCaseStatus] = None,
    risk_tier: Optional[RiskTier] = None,
    limit: int = 100
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status.value
    if risk_tier:
        query["risk_tier"] = risk_tier.value
    
    usecases = await db.compass_usecases.find(query, {"_id": 0}).to_list(limit)
    return usecases

@router.get("/usecases/{usecase_id}", response_model=UseCase)
async def get_usecase(usecase_id: str):
    db = get_db()
    usecase = await db.compass_usecases.find_one({"id": usecase_id}, {"_id": 0})
    if not usecase:
        raise HTTPException(status_code=404, detail="Use case not found")
    return usecase

@router.patch("/usecases/{usecase_id}")
async def update_usecase(usecase_id: str, updates: Dict[str, Any]):
    db = get_db()
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.compass_usecases.update_one(
        {"id": usecase_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Use case not found")
    return {"status": "updated", "usecase_id": usecase_id}

# Evidence
@router.post("/evidence", response_model=EvidencePack)
async def ingest_evidence(data: EvidencePackCreate):
    db = get_db()
    
    # Verify use case exists
    usecase = await db.compass_usecases.find_one({"id": data.usecase_id})
    if not usecase:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    # Create evidence pack with hash
    evidence = EvidencePack(**data.model_dump())
    payload_str = json.dumps(data.payload, sort_keys=True)
    evidence.hash = f"sha256:{hashlib.sha256(payload_str.encode()).hexdigest()}"
    
    doc = evidence.model_dump()
    await db.compass_evidence.insert_one(doc)
    return evidence

@router.get("/evidence", response_model=List[EvidencePack])
async def list_evidence(usecase_id: Optional[str] = None, artifact_type: Optional[str] = None):
    db = get_db()
    query = {}
    if usecase_id:
        query["usecase_id"] = usecase_id
    if artifact_type:
        query["artifact_type"] = artifact_type
    
    evidence = await db.compass_evidence.find(query, {"_id": 0}).to_list(500)
    return evidence

# Risk Assessment
@router.post("/risk/assess", response_model=RiskAssessment)
async def assess_risk(usecase_id: str, context: Optional[Dict[str, str]] = None):
    db = get_db()
    
    # Get use case
    usecase_doc = await db.compass_usecases.find_one({"id": usecase_id}, {"_id": 0})
    if not usecase_doc:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    usecase = UseCase(**usecase_doc)
    
    # Count evidence
    evidence_count = await db.compass_evidence.count_documents({"usecase_id": usecase_id})
    
    # Calculate risk
    assessment = calculate_risk_tier(usecase, evidence_count)
    
    # Save assessment
    doc = assessment.model_dump()
    await db.compass_risk_assessments.insert_one(doc)
    
    # Update use case with risk tier
    await db.compass_usecases.update_one(
        {"id": usecase_id},
        {"$set": {"risk_tier": assessment.risk_tier.value, "status": UseCaseStatus.IN_REVIEW.value}}
    )
    
    return assessment

@router.get("/risk/assessments/{usecase_id}", response_model=List[RiskAssessment])
async def get_risk_assessments(usecase_id: str):
    db = get_db()
    assessments = await db.compass_risk_assessments.find(
        {"usecase_id": usecase_id}, 
        {"_id": 0}
    ).sort("assessed_at", -1).to_list(100)
    return assessments

# Controls
@router.get("/controls", response_model=List[Control])
async def list_controls(tier: Optional[RiskTier] = None):
    if tier:
        return [c for c in CONTROL_CATALOG if tier in c.required_for_tiers]
    return CONTROL_CATALOG

# Policies
@router.get("/policies", response_model=List[Policy])
async def list_policies(active_only: bool = True):
    if active_only:
        return [p for p in POLICY_CATALOG if p.active]
    return POLICY_CATALOG

# Approvals
@router.post("/approvals", response_model=Approval)
async def create_approval(data: ApprovalCreate):
    db = get_db()
    
    # Verify use case
    usecase = await db.compass_usecases.find_one({"id": data.usecase_id})
    if not usecase:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    approval = Approval(**data.model_dump())
    doc = approval.model_dump()
    await db.compass_approvals.insert_one(doc)
    
    # Update use case status based on decision
    new_status = {
        "approved": UseCaseStatus.APPROVED.value,
        "approved_with_conditions": UseCaseStatus.APPROVED_WITH_CONDITIONS.value,
        "rejected": UseCaseStatus.REJECTED.value
    }.get(data.decision, usecase.get("status"))
    
    await db.compass_usecases.update_one(
        {"id": data.usecase_id},
        {"$set": {"status": new_status}}
    )
    
    return approval

@router.get("/approvals", response_model=List[Approval])
async def list_approvals(usecase_id: Optional[str] = None):
    db = get_db()
    query = {}
    if usecase_id:
        query["usecase_id"] = usecase_id
    approvals = await db.compass_approvals.find(query, {"_id": 0}).to_list(500)
    return approvals

# Deliverables
@router.post("/deliverables/generate/{usecase_id}")
async def generate_deliverables(usecase_id: str, deliverable_types: Optional[List[str]] = None):
    db = get_db()
    
    # Get use case
    usecase_doc = await db.compass_usecases.find_one({"id": usecase_id}, {"_id": 0})
    if not usecase_doc:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    usecase = UseCase(**usecase_doc)
    
    # Get latest risk assessment
    assessment_doc = await db.compass_risk_assessments.find_one(
        {"usecase_id": usecase_id},
        {"_id": 0},
        sort=[("assessed_at", -1)]
    )
    
    if not assessment_doc:
        raise HTTPException(status_code=400, detail="Risk assessment required before generating deliverables")
    
    assessment = RiskAssessment(**assessment_doc)
    
    # Determine which deliverables to generate
    types_to_generate = deliverable_types or assessment.required_deliverables
    
    generated = []
    for dtype in types_to_generate:
        content = ""
        title = ""
        
        if dtype == "system_card":
            title = f"System Card - {usecase.id}"
            content = generate_system_card(usecase, assessment)
        elif dtype == "risk_assessment":
            title = f"Risk Assessment - {usecase.id}"
            content = generate_risk_assessment_doc(usecase, assessment)
        elif dtype == "usecase_record":
            title = f"Use Case Record - {usecase.id}"
            content = f"# Use Case Record\n\n**ID**: {usecase.id}\n**Purpose**: {usecase.purpose}\n**Status**: {usecase.status.value}"
        else:
            title = f"{dtype.replace('_', ' ').title()} - {usecase.id}"
            content = f"# {title}\n\n*Template for {dtype} - to be completed*"
        
        deliverable = Deliverable(
            usecase_id=usecase_id,
            type=dtype,
            title=title,
            content=content,
            gaps=[],
            status="draft"
        )
        
        doc = deliverable.model_dump()
        await db.compass_deliverables.insert_one(doc)
        generated.append(deliverable)
    
    return {"generated": len(generated), "deliverables": generated}

@router.get("/deliverables", response_model=List[Deliverable])
async def list_deliverables(usecase_id: Optional[str] = None, dtype: Optional[str] = None):
    db = get_db()
    query = {}
    if usecase_id:
        query["usecase_id"] = usecase_id
    if dtype:
        query["type"] = dtype
    deliverables = await db.compass_deliverables.find(query, {"_id": 0}).to_list(500)
    return deliverables

@router.get("/deliverables/{deliverable_id}")
async def get_deliverable(deliverable_id: str):
    db = get_db()
    deliverable = await db.compass_deliverables.find_one({"id": deliverable_id}, {"_id": 0})
    if not deliverable:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return deliverable

# Audit Export
@router.get("/audit/export/{usecase_id}")
async def export_audit_bundle(usecase_id: str):
    db = get_db()
    
    # Gather all data for audit
    usecase = await db.compass_usecases.find_one({"id": usecase_id}, {"_id": 0})
    if not usecase:
        raise HTTPException(status_code=404, detail="Use case not found")
    
    evidence = await db.compass_evidence.find({"usecase_id": usecase_id}, {"_id": 0}).to_list(1000)
    assessments = await db.compass_risk_assessments.find({"usecase_id": usecase_id}, {"_id": 0}).to_list(100)
    approvals = await db.compass_approvals.find({"usecase_id": usecase_id}, {"_id": 0}).to_list(100)
    deliverables = await db.compass_deliverables.find({"usecase_id": usecase_id}, {"_id": 0}).to_list(100)
    
    # Create audit bundle
    bundle = {
        "bundle_id": f"AUDIT-{usecase_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "usecase": usecase,
        "evidence_count": len(evidence),
        "evidence_index": [{"id": e["id"], "type": e["artifact_type"], "hash": e.get("hash"), "timestamp": e["timestamp"]} for e in evidence],
        "risk_assessments": assessments,
        "approvals": approvals,
        "deliverables": [{"id": d["id"], "type": d["type"], "status": d["status"]} for d in deliverables],
        "bundle_hash": hashlib.sha256(json.dumps(usecase, sort_keys=True).encode()).hexdigest()
    }
    
    return bundle

# Dashboard Stats
@router.get("/dashboard/stats")
async def get_dashboard_stats():
    db = get_db()
    
    total = await db.compass_usecases.count_documents({})
    by_status = {}
    for status in UseCaseStatus:
        by_status[status.value] = await db.compass_usecases.count_documents({"status": status.value})
    
    by_tier = {}
    for tier in RiskTier:
        by_tier[tier.value] = await db.compass_usecases.count_documents({"risk_tier": tier.value})
    
    pending_approvals = await db.compass_usecases.count_documents({"status": UseCaseStatus.IN_REVIEW.value})
    
    return {
        "total_usecases": total,
        "by_status": by_status,
        "by_risk_tier": by_tier,
        "pending_approvals": pending_approvals,
        "controls_count": len(CONTROL_CATALOG),
        "policies_count": len(POLICY_CATALOG)
    }
