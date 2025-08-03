from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
import uuid
from datetime import datetime, timezone

from core.supabase_client import supabase
from auth import get_current_user
from schemas import RecordCreate, RecordResponse

