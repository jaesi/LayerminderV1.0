import os 
from supabase import create_client
from core.config import settings

SUPABASE_URL = settings.SUPABASE_URL
SUPABASE_KEY = settings.SUPABASE_SERVICE_ROLE
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)