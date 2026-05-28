from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models, auth

router = APIRouter(tags=["Kimlik Doğrulama"])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@router.post("/kayit-ol")
def kayit_ol(kullanici: UserCreate, db: Session = Depends(database.get_db)):
    hashed_pwd = auth.get_password_hash(kullanici.password)
    new_user = models.User(
        username=kullanici.username, 
        email=kullanici.email, 
        password_hash=hashed_pwd 
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"mesaj": "Kayıt başarılı"}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı!"
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}