from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import database, models
from .dependencies import get_current_user, get_optional_current_user # Dependency dosyasından gelecek

router = APIRouter(tags=["Gönderiler ve Sosyal Ağ"])

class PostCreate(BaseModel):
    content: str
    media_url: str = None  

class PostUpdate(BaseModel):
    content: str

class CommentCreate(BaseModel):
    content: str

@router.post("/post-olustur")
def post_olustur(gelen_veri: PostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    new_post = models.Post(user_id=current_user.id, content=gelen_veri.content, media_url=gelen_veri.media_url)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"mesaj": "Post yayınlandı!", "yazar": current_user.username, "post_id": new_post.id}

@router.put("/post/{post_id}")
def post_guncelle(post_id: int, gelen_veri: PostUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post bulunamadı")
    if post.user_id != current_user.id: raise HTTPException(status_code=403, detail="Yetkiniz yok")
    post.content = gelen_veri.content
    db.commit()
    return {"mesaj": "Post güncellendi", "content": post.content}

@router.get("/populer-postlar")
def populer_postlar(hashtag: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    query = db.query(models.Post, models.User.username).join(models.User)
    if hashtag: query = query.filter(models.Post.content.ilike(f"%{hashtag}%"))
    results = query.all()
    
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        is_liked = bool(current_user and db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first())
        formatted_posts.append({"post_id": p.id, "icerik": p.content, "yazar": u, "tarih": p.created_at, "likes": like_count, "comments": comment_count, "isLiked": is_liked})
    formatted_posts.sort(key=lambda x: x["likes"], reverse=True)
    return formatted_posts

@router.post("/post/{post_id}/begen")
def post_begen(post_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post bulunamadı")
    existing_like = db.query(models.Like).filter(models.Like.post_id == post_id, models.Like.user_id == current_user.id).first()
    if existing_like:
        db.delete(existing_like)
        db.commit()
        return {"mesaj": "Beğeni geri alındı", "begenildi": False}
    else:
        new_like = models.Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"mesaj": "Post beğenildi", "begenildi": True}

@router.post("/post/{post_id}/yorum")
def yorum_yap(post_id: int, yorum: CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post bulunamadı")
    new_comment = models.Comment(post_id=post_id, user_id=current_user.id, content=yorum.content)
    db.add(new_comment)
    db.commit()
    return {"mesaj": "Yorum eklendi"}

@router.get("/post/{post_id}/yorumlar")
def yorumlari_getir(post_id: int, db: Session = Depends(database.get_db)):
    results = db.query(models.Comment, models.User).join(models.User, models.Comment.user_id == models.User.id).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at.desc()).all()
    return [{"id": c.id, "content": c.content, "yazar": u.username, "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff", "tarih": c.created_at} for c, u in results]

@router.get("/trendler")
def trendleri_getir(db: Session = Depends(database.get_db)):
    trend_kelimeler = ["Borsa", "Altın", "Kripto", "Gümüş"]
    sonuclar = [{"id": i + 1, "name": k, "count": db.query(models.Post).filter(models.Post.content.ilike(f"%{k}%")).count()} for i, k in enumerate(trend_kelimeler)]
    sonuclar.sort(key=lambda x: x["count"], reverse=True)
    return sonuclar

@router.get("/arama")
def arama_yap(q: str, db: Session = Depends(database.get_db)):
    if not q or len(q.strip()) == 0: return []
    kullanicilar = db.query(models.User).filter(models.User.username.ilike(f"%{q}%")).limit(5).all()
    return [{"name": u.username.upper(), "username": u.username.lower(), "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff"} for u in kullanicilar]

@router.post("/takip-et/{takip_edilecek_id}")
def takip_et(takip_edilecek_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.id == takip_edilecek_id: return {"hata": "Kendini takip edemezsin"}
    existing_follow = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id == takip_edilecek_id).first()
    if existing_follow:
        db.delete(existing_follow)
        db.commit()
        return {"mesaj": "Takipten çıkıldı"}
    new_follow = models.Follow(follower_id=current_user.id, followed_id=takip_edilecek_id)
    db.add(new_follow)
    db.commit()
    return {"mesaj": "Takip edildi."}

@router.get("/akis")
def akis(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    following_ids = db.query(models.Follow.followed_id).filter(models.Follow.follower_id == current_user.id).all()
    ids = [i[0] for i in following_ids]
    results = db.query(models.Post, models.User.username).join(models.User).filter(models.Post.user_id.in_(ids)).order_by(models.Post.created_at.desc()).all()
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        user_like = db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first()
        formatted_posts.append({"post_id": p.id, "icerik": p.content, "yazar": u, "tarih": p.created_at, "likes": like_count, "comments": comment_count, "isLiked": user_like is not None})
    return formatted_posts