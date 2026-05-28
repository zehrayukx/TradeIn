from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models, auth
from .dependencies import get_current_user

router = APIRouter(tags=["Ayarlar"])

class UsernameUpdate(BaseModel):
    new_username: str

class PasswordUpdate(BaseModel):
    old_password: str
    new_password: str

@router.put("/kullanici-adi-degistir")
def kullanici_adi_degistir(data: UsernameUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    mevcut_kullanici = db.query(models.User).filter(models.User.username == data.new_username).first()
    if mevcut_kullanici: raise HTTPException(status_code=409, detail="Alınmış")
    current_user.username = data.new_username
    db.commit()
    return {"mesaj": "Güncellendi", "username": current_user.username}

@router.post("/sifre-degistir")
def sifre_degistir(data: PasswordUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if not auth.verify_password(data.old_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Hatalı şifre")
    current_user.password_hash = auth.get_password_hash(data.new_password)
    db.commit()
    return {"mesaj": "Şifre güncellendi"}

@router.delete("/hesabimi-sil")
def hesabimi_sil(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db.delete(current_user)
    db.commit()
    return {"mesaj": "Silindi"}