from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import database, models
from .dependencies import get_current_user

router = APIRouter(tags=["Sosyal Bildirimler"])

@router.get("/bildirimler")
def bildirimleri_getir(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Frontend'in isteği: Beğeni ve yorumlar son 7 gün ile sınırlandırılsın
    yedi_gun_once = datetime.utcnow() - timedelta(days=7)
    
    results = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.created_at.desc()).all()
    
    formatted_notifs = []
    for n in results:
        # Son 7 gün filtresini 'like' ve 'comment' için uyguluyoruz (follow süresiz kalabilir)
        if n.type in ["like", "comment"] and n.created_at < yedi_gun_once:
            continue
            
        formatted_notifs.append({
            "id": n.id,
            "type": n.type,
            "actor_name": n.actor.name if n.actor.name else n.actor.username,
            "actor_username": n.actor.username,
            # UI Avatars entegrasyonu veya profil resmi varsa o
            "actor_avatar": n.actor.profile_pic if n.actor.profile_pic else f"https://ui-avatars.com/api/?name={n.actor.username}&background=random&color=fff",
            "created_at": n.created_at.isoformat(),
            "read": n.is_read,
            "post_id": n.post_id,
            "post_preview": n.post.content[:40] + "..." if n.post else None,
            "comment_preview": n.comment.content if n.comment else None
        })
        
    return formatted_notifs

@router.put("/bildirimler/{notif_id}/oku")
def bildirim_oku(notif_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id, models.Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    notif.is_read = True
    db.commit()
    return {"mesaj": "Okundu işaretlendi"}

@router.put("/bildirimler/tumunu-oku")
def tumunu_oku(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id, 
        models.Notification.is_read == False
    ).update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"mesaj": "Tüm bildirimler okundu"}

@router.delete("/bildirimler/{notif_id}")
def bildirim_sil(notif_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == notif_id, models.Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Bildirim bulunamadı")
    db.delete(notif)
    db.commit()
    return {"mesaj": "Bildirim silindi"}