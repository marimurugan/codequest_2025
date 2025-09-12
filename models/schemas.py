from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime

class DisputeType(str, Enum):
    FRAUD = "Fraud"
    BILLING_ERROR = "Billing Error"
    DUPLICATE_CHARGE = "Duplicate Charge"
    SUBSCRIPTION = "Subscription"
    MERCHANT_DISPUTE = "Merchant Dispute"

class CaseStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    IN_REVIEW = "in_review"
    ESCALATED = "escalated"
    PENDING_DOCS = "pending_docs"

class ResolutionAction(str, Enum):
    REFUND = "refund"
    PARTIAL_REFUND = "partial_refund"
    BLOCK_CARD = "block_card"
    ESCALATE = "escalate"
    NO_ACTION = "no_action"
    REOPEN = "reopen"
    APPROVE = "approve"  # Added this missing value

class DocumentType(str, Enum):
    SALES_SLIP = "sales_slip"
    INVOICE = "invoice"
    CUSTOMER_COPY = "customer_copy"
    SIGNED_FORM = "signed_form"
    OTHER = "other"

class Transaction(BaseModel):
    customer_id: str
    transaction_id: str
    amount: float
    currency: str
    date: str
    merchant: str
    channel: str
    customer_statement: str
    crm_ticket_id: str
    previous_interactions: List[Dict[str, Any]]
    risk_signals: Dict[str, Any]

class ClassificationResult(BaseModel):
    type: DisputeType
    confidence: float = Field(..., ge=0, le=1)

class PolicyClause(BaseModel):
    id: str
    summary: str

class PolicyResult(BaseModel):
    clauses: List[PolicyClause]

class ResolutionRecommendation(BaseModel):
    resolution: List[ResolutionAction]
    amount: Optional[float] = None
    currency: Optional[str] = None
    citations: List[str]
    rationale: str

class DocumentInfo(BaseModel):
    filename: str
    document_type: DocumentType
    upload_date: datetime
    size: int

class Case(BaseModel):
    case_id: str
    transaction: Transaction
    classification: ClassificationResult
    policies: PolicyResult
    recommendation: ResolutionRecommendation
    status: CaseStatus
    media_trust_score: Optional[float] = None
    supporting_documents: List[DocumentInfo] = []
    created_date: datetime
    resolved_date: Optional[datetime] = None
    agent_notes: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class CaseActionRequest(BaseModel):
    action: ResolutionAction
    notes: Optional[str] = None

class DocumentUploadResponse(BaseModel):
    success: bool
    message: str
    media_trust_score: Optional[float] = None
    requires_escalation: bool = False

class DocumentAnalysisResult(BaseModel):
    authentic: bool
    relevant: bool
    trust_score: float = Field(..., ge=0, le=100)
    reasoning: str
    matches_transaction: bool
    document_type: str

class DocumentInfo(BaseModel):
    filename: str
    original_filename: str
    document_type: str
    upload_date: datetime
    size: int
    analysis: Optional[DocumentAnalysisResult] = None