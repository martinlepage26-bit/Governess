from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
ADMIN_EMAILS = [e.strip() for e in os.environ.get('ADMIN_EMAILS', '').split(',') if e.strip()]

mongo_url = os.environ.get('MONGO_URL')
if not mongo_url:
    raise ValueError("MONGO_URL environment variable is required")

client: Optional[AsyncIOMotorClient] = None
db = None

async def get_database():
    global client, db
    if client is None:
        logger.info("Creating MongoDB client...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[os.environ.get('DB_NAME', 'ai_governance')]
        logger.info("MongoDB client created.")
    return db

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ─── Models ───

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class Publication(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = ""
    title: str
    venue: str = ""
    year: str = ""
    description: str = ""
    link: str = ""
    internal: bool = False
    status: str = "published"
    abstract: str = ""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PublicationCreate(BaseModel):
    type: str = ""
    title: str
    venue: str = ""
    year: str = ""
    description: str = ""
    link: str = ""
    internal: bool = False
    status: str = "published"
    abstract: str = ""

class PublicationUpdate(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    venue: Optional[str] = None
    year: Optional[str] = None
    description: Optional[str] = None
    link: Optional[str] = None
    internal: Optional[bool] = None
    status: Optional[str] = None
    abstract: Optional[str] = None

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    organization: str = ""
    date: str
    time: str
    topic: str = ""
    current_state: str = ""
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BookingCreate(BaseModel):
    name: str
    email: str
    organization: str = ""
    date: str
    time: str
    topic: str = ""
    current_state: str = ""

class BookingStatusUpdate(BaseModel):
    status: str

# ─── FAQ Models ───

class FAQItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    section: str  # 'definitions', 'evidence', 'engagements'
    question: str
    answer: str
    order: int = 0
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class FAQItemCreate(BaseModel):
    section: str
    question: str
    answer: str
    order: int = 0
    active: bool = True

class FAQItemUpdate(BaseModel):
    section: Optional[str] = None
    question: Optional[str] = None
    answer: Optional[str] = None
    order: Optional[int] = None
    active: Optional[bool] = None

# ─── Service Models ───

class ServicePackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    package_number: int  # 1, 2, 3
    title_en: str
    title_fr: str
    subtitle_en: str = ""
    subtitle_fr: str = ""
    description_en: str = ""
    description_fr: str = ""
    best_for_en: str = ""
    best_for_fr: str = ""
    deliverables_en: List[str] = []
    deliverables_fr: List[str] = []
    produces_en: List[str] = []
    produces_fr: List[str] = []
    active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ServicePackageCreate(BaseModel):
    package_number: int
    title_en: str
    title_fr: str
    subtitle_en: str = ""
    subtitle_fr: str = ""
    description_en: str = ""
    description_fr: str = ""
    best_for_en: str = ""
    best_for_fr: str = ""
    deliverables_en: List[str] = []
    deliverables_fr: List[str] = []
    produces_en: List[str] = []
    produces_fr: List[str] = []
    active: bool = True

class ServicePackageUpdate(BaseModel):
    package_number: Optional[int] = None
    title_en: Optional[str] = None
    title_fr: Optional[str] = None
    subtitle_en: Optional[str] = None
    subtitle_fr: Optional[str] = None
    description_en: Optional[str] = None
    description_fr: Optional[str] = None
    best_for_en: Optional[str] = None
    best_for_fr: Optional[str] = None
    deliverables_en: Optional[List[str]] = None
    deliverables_fr: Optional[List[str]] = None
    produces_en: Optional[List[str]] = None
    produces_fr: Optional[List[str]] = None
    active: Optional[bool] = None

# ─── Health ───

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@app.get("/health")
async def root_health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

# ─── Status (existing) ───

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    database = await get_database()
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    await database.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    database = await get_database()
    status_checks = await database.status_checks.find({}, {"_id": 0}).to_list(1000)
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    return status_checks

# ─── Publications ───

@api_router.get("/publications", response_model=List[Publication])
async def get_publications():
    database = await get_database()
    pubs = await database.publications.find({}, {"_id": 0}).to_list(100)
    return pubs

@api_router.post("/publications", response_model=Publication)
async def create_publication(input: PublicationCreate):
    database = await get_database()
    pub = Publication(**input.model_dump())
    doc = pub.model_dump()
    await database.publications.insert_one(doc)
    return pub

@api_router.put("/publications/{pub_id}", response_model=Publication)
async def update_publication(pub_id: str, input: PublicationUpdate):
    database = await get_database()
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await database.publications.find_one_and_update(
        {"id": pub_id}, {"$set": update_data}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Publication not found")
    return result

@api_router.delete("/publications/{pub_id}")
async def delete_publication(pub_id: str):
    database = await get_database()
    result = await database.publications.delete_one({"id": pub_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Publication not found")
    return {"status": "deleted"}

# ─── Email Functions ───

async def send_email(to: list, subject: str, html: str):
    if not resend.api_key:
        logger.warning("No RESEND_API_KEY configured, skipping email")
        return
    try:
        params = {"from": SENDER_EMAIL, "to": to, "subject": subject, "html": html}
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent to {to}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")

def booking_confirmation_html(booking):
    return f"""
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#1a2744">
      <h2 style="margin:0 0 8px;font-size:22px">Booking Confirmed</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px">Your governance debrief has been confirmed.</p>
      <div style="background:#f8f9fc;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px"><strong>Date:</strong> {booking['date']}</p>
        <p style="margin:0 0 8px"><strong>Time:</strong> {booking['time']} (Eastern)</p>
        {f"<p style='margin:0 0 8px'><strong>Topic:</strong> {booking['topic']}</p>" if booking.get('topic') else ""}
      </div>
      <p style="color:#666;font-size:14px;margin:0 0 8px">A calendar invite or additional details will follow shortly.</p>
      <p style="color:#666;font-size:14px;margin:0">— Martin Lepage, PhD</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#999;font-size:12px;margin:0">AI Governance Practice &amp; Research</p>
    </div>"""

def booking_cancellation_html(booking):
    return f"""
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#1a2744">
      <h2 style="margin:0 0 8px;font-size:22px">Booking Update</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px">Unfortunately, the requested time slot is no longer available.</p>
      <div style="background:#f8f9fc;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px"><strong>Requested date:</strong> {booking['date']}</p>
        <p style="margin:0 0 8px"><strong>Requested time:</strong> {booking['time']} (Eastern)</p>
      </div>
      <p style="color:#666;font-size:14px;margin:0 0 8px">Please visit the booking page to select a new time, or reply to this email to coordinate directly.</p>
      <p style="color:#666;font-size:14px;margin:0">— Martin Lepage, PhD</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
      <p style="color:#999;font-size:12px;margin:0">AI Governance Practice &amp; Research</p>
    </div>"""

def new_booking_notification_html(booking):
    return f"""
    <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;color:#1a2744">
      <h2 style="margin:0 0 8px;font-size:22px">New Booking Request</h2>
      <p style="color:#666;margin:0 0 24px;font-size:14px">A new debrief has been requested.</p>
      <div style="background:#f8f9fc;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px"><strong>Name:</strong> {booking['name']}</p>
        <p style="margin:0 0 8px"><strong>Email:</strong> {booking['email']}</p>
        {f"<p style='margin:0 0 8px'><strong>Organization:</strong> {booking['organization']}</p>" if booking.get('organization') else ""}
        <p style="margin:0 0 8px"><strong>Date:</strong> {booking['date']}</p>
        <p style="margin:0 0 8px"><strong>Time:</strong> {booking['time']} (Eastern)</p>
        {f"<p style='margin:0 0 8px'><strong>Topic:</strong> {booking['topic']}</p>" if booking.get('topic') else ""}
        {f"<p style='margin:0 0 8px'><strong>Current state:</strong> {booking['current_state']}</p>" if booking.get('current_state') else ""}
      </div>
      <p style="color:#666;font-size:14px;margin:0">Log in to the admin panel to confirm or reschedule.</p>
    </div>"""

# ─── Bookings ───

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings():
    database = await get_database()
    bookings = await database.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return bookings

@api_router.post("/bookings", response_model=Booking)
async def create_booking(input: BookingCreate):
    database = await get_database()
    booking = Booking(**input.model_dump())
    doc = booking.model_dump()
    await database.bookings.insert_one(doc)
    # Notify admin of new booking
    if ADMIN_EMAILS:
        asyncio.create_task(send_email(
            ADMIN_EMAILS,
            f"New Booking: {booking.name} — {booking.date} {booking.time}",
            new_booking_notification_html(doc)
        ))
    return booking

@api_router.put("/bookings/{booking_id}/status")
async def update_booking_status(booking_id: str, input: BookingStatusUpdate):
    database = await get_database()
    if input.status not in ["pending", "confirmed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await database.bookings.find_one_and_update(
        {"id": booking_id}, {"$set": {"status": input.status}}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Booking not found")
    # Send email to client
    client_email = result.get('email')
    if client_email:
        if input.status == 'confirmed':
            asyncio.create_task(send_email(
                [client_email],
                "Governance Debrief Confirmed",
                booking_confirmation_html(result)
            ))
        elif input.status == 'cancelled':
            asyncio.create_task(send_email(
                [client_email],
                "Booking Update — New Time Needed",
                booking_cancellation_html(result)
            ))
    return result

@api_router.delete("/bookings/{booking_id}")
async def delete_booking(booking_id: str):
    database = await get_database()
    result = await database.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "deleted"}

# ─── Booked dates endpoint (public) ───

@api_router.get("/bookings/booked-slots")
async def get_booked_slots():
    """Return dates/times that are already booked (for calendar display)"""
    database = await get_database()
    bookings = await database.bookings.find(
        {"status": {"$ne": "cancelled"}},
        {"_id": 0, "date": 1, "time": 1}
    ).to_list(500)
    return bookings

# ─── Seed Data ───

SEED_PUBLICATIONS = [
    {
        "id": "pub-sealed-card",
        "type": "Protocol",
        "title": "The Sealed Card Protocol: Mediated Legitimacy, Charging, and Governance at the Seam",
        "venue": "Research Protocol",
        "year": "2024",
        "description": "A framework for analyzing how legitimacy is established in the context of generative AI and mediation.",
        "link": "/sealed-card",
        "internal": True,
        "status": "published",
        "abstract": ""
    },
    {
        "id": "pub-incident-analysis",
        "type": "Briefing Series",
        "title": "AI Governance Incident Analysis",
        "venue": "Research Briefings",
        "year": "2024",
        "description": "Seven case studies translating real AI incidents into operational controls: Amazon hiring bias, Clearview data provenance, Zillow forecasting, Dutch welfare scandal, COMPAS, Samsung leaks, Air Canada chatbot.",
        "link": "/research",
        "internal": True,
        "status": "published",
        "abstract": ""
    },
    {
        "id": "pub-readiness-snapshot",
        "type": "Framework",
        "title": "AI Governance Readiness Snapshot",
        "venue": "Assessment Tool",
        "year": "2024",
        "description": "Interactive assessment tool measuring governance maturity across eight dimensions: inventory, risk tiering, decision rights, controls, evidence, vendor review, cadence, and documentation.",
        "link": "/tool",
        "internal": True,
        "status": "published",
        "abstract": ""
    }
]

SEED_WORKING_PAPERS = [
    {
        "id": "wp-risk-tiering",
        "type": "Working Paper",
        "title": "Risk Tiering for AI Systems: A Practical Framework",
        "venue": "",
        "year": "",
        "description": "Structured criteria for classifying AI use cases by impact, sensitivity, autonomy, and exposure. Includes worked examples across sectors.",
        "link": "",
        "internal": False,
        "status": "in_development",
        "abstract": "Structured criteria for classifying AI use cases by impact, sensitivity, autonomy, and exposure. Includes worked examples across sectors."
    },
    {
        "id": "wp-evidence-architecture",
        "type": "Working Paper",
        "title": "Evidence Architecture for AI Governance",
        "venue": "",
        "year": "",
        "description": "How to design documentation systems that survive audit scrutiny: versioning, ownership, change logs, and reconstruction capability.",
        "link": "",
        "internal": False,
        "status": "in_development",
        "abstract": "How to design documentation systems that survive audit scrutiny: versioning, ownership, change logs, and reconstruction capability."
    },
    {
        "id": "wp-vendor-due-diligence",
        "type": "Working Paper",
        "title": "Vendor AI Due Diligence: A Procurement Framework",
        "venue": "",
        "year": "",
        "description": "Questionnaire design, evaluation criteria, and contractual requirements for third-party AI systems.",
        "link": "",
        "internal": False,
        "status": "in_development",
        "abstract": "Questionnaire design, evaluation criteria, and contractual requirements for third-party AI systems."
    }
]

# ─── FAQ Endpoints ───

@api_router.get("/faq", response_model=List[FAQItem])
async def get_faq_items():
    database = await get_database()
    items = await database.faq_items.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return items

@api_router.get("/faq/{section}", response_model=List[FAQItem])
async def get_faq_by_section(section: str):
    database = await get_database()
    items = await database.faq_items.find({"section": section, "active": True}, {"_id": 0}).sort("order", 1).to_list(100)
    return items

@api_router.post("/faq", response_model=FAQItem)
async def create_faq_item(input: FAQItemCreate):
    database = await get_database()
    item = FAQItem(**input.model_dump())
    doc = item.model_dump()
    await database.faq_items.insert_one(doc)
    return item

@api_router.put("/faq/{item_id}", response_model=FAQItem)
async def update_faq_item(item_id: str, input: FAQItemUpdate):
    database = await get_database()
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await database.faq_items.find_one_and_update(
        {"id": item_id}, {"$set": update_data}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    return result

@api_router.delete("/faq/{item_id}")
async def delete_faq_item(item_id: str):
    database = await get_database()
    result = await database.faq_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    return {"status": "deleted"}

# ─── Service Packages Endpoints ───

@api_router.get("/services", response_model=List[ServicePackage])
async def get_service_packages():
    database = await get_database()
    packages = await database.service_packages.find({}, {"_id": 0}).sort("package_number", 1).to_list(10)
    return packages

@api_router.get("/services/active", response_model=List[ServicePackage])
async def get_active_service_packages():
    database = await get_database()
    packages = await database.service_packages.find({"active": True}, {"_id": 0}).sort("package_number", 1).to_list(10)
    return packages

@api_router.post("/services", response_model=ServicePackage)
async def create_service_package(input: ServicePackageCreate):
    database = await get_database()
    package = ServicePackage(**input.model_dump())
    doc = package.model_dump()
    await database.service_packages.insert_one(doc)
    return package

@api_router.put("/services/{package_id}", response_model=ServicePackage)
async def update_service_package(package_id: str, input: ServicePackageUpdate):
    database = await get_database()
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await database.service_packages.find_one_and_update(
        {"id": package_id}, {"$set": update_data}, return_document=True, projection={"_id": 0}
    )
    if not result:
        raise HTTPException(status_code=404, detail="Service package not found")
    return result

@api_router.delete("/services/{package_id}")
async def delete_service_package(package_id: str):
    database = await get_database()
    result = await database.service_packages.delete_one({"id": package_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service package not found")
    return {"status": "deleted"}

async def seed_publications():
    database = await get_database()
    count = await database.publications.count_documents({})
    if count == 0:
        all_pubs = SEED_PUBLICATIONS + SEED_WORKING_PAPERS
        for pub in all_pubs:
            pub["created_at"] = datetime.now(timezone.utc).isoformat()
        await database.publications.insert_many(all_pubs)
        logger.info(f"Seeded {len(all_pubs)} publications")

# Seed FAQ Items
SEED_FAQ_ITEMS = [
    # Definitions section
    {"section": "definitions", "question": "What is AI governance?", "answer": "AI governance refers to the frameworks, policies, and practices that guide the responsible development, deployment, and oversight of artificial intelligence systems. It ensures AI decisions are documented, reviewable, and defensible.", "order": 0},
    {"section": "definitions", "question": "What is a risk tier?", "answer": "A risk tier categorizes AI use cases by their potential impact. Higher tiers require more scrutiny, documentation, and approval. Canada's Algorithmic Impact Assessment uses four levels based on rights impact and reversibility.", "order": 1},
    {"section": "definitions", "question": "What is an evidence trail?", "answer": "An evidence trail is the documented history of decisions, tests, and reviews that support an AI system's deployment. It demonstrates due diligence to auditors, regulators, and stakeholders.", "order": 2},
    {"section": "definitions", "question": "What is the difference between AI ethics and AI governance?", "answer": "AI ethics focuses on principles and values (fairness, transparency, accountability). AI governance operationalizes these principles through policies, controls, and documentation that can be audited and enforced.", "order": 3},
    {"section": "definitions", "question": "What is algorithmic accountability?", "answer": "Algorithmic accountability means organizations can explain how their AI systems work, why decisions were made, and who is responsible. It requires documentation, testing, and clear decision rights.", "order": 4},
    # Evidence section
    {"section": "evidence", "question": "What documentation do I need for AI governance?", "answer": "Start with a use case inventory, risk classifications, and decision logs. See the Library page for frameworks and templates.", "order": 0},
    {"section": "evidence", "question": "How do I prepare for an AI audit?", "answer": "Build an evidence trail: document decisions, test results, and approvals. The Controls and Evidence Pack helps organizations prepare for audit scrutiny.", "order": 1},
    {"section": "evidence", "question": "What is procurement asking about AI?", "answer": "Procurement teams increasingly ask about AI risk management, bias testing, data governance, and incident response. Having documented controls demonstrates governance maturity.", "order": 2},
    {"section": "evidence", "question": "How often should I review AI systems?", "answer": "High-risk systems need quarterly reviews minimum. Lower-risk systems can be annual. Changes in data, model performance, or business context should trigger ad-hoc reviews.", "order": 3},
    {"section": "evidence", "question": "What evidence do regulators expect?", "answer": "Regulators expect documentation of: risk assessment, testing and validation, human oversight mechanisms, incident response procedures, and ongoing monitoring results.", "order": 4},
    # Engagements section
    {"section": "engagements", "question": "What does a governance engagement include?", "answer": "Engagements typically include discovery, framework development, control design, and documentation. See the Service Offers page for package details.", "order": 0},
    {"section": "engagements", "question": "How long does it take to establish AI governance?", "answer": "Initial governance foundation takes 4-8 weeks. Full controls and evidence packs take 8-12 weeks. Timelines depend on organizational complexity and existing maturity.", "order": 1},
    {"section": "engagements", "question": "Do I need AI governance if I only use vendor AI?", "answer": "Yes. Vendor AI still requires governance: due diligence, contract requirements, monitoring, and incident response. You're accountable for AI decisions even when using third-party systems.", "order": 2},
    {"section": "engagements", "question": "Can governance work with agile delivery?", "answer": "Yes. Good governance integrates with delivery cadences. Our approach emphasizes lightweight controls that prevent drift without blocking deployment velocity.", "order": 3},
    {"section": "engagements", "question": "How do I get started?", "answer": "Take the Readiness Snapshot for a preliminary assessment, then book a debrief to discuss next steps.", "order": 4},
]

async def seed_faq_items():
    database = await get_database()
    count = await database.faq_items.count_documents({})
    if count == 0:
        for item in SEED_FAQ_ITEMS:
            item["id"] = str(uuid.uuid4())
            item["active"] = True
            item["created_at"] = datetime.now(timezone.utc).isoformat()
        await database.faq_items.insert_many(SEED_FAQ_ITEMS)
        logger.info(f"Seeded {len(SEED_FAQ_ITEMS)} FAQ items")

# Seed Service Packages
SEED_SERVICE_PACKAGES = [
    {
        "package_number": 1,
        "title_en": "Governance Foundation",
        "title_fr": "Fondation de gouvernance",
        "subtitle_en": "Establish governance for the first time",
        "subtitle_fr": "Établir la gouvernance pour la première fois",
        "best_for_en": "organizations establishing governance for the first time or consolidating governance across teams.",
        "best_for_fr": "organisations établissant la gouvernance pour la première fois ou consolidant la gouvernance entre équipes.",
        "deliverables_en": ["AI use case and vendor inventory starter", "Risk tiering criteria with examples", "Decision rights and approval flow", "Governance cadence: meeting model, owners, and upkeep tasks"],
        "deliverables_fr": ["Démarrage d'inventaire des cas d'utilisation IA et fournisseurs", "Critères de hiérarchisation des risques avec exemples", "Droits de décision et flux d'approbation", "Cadence de gouvernance: modèle de réunion, responsables et tâches de maintien"],
        "produces_en": ["A working governance model teams can use immediately", "Role clarity for procurement and audit conversations", "A defensible baseline for review and escalation"],
        "produces_fr": ["Un modèle de gouvernance fonctionnel utilisable immédiatement", "Clarté des rôles pour les conversations d'approvisionnement et d'audit", "Une base défendable pour l'examen et l'escalade"]
    },
    {
        "package_number": 2,
        "title_en": "Controls and Evidence Pack",
        "title_fr": "Contrôles et dossier de preuves",
        "subtitle_en": "Prepare for audit and procurement scrutiny",
        "subtitle_fr": "Préparer l'examen d'audit et d'approvisionnement",
        "best_for_en": "organizations preparing for procurement scrutiny, customer questionnaires, internal audit review, or regulator engagement.",
        "best_for_fr": "organisations se préparant à l'examen d'approvisionnement, aux questionnaires clients, à l'audit interne ou à l'engagement réglementaire.",
        "deliverables_en": ["Control register mapped to your risk tiers", "Evaluation expectations: testing, monitoring, and thresholds", "Vendor review questions and evidence checklist", "Decision log template and documentation packet outline"],
        "deliverables_fr": ["Registre de contrôles adapté à vos niveaux de risque", "Attentes d'évaluation: tests, surveillance et seuils", "Questions de revue fournisseur et liste de vérification des preuves", "Modèle de journal de décisions et structure du dossier de documentation"],
        "produces_en": ["Procurement ready documentation structure", "Audit ready evidence expectations", "Clear control ownership and upkeep responsibilities"],
        "produces_fr": ["Structure documentaire prête pour l'approvisionnement", "Attentes en matière de preuves prêtes pour l'audit", "Propriété claire des contrôles et responsabilités de maintien"]
    },
    {
        "package_number": 3,
        "title_en": "Oversight Retainer",
        "title_fr": "Mandat de supervision continue",
        "subtitle_en": "Stable oversight for active AI delivery",
        "subtitle_fr": "Supervision stable pour une livraison IA active",
        "best_for_en": "organizations with active AI delivery who want stable oversight, clear decisions, and current documentation.",
        "best_for_fr": "organisations avec une livraison IA active souhaitant une supervision stable, des décisions claires et une documentation à jour.",
        "deliverables_en": ["Recurring governance and risk review support", "Decision log stewardship and evidence upkeep cadence", "Control roadmap updates aligned to delivery realities", "Procurement and audit support for specific reviews"],
        "deliverables_fr": ["Soutien récurrent en gouvernance et revue des risques", "Gestion du journal de décisions et cadence de maintien des preuves", "Mises à jour de la feuille de route des contrôles alignées sur les réalités de livraison", "Soutien à l'approvisionnement et à l'audit pour des examens spécifiques"],
        "produces_en": ["Stable oversight without slowing delivery", "Clear documentation as systems change", "Executive ready summaries and next steps"],
        "produces_fr": ["Supervision stable sans ralentir la livraison", "Documentation claire à mesure que les systèmes changent", "Sommaires exécutifs et prochaines étapes"]
    }
]

async def seed_service_packages():
    database = await get_database()
    count = await database.service_packages.count_documents({})
    if count == 0:
        for pkg in SEED_SERVICE_PACKAGES:
            pkg["id"] = str(uuid.uuid4())
            pkg["active"] = True
            pkg["created_at"] = datetime.now(timezone.utc).isoformat()
        await database.service_packages.insert_many(SEED_SERVICE_PACKAGES)
        logger.info(f"Seeded {len(SEED_SERVICE_PACKAGES)} service packages")

# ─── App Setup ───

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_db_client():
    try:
        logger.info("Starting startup...")
        await get_database()
        logger.info("Database connected, seeding...")
        await seed_publications()
        logger.info("Seeded publications")
        await seed_faq_items()
        logger.info("Seeded FAQ")
        await seed_service_packages()
        logger.info("Seeded services")
        logger.info("Database connection initialized")
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        # Re-raise to prevent server from starting if DB is critical
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    global client
    if client:
        client.close()
        logger.info("Database connection closed")