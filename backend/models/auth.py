from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserCredentials(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6) # Supabase requires min 6 chars

class AuthResponse(BaseModel):
    user_id: Optional[str] = None
    email: Optional[EmailStr] = None
    access_token: Optional[str] = None
    token_type: Optional[str] = "bearer"
    message: Optional[str] = None 