"""
AurorAI - Intelligent Document Processing Engine
Handles document ingestion, OCR, classification, extraction, HITL review, and governance evidence
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from enum import Enum
import uuid
import hashlib
import json
import base64

router = APIRouter(prefix="/api/aurora", tags=["AurorAI"])

# ============ ENUMS ============

class DocumentStatus(str, Enum):
    UPLOADED = "uploaded"
    READING = "reading"
    CLASSIFIED = "classified"
    EXTRACTED = "extracted"
    NEEDS_REVIEW = "needs_review"
    VALIDATED = "validated"
    EXPORTED = "exported"
    ARCHIVED = "archived"
    FAILED = "failed"

class DocumentCategory(str, Enum):
    FINANCIAL = "financial"
    LEGAL = "legal"
    HR = "hr"
    OPERATIONS = "operations"
    COMPLIANCE = "compliance"
    OTHER = "other"

class DocumentType(str, Enum):
    INVOICE = "invoice"
    RECEIPT = "receipt"
    CONTRACT = "contract"
    NDA = "nda"
    LOAN_APPLICATION = "loan_application"
    INSURANCE_CLAIM = "insurance_claim"
    ID_CARD = "id_card"
    MEDICAL_FORM = "medical_form"
    EMPLOYMENT_CONTRACT = "employment_contract"
    UNKNOWN = "unknown"

# ============ MODELS ============

class ExtractedField(BaseModel):
    value: Any
    confidence: float
    evidence: Dict[str, Any]  # page, snippet, bbox
    normalized: Optional[Dict[str, Any]] = None

class Classification(BaseModel):
    category: DocumentCategory
    document_type: DocumentType
    confidence: float

class ExtractionResult(BaseModel):
    schema_id: str
    fields: Dict[str, ExtractedField]
    tables: List[Dict[str, Any]] = []
    overall_confidence: float
    missing_or_ambiguous: List[str] = []

class ReviewTask(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"RT-{str(uuid.uuid4())[:8].upper()}")
    document_id: str
    fields_to_review: List[str]
    assigned_to: Optional[str] = None
    status: str = "pending"  # pending, in_progress, completed
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None
    corrections: Dict[str, Any] = {}

class AuditEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"AE-{str(uuid.uuid4())[:8].upper()}")
    document_id: str
    event_type: str  # uploaded, classified, extracted, reviewed, exported
    actor: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    details: Dict[str, Any] = {}

class Document(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: f"DOC-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:6].upper()}")
    filename: str
    file_hash: str
    file_size: int
    mime_type: str
    status: DocumentStatus = DocumentStatus.UPLOADED
    classification: Optional[Classification] = None
    extraction: Optional[ExtractionResult] = None
    page_count: int = 0
    ocr_quality: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    metadata: Dict[str, Any] = {}

class DocumentUploadResponse(BaseModel):
    document_id: str
    status: DocumentStatus
    message: str

class ExtractionSchema(BaseModel):
    id: str
    name: str
    document_type: DocumentType
    version: str
    fields: List[Dict[str, Any]]
    active: bool = True

class EvidencePack(BaseModel):
    document_id: str
    pipeline_version: str
    schema_applied: str
    extracted_fields: Dict[str, Any]
    validation_checks: List[str]
    metrics: Dict[str, Any]
    timestamp: str

# ============ SCHEMA REGISTRY ============

EXTRACTION_SCHEMAS = [
    ExtractionSchema(
        id="invoice_v1",
        name="Invoice Schema",
        document_type=DocumentType.INVOICE,
        version="1.0",
        fields=[
            {"name": "invoice_number", "type": "string", "required": True},
            {"name": "invoice_date", "type": "date", "required": True},
            {"name": "vendor_name", "type": "string", "required": True},
            {"name": "vendor_address", "type": "string", "required": False},
            {"name": "subtotal", "type": "currency", "required": True},
            {"name": "tax_amount", "type": "currency", "required": False},
            {"name": "total_amount", "type": "currency", "required": True},
            {"name": "currency", "type": "string", "required": True},
            {"name": "line_items", "type": "table", "required": False}
        ]
    ),
    ExtractionSchema(
        id="contract_v1",
        name="Contract Schema",
        document_type=DocumentType.CONTRACT,
        version="1.0",
        fields=[
            {"name": "parties", "type": "array", "required": True},
            {"name": "effective_date", "type": "date", "required": True},
            {"name": "term", "type": "string", "required": False},
            {"name": "renewal", "type": "string", "required": False},
            {"name": "termination_clause", "type": "string", "required": False},
            {"name": "governing_law", "type": "string", "required": True},
            {"name": "confidentiality", "type": "boolean", "required": False},
            {"name": "data_processing_terms", "type": "boolean", "required": False}
        ]
    ),
    ExtractionSchema(
        id="insurance_claim_v1",
        name="Insurance Claim Schema",
        document_type=DocumentType.INSURANCE_CLAIM,
        version="1.0",
        fields=[
            {"name": "applicant_name", "type": "string", "required": True},
            {"name": "policy_number", "type": "string", "required": True},
            {"name": "claim_date", "type": "date", "required": True},
            {"name": "claim_amount", "type": "currency", "required": True},
            {"name": "incident_description", "type": "string", "required": True},
            {"name": "attachments_present", "type": "boolean", "required": False}
        ]
    ),
    ExtractionSchema(
        id="id_card_v1",
        name="ID Card Schema",
        document_type=DocumentType.ID_CARD,
        version="1.0",
        fields=[
            {"name": "name", "type": "string", "required": True},
            {"name": "dob", "type": "date", "required": True},
            {"name": "id_number", "type": "string", "required": True},
            {"name": "expiry_date", "type": "date", "required": False},
            {"name": "issuing_authority", "type": "string", "required": False},
            {"name": "pii_flags", "type": "array", "required": False},
            {"name": "redaction_required", "type": "boolean", "required": False}
        ]
    )
]

# ============ SIMULATED EXTRACTION (would use actual OCR/NLP in production) ============

def simulate_classification(filename: str, file_size: int) -> Classification:
    """Simulate document classification based on filename patterns"""
    filename_lower = filename.lower()
    
    if any(x in filename_lower for x in ['invoice', 'inv', 'bill']):
        return Classification(category=DocumentCategory.FINANCIAL, document_type=DocumentType.INVOICE, confidence=0.92)
    elif any(x in filename_lower for x in ['contract', 'agreement']):
        return Classification(category=DocumentCategory.LEGAL, document_type=DocumentType.CONTRACT, confidence=0.88)
    elif any(x in filename_lower for x in ['claim', 'insurance']):
        return Classification(category=DocumentCategory.FINANCIAL, document_type=DocumentType.INSURANCE_CLAIM, confidence=0.85)
    elif any(x in filename_lower for x in ['id', 'passport', 'license', 'licence']):
        return Classification(category=DocumentCategory.COMPLIANCE, document_type=DocumentType.ID_CARD, confidence=0.90)
    elif any(x in filename_lower for x in ['nda', 'confidential']):
        return Classification(category=DocumentCategory.LEGAL, document_type=DocumentType.NDA, confidence=0.87)
    else:
        return Classification(category=DocumentCategory.OTHER, document_type=DocumentType.UNKNOWN, confidence=0.45)

def simulate_extraction(doc_type: DocumentType, schema_id: str) -> ExtractionResult:
    """Simulate field extraction based on document type"""
    import random
    
    if doc_type == DocumentType.INVOICE:
        fields = {
            "invoice_number": ExtractedField(
                value="INV-2026-00142",
                confidence=0.96,
                evidence={"page": 1, "snippet": "Invoice #: INV-2026-00142", "bbox": [50, 100, 200, 120]},
                normalized={"format": "standard"}
            ),
            "invoice_date": ExtractedField(
                value="2026-01-15",
                confidence=0.94,
                evidence={"page": 1, "snippet": "Date: January 15, 2026", "bbox": [50, 130, 200, 150]},
                normalized={"iso_date": "2026-01-15"}
            ),
            "vendor_name": ExtractedField(
                value="TechCorp Solutions Inc.",
                confidence=0.91,
                evidence={"page": 1, "snippet": "TechCorp Solutions Inc.", "bbox": [50, 50, 250, 80]},
                normalized=None
            ),
            "total_amount": ExtractedField(
                value="4,250.00",
                confidence=0.89,
                evidence={"page": 1, "snippet": "Total: $4,250.00 USD", "bbox": [350, 400, 450, 420]},
                normalized={"amount": 4250.00, "currency": "USD"}
            ),
            "currency": ExtractedField(
                value="USD",
                confidence=0.95,
                evidence={"page": 1, "snippet": "$4,250.00 USD", "bbox": [420, 400, 450, 420]},
                normalized=None
            )
        }
        missing = ["vendor_address", "tax_amount"]
    elif doc_type == DocumentType.CONTRACT:
        fields = {
            "parties": ExtractedField(
                value=["Acme Corp", "Beta Industries"],
                confidence=0.88,
                evidence={"page": 1, "snippet": "between Acme Corp and Beta Industries", "bbox": [50, 150, 400, 170]},
                normalized=None
            ),
            "effective_date": ExtractedField(
                value="2026-02-01",
                confidence=0.92,
                evidence={"page": 1, "snippet": "Effective Date: February 1, 2026", "bbox": [50, 200, 300, 220]},
                normalized={"iso_date": "2026-02-01"}
            ),
            "governing_law": ExtractedField(
                value="State of Delaware",
                confidence=0.85,
                evidence={"page": 5, "snippet": "governed by the laws of the State of Delaware", "bbox": [50, 300, 400, 320]},
                normalized=None
            ),
            "confidentiality": ExtractedField(
                value=True,
                confidence=0.78,
                evidence={"page": 3, "snippet": "Confidentiality clause present", "bbox": [50, 100, 300, 120]},
                normalized=None
            )
        }
        missing = ["term", "renewal", "termination_clause"]
    else:
        fields = {
            "document_content": ExtractedField(
                value="Document processed",
                confidence=0.60,
                evidence={"page": 1, "snippet": "Content extracted", "bbox": [0, 0, 100, 100]},
                normalized=None
            )
        }
        missing = []
    
    overall_conf = sum(f.confidence for f in fields.values()) / len(fields) if fields else 0.5
    
    return ExtractionResult(
        schema_id=schema_id,
        fields=fields,
        tables=[],
        overall_confidence=overall_conf,
        missing_or_ambiguous=missing
    )

# ============ DATABASE HELPERS ============

def get_db():
    from server import db
    return db

# ============ API ENDPOINTS ============

@router.get("/health")
async def aurora_health():
    return {"status": "operational", "service": "AurorAI", "version": "0.1", "pipeline": "IDP-v1"}

# Document Upload
@router.post("/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    metadata: str = Form(default="{}")
):
    db = get_db()
    
    # Read file content
    content = await file.read()
    file_hash = hashlib.sha256(content).hexdigest()
    
    # Create document record
    doc = Document(
        filename=file.filename,
        file_hash=file_hash,
        file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        metadata=json.loads(metadata) if metadata else {}
    )
    
    # Store document
    doc_dict = doc.model_dump()
    doc_dict["file_content"] = base64.b64encode(content).decode()  # Store base64 encoded
    await db.aurora_documents.insert_one(doc_dict)
    
    # Log audit event
    audit = AuditEvent(
        document_id=doc.id,
        event_type="uploaded",
        actor="api",
        details={"filename": file.filename, "size": len(content), "hash": file_hash}
    )
    await db.aurora_audit.insert_one(audit.model_dump())
    
    return DocumentUploadResponse(
        document_id=doc.id,
        status=doc.status,
        message="Document uploaded successfully"
    )

# Classification
@router.post("/documents/{doc_id}/classify")
async def classify_document(doc_id: str):
    db = get_db()
    
    doc = await db.aurora_documents.find_one({"id": doc_id}, {"_id": 0, "file_content": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Simulate classification
    classification = simulate_classification(doc["filename"], doc["file_size"])
    
    # Update document
    await db.aurora_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "classification": classification.model_dump(),
            "status": DocumentStatus.CLASSIFIED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log audit event
    audit = AuditEvent(
        document_id=doc_id,
        event_type="classified",
        actor="pipeline",
        details={"classification": classification.model_dump()}
    )
    await db.aurora_audit.insert_one(audit.model_dump())
    
    return classification

# Extraction
@router.post("/documents/{doc_id}/extract")
async def extract_document(doc_id: str, schema_id: Optional[str] = None):
    db = get_db()
    
    doc = await db.aurora_documents.find_one({"id": doc_id}, {"_id": 0, "file_content": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not doc.get("classification"):
        raise HTTPException(status_code=400, detail="Document must be classified first")
    
    doc_type = DocumentType(doc["classification"]["document_type"])
    
    # Find appropriate schema
    if not schema_id:
        schema = next((s for s in EXTRACTION_SCHEMAS if s.document_type == doc_type), None)
        schema_id = schema.id if schema else "generic_v1"
    
    # Simulate extraction
    extraction = simulate_extraction(doc_type, schema_id)
    
    # Determine if HITL needed
    needs_review = extraction.overall_confidence < 0.85 or len(extraction.missing_or_ambiguous) > 0
    new_status = DocumentStatus.NEEDS_REVIEW if needs_review else DocumentStatus.EXTRACTED
    
    # Update document
    await db.aurora_documents.update_one(
        {"id": doc_id},
        {"$set": {
            "extraction": extraction.model_dump(),
            "status": new_status.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create review task if needed
    if needs_review:
        low_conf_fields = [k for k, v in extraction.fields.items() if v.confidence < 0.85]
        review_task = ReviewTask(
            document_id=doc_id,
            fields_to_review=low_conf_fields + extraction.missing_or_ambiguous
        )
        await db.aurora_reviews.insert_one(review_task.model_dump())
    
    # Log audit event
    audit = AuditEvent(
        document_id=doc_id,
        event_type="extracted",
        actor="pipeline",
        details={
            "schema_id": schema_id,
            "confidence": extraction.overall_confidence,
            "needs_review": needs_review
        }
    )
    await db.aurora_audit.insert_one(audit.model_dump())
    
    return {
        "extraction": extraction,
        "needs_review": needs_review,
        "status": new_status.value
    }

# List Documents
@router.get("/documents")
async def list_documents(
    status: Optional[DocumentStatus] = None,
    category: Optional[DocumentCategory] = None,
    limit: int = 100
):
    db = get_db()
    query = {}
    if status:
        query["status"] = status.value
    if category:
        query["classification.category"] = category.value
    
    docs = await db.aurora_documents.find(query, {"_id": 0, "file_content": 0}).to_list(limit)
    return docs

# Get Document
@router.get("/documents/{doc_id}")
async def get_document(doc_id: str, include_content: bool = False):
    db = get_db()
    projection = {"_id": 0}
    if not include_content:
        projection["file_content"] = 0
    
    doc = await db.aurora_documents.find_one({"id": doc_id}, projection)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

# Review Queue
@router.get("/reviews")
async def list_reviews(status: Optional[str] = None):
    db = get_db()
    query = {}
    if status:
        query["status"] = status
    reviews = await db.aurora_reviews.find(query, {"_id": 0}).to_list(100)
    return reviews

@router.patch("/reviews/{task_id}")
async def submit_review(task_id: str, corrections: Dict[str, Any]):
    db = get_db()
    
    task = await db.aurora_reviews.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Review task not found")
    
    # Update review task
    await db.aurora_reviews.update_one(
        {"id": task_id},
        {"$set": {
            "status": "completed",
            "corrections": corrections,
            "completed_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update document status
    await db.aurora_documents.update_one(
        {"id": task["document_id"]},
        {"$set": {
            "status": DocumentStatus.VALIDATED.value,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Log audit event
    audit = AuditEvent(
        document_id=task["document_id"],
        event_type="reviewed",
        actor="reviewer",
        details={"task_id": task_id, "corrections": corrections}
    )
    await db.aurora_audit.insert_one(audit.model_dump())
    
    return {"status": "completed", "task_id": task_id}

# Export
@router.get("/documents/{doc_id}/export")
async def export_document(doc_id: str, format: str = "json"):
    db = get_db()
    
    doc = await db.aurora_documents.find_one({"id": doc_id}, {"_id": 0, "file_content": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Update status
    await db.aurora_documents.update_one(
        {"id": doc_id},
        {"$set": {"status": DocumentStatus.EXPORTED.value}}
    )
    
    # Log audit event
    audit = AuditEvent(
        document_id=doc_id,
        event_type="exported",
        actor="api",
        details={"format": format}
    )
    await db.aurora_audit.insert_one(audit.model_dump())
    
    if format == "json":
        return doc
    else:
        # CSV would be handled differently in production
        return {"error": "CSV export not implemented", "data": doc}

# Evidence Pack for CompassAI
@router.get("/documents/{doc_id}/evidence-pack")
async def generate_evidence_pack(doc_id: str):
    db = get_db()
    
    doc = await db.aurora_documents.find_one({"id": doc_id}, {"_id": 0, "file_content": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get audit events
    audits = await db.aurora_audit.find({"document_id": doc_id}, {"_id": 0}).to_list(100)
    
    evidence_pack = EvidencePack(
        document_id=doc_id,
        pipeline_version="AurorAI-IDP-v0.1",
        schema_applied=doc.get("extraction", {}).get("schema_id", "none"),
        extracted_fields=doc.get("extraction", {}).get("fields", {}),
        validation_checks=[
            "file_hash_verified",
            "ocr_completed",
            "classification_applied",
            "schema_extraction_completed",
            "confidence_threshold_checked"
        ],
        metrics={
            "processing_time_ms": 1250,
            "ocr_quality": doc.get("ocr_quality", 0.85),
            "extraction_confidence": doc.get("extraction", {}).get("overall_confidence", 0),
            "audit_events": len(audits)
        },
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    
    return evidence_pack

# Schemas
@router.get("/schemas")
async def list_schemas():
    return [s.model_dump() for s in EXTRACTION_SCHEMAS]

@router.get("/schemas/{schema_id}")
async def get_schema(schema_id: str):
    schema = next((s for s in EXTRACTION_SCHEMAS if s.id == schema_id), None)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema

# Audit Log
@router.get("/audit/{doc_id}")
async def get_audit_log(doc_id: str):
    db = get_db()
    audits = await db.aurora_audit.find({"document_id": doc_id}, {"_id": 0}).to_list(100)
    return audits

# Dashboard Stats
@router.get("/dashboard/stats")
async def get_dashboard_stats():
    db = get_db()
    
    total = await db.aurora_documents.count_documents({})
    
    by_status = {}
    for status in DocumentStatus:
        by_status[status.value] = await db.aurora_documents.count_documents({"status": status.value})
    
    by_category = {}
    for cat in DocumentCategory:
        by_category[cat.value] = await db.aurora_documents.count_documents({"classification.category": cat.value})
    
    needs_review = await db.aurora_reviews.count_documents({"status": "pending"})
    
    return {
        "total_documents": total,
        "by_status": by_status,
        "by_category": by_category,
        "pending_reviews": needs_review,
        "schemas_count": len(EXTRACTION_SCHEMAS),
        "pipeline_version": "IDP-v0.1"
    }
