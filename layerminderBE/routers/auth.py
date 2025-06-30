from fastapi import APIRouter, HTTPException, Depends
from schemas import UserCreate, UserLogin, Token
from layerminderBE.firebase import db
from auth import create_access_token, verify_token
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl = "/api/v1/auth/login")

router = APIRouter(tags=["auth"])

# 회원가입 엔드포인트
@router.post("/signup", response_model=Token)
async def signup(user: UserCreate):
    users = db.collection("users")
    if users.document(user.email).get().exists:
        raise HTTPException(400, "Email already exists")
    hashed = pwd_context.hash(user.password)
    users.document(user.email).set({
        "email": user.email,
        "password": hashed
    })
    access_token = create_access_token({"sub": user.email})
    return {"access_token" :access_token} 

# 로그인 엔드포인트
@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends()):
    user_doc = db.collection("users").document(form.username).get()
    if not user_doc.exists:
        raise HTTPException(400, "Invalid credentials")
    data = user_doc.to_dict()
    if not pwd_context.verify(form.password, data["password"]):
        raise HTTPException(400, "Invalid credentials")
    access_token = create_access_token({"sub": form.username})
    return {"access_token": access_token}

