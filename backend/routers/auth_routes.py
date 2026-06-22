from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models, auth
from sqlalchemy import or_
from utils.mail import send_reset_code_email
import random
from datetime import datetime, timedelta
from fastapi import BackgroundTasks
# Kendi mail gönderme fonksiyonunu import etmeyi unutma
from utils.mail import send_verification_email

router = APIRouter(tags=["Kimlik Doğrulama"])

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

@router.post("/kayit-ol")
def kayit_ol(kullanici: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.User).filter(models.User.email == kullanici.email).first()
    
    if existing_user:
        if not getattr(existing_user, "is_active", True):
            # Eski hesabı diriltme senaryosu (Burayı önceki gibi bırakıyoruz)
            username_check = db.query(models.User).filter(models.User.username == kullanici.username, models.User.id != existing_user.id).first()
            if username_check:
                raise HTTPException(status_code=400, detail="Bu kullanıcı adı alınmış.")
            
            existing_user.is_active = True
            existing_user.username = kullanici.username
            existing_user.password_hash = auth.get_password_hash(kullanici.password)
            db.commit()
            return {"mesaj": "Eski hesabınız kurtarıldı!"}
        else:
            raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")

    existing_username = db.query(models.User).filter(models.User.username == kullanici.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Bu kullanıcı adı zaten alınmış.")

    # 🚀 SİHİRLİ KISIM: 6 Haneli Kod Üret ve Hesabı Pasif Aç
    dogrulama_kodu = str(random.randint(100000, 999999))
    gecerlilik_suresi = datetime.utcnow() + timedelta(minutes=10) # 10 dakika geçerli

    hashed_pwd = auth.get_password_hash(kullanici.password)
    new_user = models.User(
        username=kullanici.username, 
        email=kullanici.email, 
        password_hash=hashed_pwd,
        is_active=False, # 👈 E-posta onaylanana kadar hesap kilitli!
        reset_code=dogrulama_kodu, # Şifre sıfırlama alanını doğrulama için kullanıyoruz
        reset_code_expire=gecerlilik_suresi
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 🚀 E-postayı Arka Planda Gönder (Kullanıcı beklemesin)
    # Zehra veya sen utils/mail.py içine bu fonksiyonu eklemelisiniz
    background_tasks.add_task(send_verification_email, to_email=kullanici.email, code=dogrulama_kodu)
    
    return {"mesaj": "Kayıt alındı. Lütfen e-postanıza gelen 6 haneli kodu girin."}

class VerifyEmail(BaseModel):
    email: str
    code: str

@router.post("/dogrula")
def eposta_dogrula(data: VerifyEmail, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == data.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
    if getattr(user, "is_active", False):
        return {"mesaj": "Hesabınız zaten doğrulanmış. Giriş yapabilirsiniz."}
        
    # Kod doğru mu ve süresi dolmamış mı kontrolü
    if user.reset_code != data.code:
        raise HTTPException(status_code=400, detail="Hatalı doğrulama kodu girdiniz.")
        
    if user.reset_code_expire and user.reset_code_expire < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Bu kodun süresi dolmuş. Lütfen yeni kod isteyin.")
        
    # 🚀 ONAYLANDI: Hesabı Aktifleştir ve Kodları Temizle
    user.is_active = True
    user.reset_code = None
    user.reset_code_expire = None
    db.commit()
    
    return {"mesaj": "E-posta adresiniz başarıyla doğrulandı! Artık giriş yapabilirsiniz."}

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(
        or_(
            models.User.username == form_data.username,
            models.User.email == form_data.username
        )
    ).first()

    if user and not getattr(user, "is_active", True):
        raise HTTPException(status_code=403, detail="Lütfen önce e-posta adresinizi doğrulayın.")
    
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