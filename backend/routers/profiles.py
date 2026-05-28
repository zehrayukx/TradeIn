from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
import database, models
from .dependencies import get_current_user, get_optional_current_user

router = APIRouter(tags=["Profiller"])

class ProfileUpdate(BaseModel):
    name: str 
    bio: str

@router.get("/kullanicilari-listele")
def kullanicilari_listele(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()

@router.get("/kullanici/{username}")
def kullanici_getir(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user: raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    posts_query = db.query(models.Post).filter(models.Post.user_id == user.id)
    posts_count = posts_query.count()
    followers_count = db.query(models.Follow).filter(models.Follow.followed_id == user.id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user.id).count()

    is_following = False
    is_own_profile = False 
    if current_user:
        if current_user.id == user.id:
            is_own_profile = True
        else:
            existing_follow = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id == user.id).first()
            if existing_follow: is_following = True

    user_posts = posts_query.order_by(models.Post.created_at.desc()).all()
    formatted_posts = []
    for p in user_posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        is_liked = bool(current_user and db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first())
        formatted_posts.append({"id": p.id, "content": p.content, "likes": like_count, "comments": comment_count, "tarih": p.created_at, "isLiked": is_liked})

    return {
        "id": user.id, "name": user.name if user.name else user.username.upper(), "username": f"@{user.username.lower()}",
        "avatar": f"https://ui-avatars.com/api/?name={user.username}&background=random&color=fff",
        "bio": user.bio if user.bio else "Piyasaları yakından takip eden bir TradeIn kullanıcısı.",
        "postsCount": posts_count, "followers": followers_count, "following": following_count,
        "is_following": is_following, "is_own_profile": is_own_profile, "posts": formatted_posts 
    }

@router.get("/profilim")
def kendi_profilim(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    posts_query = db.query(models.Post).filter(models.Post.user_id == current_user.id)
    posts_count = posts_query.count()
    followers_count = db.query(models.Follow).filter(models.Follow.followed_id == current_user.id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id).count()
    user_posts = posts_query.order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = [{"id": p.id, "content": p.content, "likes": db.query(models.Like).filter(models.Like.post_id == p.id).count(), "comments": db.query(models.Comment).filter(models.Comment.post_id == p.id).count(), "tarih": p.created_at} for p in user_posts]

    return {
        "name": current_user.name if current_user.name else current_user.username.upper(),
        "username": f"@{current_user.username.lower()}", "avatar": f"https://ui-avatars.com/api/?name={current_user.username}&background=random&color=fff",
        "bio": current_user.bio if current_user.bio else "TradeIn platformuna yeni katıldım",
        "postsCount": posts_count, "followers": followers_count, "following": following_count, "posts": formatted_posts 
    }

@router.get("/profilim/begendiklerim")
def kendi_begendiklerim(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    results = db.query(models.Post, models.User.username).join(models.Like, models.Like.post_id == models.Post.id).join(models.User, models.Post.user_id == models.User.id).filter(models.Like.user_id == current_user.id).order_by(models.Post.created_at.desc()).all()
    formatted_posts = [{"post_id": p.id, "icerik": p.content, "yazar": u, "tarih": p.created_at, "likes": db.query(models.Like).filter(models.Like.post_id == p.id).count(), "comments": db.query(models.Comment).filter(models.Comment.post_id == p.id).count(), "isLiked": True} for p, u in results]
    return formatted_posts

@router.get("/kullanici/{username}/begendiklerim")
def kullanici_begendiklerim(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user: raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    results = db.query(models.Post, models.User.username).join(models.Like, models.Like.post_id == models.Post.id).join(models.User, models.Post.user_id == models.User.id).filter(models.Like.user_id == user.id).order_by(models.Post.created_at.desc()).all()
    formatted_posts = [{"post_id": p.id, "icerik": p.content, "yazar": u, "tarih": p.created_at, "likes": db.query(models.Like).filter(models.Like.post_id == p.id).count(), "comments": db.query(models.Comment).filter(models.Comment.post_id == p.id).count(), "isLiked": bool(current_user and db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first())} for p, u in results]
    return formatted_posts

@router.put("/profilimi-guncelle")
def profilimi_guncelle(gelen_veri: ProfileUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    current_user.name = gelen_veri.name 
    current_user.bio = gelen_veri.bio
    db.commit()
    return {"mesaj": "Profil güncellendi", "name": current_user.name, "bio": current_user.bio}

@router.get("/onerilen-kullanicilar")
def onerilen_kullanicilar(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    users = db.query(models.User).all()
    user_data = []
    for u in users:
        if current_user and current_user.id == u.id: continue
        followers_count = db.query(models.Follow).filter(models.Follow.followed_id == u.id).count()
        is_following = bool(current_user and db.query(models.Follow).filter(models.Follow.follower_id == current_user.id, models.Follow.followed_id == u.id).first())
        user_data.append({"id": u.id, "name": u.name if u.name else u.username.upper(), "username": u.username.lower(), "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff", "followers": followers_count, "is_following": is_following})
    user_data.sort(key=lambda x: x["followers"], reverse=True)
    return user_data[:4]