from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
import database, models
from .dependencies import get_current_user
from utils.mail import send_alarm_email

# .env dosyasını yükle (SMTP şifrelerini kodun içine gömmemek için)
load_dotenv()

router = APIRouter(tags=["Alarmlar"])

# --- PYDANTIC ŞEMALARI ---
class AlarmCreate(BaseModel):
    asset: str
    target_price: float
    condition: str 
    notify_email: bool
    notify_browser: bool

class NotificationCreate(BaseModel):
    alarm_id: int
    asset: str
    target_price: float
    triggered_price: float
    condition: str

# --- E-POSTA GÖNDERME FONKSİYONU ---

# --- ENDPOINTS (UÇLAR) ---

@router.post("/alarm-kur")
def alarm_kur(gelen_veri: AlarmCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_alarm = models.Alarm(
        user_id=current_user.id, 
        asset=gelen_veri.asset, 
        target_price=gelen_veri.target_price, 
        condition=gelen_veri.condition, 
        notify_email=gelen_veri.notify_email, 
        notify_browser=gelen_veri.notify_browser, 
        is_active=True
    )
    db.add(new_alarm)
    db.commit()
    return {"mesaj": "Alarm kuruldu"}

@router.get("/alarmlarim")
def alarmlarim(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Alarm).filter(models.Alarm.user_id == current_user.id).order_by(models.Alarm.created_at.desc()).all()

@router.put("/alarm-toggle/{alarm_id}")
def alarm_toggle(alarm_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm: raise HTTPException(status_code=404, detail="Bulunamadı")
    alarm.is_active = not alarm.is_active
    db.commit()
    return {"mesaj": "Alarm güncellendi", "is_active": alarm.is_active}

@router.delete("/alarm-sil/{alarm_id}")
def alarm_sil(alarm_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm: raise HTTPException(status_code=404, detail="Bulunamadı")
    db.delete(alarm)
    db.commit()
    return {"mesaj": "Alarm silindi"}

@router.get("/alarm-bildirimleri")
def alarm_bildirimleri(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.AlarmNotification).filter(models.AlarmNotification.user_id == current_user.id).order_by(models.AlarmNotification.triggered_at.desc()).all()

@router.put("/alarm-bildirimleri-okundu")
def alarm_bildirimleri_okundu(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.AlarmNotification).filter(models.AlarmNotification.user_id == current_user.id, models.AlarmNotification.is_read == False).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"mesaj": "Okundu"}

@router.delete("/alarm-bildirim-sil/{notif_id}")
def alarm_bildirim_sil(notif_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.AlarmNotification).filter(models.AlarmNotification.id == notif_id, models.AlarmNotification.user_id == current_user.id).first()
    if not notif: raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    db.delete(notif)
    db.commit()
    return {"mesaj": "Silindi"}

@router.put("/alarm-duzenle/{alarm_id}")
def alarm_duzenle(alarm_id: int, gelen_veri: AlarmCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    alarm = db.query(models.Alarm).filter(models.Alarm.id == alarm_id, models.Alarm.user_id == current_user.id).first()
    if not alarm: raise HTTPException(status_code=404, detail="Alarm bulunamadı")
    
    alarm.asset = gelen_veri.asset
    alarm.target_price = gelen_veri.target_price
    alarm.condition = gelen_veri.condition
    alarm.notify_email = gelen_veri.notify_email
    alarm.notify_browser = gelen_veri.notify_browser
    alarm.is_active = True 
    
    db.commit()
    return {"mesaj": "Alarm başarıyla güncellendi"}

# 🚀 %100 DİNAMİK ALARM TETİKLEME UCU
@router.post("/alarm-tetiklendi")
def alarm_tetiklendi(gelen_veri: NotificationCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    # 1. Önce tetiklenen alarmın kendisini veritabanından buluyoruz
    alarm = db.query(models.Alarm).filter(models.Alarm.id == gelen_veri.alarm_id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Tetiklenmeye çalışılan alarm bulunamadı")

    # 🎯 KİLİT NOKTA: Bildirimi alarmı kuran gerçek kullanıcının ID'sine (alarm.user_id) kaydediyoruz
    yeni_bildirim = models.AlarmNotification(
        user_id=alarm.user_id, 
        alarm_id=gelen_veri.alarm_id, 
        asset=gelen_veri.asset, 
        target_price=gelen_veri.target_price, 
        triggered_price=gelen_veri.triggered_price, 
        condition=gelen_veri.condition, 
        is_read=False
    )
    db.add(yeni_bildirim)
    
    # 2. Alarmı pasife alıyoruz (Spam olmaması için)
    alarm.is_active = False
    
    # 3. 🚀 %100 Dinamik E-posta Gönderimi:
    # `alarm.owner.email` ilişkisini kullanarak alarmı kuran gerçek kişinin sistemdeki mail adresini çekiyoruz
    if alarm.notify_email and alarm.owner and alarm.owner.email:
        background_tasks.add_task(
            send_alarm_email, 
            to_email=alarm.owner.email,  # 🎯 Kim tetiklerse tetiklesin, mail her zaman alarmın gerçek sahibine gider!
            asset=gelen_veri.asset, 
            target_price=gelen_veri.target_price, 
            current_price=gelen_veri.triggered_price, 
            condition=gelen_veri.condition
        )
        
    db.commit()
    return {"mesaj": "Bildirim kaydedildi ve e-posta kuyruğa eklendi"}



