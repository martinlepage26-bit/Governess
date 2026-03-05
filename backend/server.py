from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import asyncio
import resend

# Load environment variables first
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI(title="Govern-AI API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    company: Optional[str] = None
    message: str

class ContactResponse(BaseModel):
    id: str
    status: str
    message: str

class Publication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    abstract: str
    date: str
    link: Optional[str] = None
    tags: List[str] = []

class CaseStudy(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    client_type: str
    challenge: str
    approach: str
    outcome: str
    tags: List[str] = []

class AssessmentQuestion(BaseModel):
    id: int
    question: str
    options: List[str]
    category: str

class AssessmentSubmission(BaseModel):
    answers: dict  # {question_id: selected_option_index}
    company_name: Optional[str] = None
    email: Optional[str] = None

class AssessmentResult(BaseModel):
    id: str
    overall_score: int
    category_scores: dict
    recommendations: List[str]
    analysis: str
    timestamp: str

# ============ ASSESSMENT QUESTIONS ============

ASSESSMENT_QUESTIONS = [
    {
        "id": 1,
        "question": "How are AI system boundaries defined in your organization?",
        "options": [
            "No formal definition exists",
            "Informal documentation only",
            "Formal documentation with some gaps",
            "Comprehensive system boundary documentation"
        ],
        "category": "System Boundaries"
    },
    {
        "id": 2,
        "question": "How do you handle risk tiering for AI deployments?",
        "options": [
            "No risk tiering process",
            "Ad-hoc risk assessment",
            "Standardized but incomplete process",
            "Comprehensive risk tiering with clear escalation paths"
        ],
        "category": "Risk Management"
    },
    {
        "id": 3,
        "question": "What controls exist before shipping AI features?",
        "options": [
            "No pre-deployment controls",
            "Basic testing only",
            "Testing with some approval gates",
            "Full lifecycle gates with documented approvals"
        ],
        "category": "Control Gates"
    },
    {
        "id": 4,
        "question": "How is decision authority documented for AI systems?",
        "options": [
            "No documentation",
            "Informal understanding only",
            "Some roles documented",
            "Complete authority matrix with audit trails"
        ],
        "category": "Authority & Accountability"
    },
    {
        "id": 5,
        "question": "What incident response protocols exist for AI failures?",
        "options": [
            "No protocols",
            "General IT incident process only",
            "AI-specific protocols in development",
            "Comprehensive playbooks with tested containment"
        ],
        "category": "Incident Response"
    },
    {
        "id": 6,
        "question": "How do you manage permissions for agentic AI systems?",
        "options": [
            "No permission model",
            "Broad permissions with limited oversight",
            "Defined permissions with some gaps",
            "Explicit permission model with audit logging"
        ],
        "category": "Agentic Governance"
    },
    {
        "id": 7,
        "question": "Can you reconstruct how AI decisions were made?",
        "options": [
            "No reconstruction capability",
            "Limited logging only",
            "Partial replay capability",
            "Full decision reconstruction with evidence artifacts"
        ],
        "category": "Auditability"
    },
    {
        "id": 8,
        "question": "How are AI system changes controlled?",
        "options": [
            "No change control",
            "Informal notification process",
            "Approval required for major changes",
            "Full change control with re-approval triggers"
        ],
        "category": "Change Control"
    }
]

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Govern-AI API", "status": "operational"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Contact Form
@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact(request: ContactRequest):
    contact_id = str(uuid.uuid4())
    
    # Save to database
    contact_doc = {
        "id": contact_id,
        "name": request.name,
        "email": request.email,
        "company": request.company,
        "message": request.message,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "new"
    }
    await db.contacts.insert_one(contact_doc)
    
    # Send email notification
    try:
        html_content = f"""
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> {request.name} ({request.email})</p>
        <p><strong>Company:</strong> {request.company or 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>{request.message}</p>
        """
        
        params = {
            "from": SENDER_EMAIL,
            "to": ["martinlepage.ai@gmail.com"],
            "subject": f"New Contact: {request.name} - Govern-AI",
            "html": html_content
        }
        
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Contact email sent for {contact_id}")
    except Exception as e:
        logger.error(f"Failed to send contact email: {str(e)}")
    
    return ContactResponse(
        id=contact_id,
        status="success",
        message="Thank you for reaching out. I'll respond within 24-48 hours."
    )

# Publications
@api_router.get("/publications", response_model=List[Publication])
async def get_publications():
    publications = await db.publications.find({}, {"_id": 0}).to_list(100)
    if not publications:
        # Return seed data if empty
        return [
            Publication(
                id="pub-1",
                title="Governance as Decision Machinery: Beyond Observability Theater",
                abstract="This paper argues that effective AI governance must be embedded in workflow gates, not bolted on as monitoring. We present a framework for converting leadership intent into operational constraints.",
                date="2025-12",
                link="https://linkedin.com/in/martin-lepage-ai",
                tags=["AI Governance", "Decision Systems", "Controls"]
            ),
            Publication(
                id="pub-2",
                title="Agentic AI Governance: Permissions, Boundaries, and Accountability",
                abstract="When AI systems act autonomously, governance shifts from output quality to delegated authority. This paper presents a permissions model for agentic systems.",
                date="2025-10",
                link="https://linkedin.com/in/martin-lepage-ai",
                tags=["Agentic AI", "Permissions", "Accountability"]
            ),
            Publication(
                id="pub-3",
                title="Evidence Artifacts for Audit-Grade AI Narratives",
                abstract="How to design evidence collection that survives procurement scrutiny, incident reviews, and regulatory examination.",
                date="2025-08",
                link="https://linkedin.com/in/martin-lepage-ai",
                tags=["Audit", "Evidence", "Compliance"]
            )
        ]
    return publications

# Case Studies
@api_router.get("/portfolio", response_model=List[CaseStudy])
async def get_portfolio():
    cases = await db.case_studies.find({}, {"_id": 0}).to_list(100)
    if not cases:
        # Return seed data if empty
        return [
            CaseStudy(
                id="case-1",
                title="Enterprise LLM Deployment Governance",
                client_type="Fortune 500 Financial Services",
                challenge="Needed to deploy customer-facing LLM features while meeting strict regulatory requirements for explainability and audit trails.",
                approach="Implemented AurorAI framework: system boundary mapping, risk tiering, approval gates at pre-deploy and post-deploy stages, evidence ledger for all decisions.",
                outcome="Achieved regulatory approval in 60% less time than previous AI initiatives. Full audit reconstruction capability for every customer interaction.",
                tags=["LLM", "Financial Services", "Compliance"]
            ),
            CaseStudy(
                id="case-2",
                title="Agentic Workflow Governance",
                client_type="Healthcare Technology Startup",
                challenge="Building an AI agent that handles patient scheduling and triage, requiring strict controls on what the agent can access and decide.",
                approach="Deployed CompassAI framework: explicit permission boundaries, material-decision thresholds requiring human approval, kill switch design, comprehensive logging.",
                outcome="Launched agent with clear accountability chain. Zero unauthorized actions in first 6 months. Passed third-party security audit.",
                tags=["Agentic AI", "Healthcare", "Permissions"]
            ),
            CaseStudy(
                id="case-3",
                title="AI Incident Response Protocol Design",
                client_type="E-commerce Platform",
                challenge="After an AI recommendation system incident, needed comprehensive incident response protocols for all AI systems.",
                approach="Designed containment protocols, communication templates, remediation workflows, and learning loop processes. Integrated with existing IT incident management.",
                outcome="Response time to AI incidents reduced by 70%. Clear escalation paths. Documented learnings feeding into control improvements.",
                tags=["Incident Response", "E-commerce", "Risk Management"]
            )
        ]
    return cases

# Assessment Tool
@api_router.get("/assessment/questions", response_model=List[AssessmentQuestion])
async def get_assessment_questions():
    return [AssessmentQuestion(**q) for q in ASSESSMENT_QUESTIONS]

@api_router.post("/assessment/submit", response_model=AssessmentResult)
async def submit_assessment(submission: AssessmentSubmission):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    result_id = str(uuid.uuid4())
    
    # Calculate scores
    category_scores = {}
    total_score = 0
    max_score = 0
    
    for q in ASSESSMENT_QUESTIONS:
        qid = str(q["id"])
        if qid in submission.answers:
            answer_idx = submission.answers[qid]
            score = answer_idx * 25  # 0, 25, 50, 75, 100
            category = q["category"]
            if category not in category_scores:
                category_scores[category] = []
            category_scores[category].append(score)
            total_score += score
            max_score += 100
    
    # Average by category
    for cat in category_scores:
        scores = category_scores[cat]
        category_scores[cat] = int(sum(scores) / len(scores)) if scores else 0
    
    overall_score = int((total_score / max_score) * 100) if max_score > 0 else 0
    
    # Generate AI analysis
    try:
        chat = LlmChat(
            api_key=os.environ.get('EMERGENT_LLM_KEY'),
            session_id=f"assessment-{result_id}",
            system_message="""You are an AI governance expert. Analyze assessment results and provide actionable recommendations.
            Be concise but specific. Focus on practical next steps. Use professional consulting language."""
        ).with_model("openai", "gpt-5.2")
        
        analysis_prompt = f"""
        AI Governance Assessment Results:
        Overall Score: {overall_score}/100
        Category Scores: {category_scores}
        
        Questions answered:
        {[{'question': q['question'], 'answer': q['options'][submission.answers.get(str(q['id']), 0)]} for q in ASSESSMENT_QUESTIONS if str(q['id']) in submission.answers]}
        
        Provide:
        1. A 2-3 sentence overall assessment
        2. Top 3 specific, actionable recommendations
        
        Format as JSON: {{"analysis": "...", "recommendations": ["...", "...", "..."]}}
        """
        
        user_message = UserMessage(text=analysis_prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        import json
        try:
            # Try to extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                parsed = json.loads(response[json_start:json_end])
                analysis = parsed.get("analysis", "Assessment complete.")
                recommendations = parsed.get("recommendations", [])
            else:
                analysis = response
                recommendations = []
        except:
            analysis = response
            recommendations = []
            
    except Exception as e:
        logger.error(f"AI analysis failed: {str(e)}")
        analysis = f"Your governance maturity score is {overall_score}/100. "
        if overall_score < 40:
            analysis += "Significant gaps exist in your AI governance framework. Consider foundational work on system boundaries and risk tiering."
        elif overall_score < 70:
            analysis += "Your governance framework has solid foundations but gaps remain. Focus on formalizing controls and documentation."
        else:
            analysis += "Strong governance foundations in place. Focus on optimization and maintaining audit-grade evidence."
        
        recommendations = [
            "Document system boundaries for all AI deployments",
            "Implement formal risk tiering process",
            "Establish pre-deployment approval gates"
        ]
    
    # Ensure we have recommendations
    if not recommendations:
        recommendations = [
            "Establish clear AI system boundaries and ownership",
            "Implement risk-based controls proportional to impact",
            "Build audit-grade evidence collection into workflows"
        ]
    
    result = AssessmentResult(
        id=result_id,
        overall_score=overall_score,
        category_scores=category_scores,
        recommendations=recommendations[:5],
        analysis=analysis,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    
    # Save to database
    result_doc = result.model_dump()
    result_doc["submission"] = submission.model_dump()
    await db.assessments.insert_one(result_doc)
    
    return result

# Include the router in the main app
app.include_router(api_router)

# Include CompassAI router
from compass_ai import router as compass_router
app.include_router(compass_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
