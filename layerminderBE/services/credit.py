"""
Credit management service for LayerMinder beta users.
Handles credit consumption, checking, and querying.
"""
from typing import Optional
from fastapi import HTTPException, status

from core.supabase_client import supabase


class CreditService:
    """Service for managing user credits."""

    @staticmethod
    def get_user_credits(user_id: str) -> int:
        """
        Get the current credit balance for a user.

        Args:
            user_id: The UUID of the user

        Returns:
            Current credit balance (0 if user not found)
        """
        try:
            result = supabase.rpc(
                "get_user_credits",
                {"p_user_id": user_id}
            ).execute()

            return result.data if result.data is not None else 0

        except Exception as e:
            print(f"[CreditService] Error getting credits for user {user_id}: {e}")
            return 0

    @staticmethod
    def consume_credit(
        user_id: str,
        amount: int = 1,
        reason: str = "Image generation"
    ) -> bool:
        """
        Attempt to consume credits for a user.

        Args:
            user_id: The UUID of the user
            amount: Number of credits to consume (default: 1)
            reason: Reason for consumption (for logging)

        Returns:
            True if credits were successfully consumed, False if insufficient credits

        Raises:
            HTTPException: If there's a database error
        """
        try:
            result = supabase.rpc(
                "consume_credit",
                {
                    "p_user_id": user_id,
                    "p_amount": amount,
                    "p_reason": reason
                }
            ).execute()

            # The function returns a boolean
            success = result.data if result.data is not None else False

            if not success:
                print(f"[CreditService] Insufficient credits for user {user_id}. Requested: {amount}")

            return success

        except Exception as e:
            print(f"[CreditService] Error consuming credits for user {user_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process credit consumption"
            )

    @staticmethod
    def check_sufficient_credits(user_id: str, required_amount: int = 1) -> bool:
        """
        Check if user has sufficient credits without consuming them.

        Args:
            user_id: The UUID of the user
            required_amount: Number of credits required

        Returns:
            True if user has enough credits, False otherwise
        """
        current_credits = CreditService.get_user_credits(user_id)
        return current_credits >= required_amount


# Singleton instance
credit_service = CreditService()
