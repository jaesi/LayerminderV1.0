# Firebase 초기화 코드 자리

import firebase_admin
from firebase_admin import credentials, firestore

# 1) 서비스 계정 키 경로
cred = credentials.Certificate("layerminderBE/serviceAccountKey.json")

# 2) 앱 초기화
if not firebase_admin._apps:
    # Firebase Admin SDK 초기화
    firebase_admin.initialize_app(cred)

# 3) Firestore 클라이언트 생성
db = firestore.client()