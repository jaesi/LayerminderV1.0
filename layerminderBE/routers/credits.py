"""
Credit API endpoints for querying user credit balance and history.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth import get_current_user
from services.credit import credit_service


router = APIRouter(tags=["Credits"])


class CreditBalanceResponse(BaseModel):
    """Response model for credit balance."""
    user_id: str
    credits: int


@router.get(
    "/credits/balance",
    response_model=CreditBalanceResponse,
    summary="Get current credit balance",
    description="Retrieve the current credit balance for the authenticated user."
)
async def get_credit_balance(user_id: str = Depends(get_current_user)) -> CreditBalanceResponse:
    """
    Get the current credit balance for the authenticated user.

    Returns:
        CreditBalanceResponse with user_id and current credit balance
    """
    credits = credit_service.get_user_credits(user_id)

    return CreditBalanceResponse(
        user_id=user_id,
        credits=credits
    )
