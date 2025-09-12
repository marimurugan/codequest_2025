from crewai import Agent
from langchain.llms import OpenAI
import json
from models.schemas import PolicyResult, PolicyClause, DisputeType

class PolicyAgent:
    def __init__(self):
        self.llm = OpenAI(temperature=0)
    
    def get_relevant_policies(self, dispute_type: DisputeType, evidence: dict) -> PolicyResult:
        policy_map = {
            DisputeType.FRAUD: [
                {"id": "clause_21", "summary": "Zero liability for unauthorized charges reported by the customer"}
            ],
            DisputeType.BILLING_ERROR: [
                {"id": "clause_12", "summary": "Refund billing errors within 90 days of transaction"}
            ],
            DisputeType.DUPLICATE_CHARGE: [
                {"id": "clause_15", "summary": "Refund duplicate charges within 90 days"}
            ],
            DisputeType.SUBSCRIPTION: [
                {"id": "clause_32", "summary": "Refund unused subscription period if cancellation was requested before billing"}
            ],
            DisputeType.MERCHANT_DISPUTE: [
                {"id": "clause_45", "summary": "Full refund if merchant cannot provide proof of delivery"}
            ]
        }
        
        # Return policies based on dispute type
        policies = policy_map.get(dispute_type, [
            {"id": "clause_default", "summary": "Review case manually for appropriate resolution"}
        ])
        
        clauses = [PolicyClause(**policy) for policy in policies]
        return PolicyResult(clauses=clauses)