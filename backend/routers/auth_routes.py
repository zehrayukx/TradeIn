from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models, auth
from sqlalchemy import or_
from utils.mail import send_reset_code_email

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
    user = db.query(models.User).filter(
        or_(
            models.User.username == form_data.username,
            models.User.email == form_data.username
        )
    ).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı/E-posta veya şifre hatalı!"
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {
    "access_token": access_token, 
    "token_type": "bearer",
    "username": user.username 
}

import random
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext

# Kök dizindeki dosyalara erişim
import database
import models

# Eğer bu dosyada zaten bir router tanımlıysa (örn: router = APIRouter()), 
# aşağıdaki router_reset tanımını kullanıp en altta main.py'ye ekleyebilirsin.
# Ya da mevcut router'ın üzerinden devam edebilirsin (örnekte mevcut router adının 'router' olduğunu varsayıyorum)

# Şifre hashleme altyapısı
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- PYDANTIC ŞEMALARI ---
class PasswordResetEmailRequest(BaseModel):
    email: EmailStr

class PasswordResetVerifyRequest(BaseModel):
    email: EmailStr
    code: str

class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


# --- 1. E-POSTA GÖNDER VE KOD ÜRET ---
@router.post("/sifre-sifirla/email-gonder")
def email_gonder(request: PasswordResetEmailRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Bu e-posta adresiyle kayıtlı bir hesap bulunamadı."
        )
    
    # 6 haneli kod üret ve süresini 10 dk olarak ayarla
    generated_code = str(random.randint(100000, 999999))
    expiration_time = datetime.utcnow() + timedelta(minutes=10)
    
    user.reset_code = generated_code
    user.reset_code_expire = expiration_time
    db.commit()
    
    # Terminale yazdırarak test edelim
    print(f" e-posta: {user.email} kod: {generated_code}")
    send_reset_code_email(to_email=user.email, code=generated_code)
    
    return {"mesaj": "Doğrulama kodu e-posta adresinize başarıyla gönderildi."}
# 6 haneli kodu ürettiğin yerin altına:
 
    
    # Gerçek e-postayı yolla

    



# --- 2. KODU DOĞRULA ---
@router.post("/sifre-sifirla/kodu-dogrula")
def kodu_dogrula(request: PasswordResetVerifyRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or user.reset_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Girdiğiniz doğrulama kodu hatalı."
        )
        
    if user.reset_code_expire and user.reset_code_expire < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Doğrulama kodunun süresi dolmuş. Lütfen yeniden kod talep edin."
        )
        
    return {"mesaj": "Kod başarıyla doğrulandı."}


# --- 3. YENİ ŞİFREYİ KAYDET ---
@router.post("/sifre-sifirla/yeni-sifre")
def yeni_sifre(request: PasswordResetConfirmRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user or user.reset_code != request.code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Güvenlik doğrulaması başarısız oldu."
        )
        
    if user.reset_code_expire and user.reset_code_expire < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="İşlem süresi doldu."
        )
    
    # Şifreyi hashle ve kaydet
# YENİ ŞİFREYİ KAYDET ADIMINDA BÖYLE OLMALI:
    hashed_password = pwd_context.hash(request.new_password)
    user.password_hash = hashed_password # 👈 user.password YERİNE user.password_hash OLMALI!
    
    # Güvenlik için kodu sıfırla
    user.reset_code = None
    user.reset_code_expire = None
    db.commit()
    
    return {"mesaj": "Şifreniz başarıyla güncellendi!"}