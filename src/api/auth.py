from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from src.database import get_db
from src.models import User
from src.schemas import LoginRequest, TokenResponse, UserResponse
from src.services.auth_service import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    # FR-002: notify user without revealing whether email or password was wrong
    if not user or not verify_password(req.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials."
        )

    roles = [ur.roleId for ur in user.user_roles if ur.isActive]
    token = create_access_token(data={"sub": user.userId, "roles": roles})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        userId=user.userId,
        name=user.name,
        email=user.email,
        roles=roles,
        department=user.department
    )

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    roles = [ur.roleId for ur in current_user.user_roles if ur.isActive]
    return UserResponse(
        userId=current_user.userId,
        name=current_user.name,
        email=current_user.email,
        department=current_user.department,
        roles=roles
    )
