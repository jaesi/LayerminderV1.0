from jose import jwt, JWTError
from fastapi import Request, HTTPException, status

from core.config import settings

'''
Client's Header -> Authorization: Bearer <Token> 
Passes: sub claim: save it to request.state_user_id 
Not passes: 401 Unauthorized error
'''

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_JWT_SECRET = settings.SUPABASE_JWT_SECRET
ALGORITHM = "HS256"

def verify_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[ALGORITHM],
            audience="authenticated",
            issuer=f"{SUPABASE_URL}/"
        )
        return payload.get("sub")
    except JWTError:
        return None
    
def get_current_user(request: Request):
    '''
    FastAPI dependency to:
        1) Parse Bearer token from authorization header
        2) execute verify_token to check verification
        3) gives user_id, if fails -> 401 error
    '''
    auth: str = request.headers.get("Authorization") or ""
    scheme, _, token = auth.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header missing or invalid",
        )
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid or expired",
        )
    return user_id