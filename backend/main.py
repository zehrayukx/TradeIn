from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware

import database
import models
import auth
from database import engine 

from decimal import Decimal

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Borsa API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- Pydantic Şemaları ---
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class PostCreate(BaseModel):
    content: str
    media_url: str = None  

class AssetAdd(BaseModel):
    asset_name: str
    quantity: Decimal

# YENİ: Yorum şeması
class CommentCreate(BaseModel):
    content: str

# --- Kimlik Doğrulama ---
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    hata_mesaji = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik doğrulanamadı,lütfen tekrar giriş yapın.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise hata_mesaji
        user_id = int(user_id_str)
    except JWTError:
        raise hata_mesaji
        
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise hata_mesaji
        
    return user

def get_optional_current_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(database.get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            return None
        user_id = int(user_id_str)
    except JWTError:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()

# --- Kullanıcı İşlemleri ---
@app.post("/kayit-ol")
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


@app.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı adı veya şifre hatalı!"
        )
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/kullanicilari-listele")
def kullanicilari_listele(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()


# --- Gönderi (Post) İşlemleri ---
@app.post("/post-olustur")
def post_olustur(
    gelen_veri: PostCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    new_post = models.Post(
        user_id=current_user.id, 
        content=gelen_veri.content,
        media_url=gelen_veri.media_url
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"mesaj": "Post yayınlandı!", "yazar": current_user.username, "post_id": new_post.id}


@app.get("/populer-postlar")
def populer_postlar(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    results = db.query(models.Post, models.User.username).join(models.User).order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        # YENİ: Kullanıcı giriş yapmışsa ve bu postu beğenmişse is_liked = True olsun
        is_liked = False
        if current_user:
            user_like = db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first()
            if user_like:
                is_liked = True
        
        formatted_posts.append({
            "post_id": p.id, 
            "icerik": p.content, 
            "yazar": u, 
            "tarih": p.created_at,
            "likes": like_count,
            "comments": comment_count,
            "isLiked": is_liked # <-- Frontend'e uçuracağımız sihirli boolean
        })
        
    return formatted_posts


# YENİ: Beğeni (Like) İşlemi
@app.post("/post/{post_id}/begen")
def post_begen(post_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post bulunamadı")

    # Kullanıcı zaten beğenmiş mi kontrol et
    existing_like = db.query(models.Like).filter(
        models.Like.post_id == post_id, 
        models.Like.user_id == current_user.id
    ).first()

    if existing_like:
        # Zaten beğenmişse, beğeniyi geri al (Toggle mantığı)
        db.delete(existing_like)
        db.commit()
        return {"mesaj": "Beğeni geri alındı", "begenildi": False}
    else:
        # Beğenmediyse yeni beğeni ekle
        new_like = models.Like(post_id=post_id, user_id=current_user.id)
        db.add(new_like)
        db.commit()
        return {"mesaj": "Post beğenildi", "begenildi": True}


# YENİ: Yorum (Comment) İşlemi
@app.post("/post/{post_id}/yorum")
def yorum_yap(post_id: int, yorum: CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post bulunamadı")
    
    new_comment = models.Comment(
        post_id=post_id, 
        user_id=current_user.id, 
        content=yorum.content
    )
    db.add(new_comment)
    db.commit()
    return {"mesaj": "Yorum başarıyla eklendi"}


# --- Takip ve Akış İşlemleri ---
@app.post("/takip-et/{takip_edilecek_id}")
def takip_et(
    takip_edilecek_id: int, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.id == takip_edilecek_id:
        return {"hata": "Kendini takip edemezsin"}

    existing_follow = db.query(models.Follow).filter(
        models.Follow.follower_id == current_user.id,
        models.Follow.followed_id == takip_edilecek_id
    ).first()

    if existing_follow:
        # Toggle mantığı: Takip ediliyorsa takipten çık
        db.delete(existing_follow)
        db.commit()
        return {"mesaj": "Takipten çıkıldı"}

    new_follow = models.Follow(follower_id=current_user.id, followed_id=takip_edilecek_id)
    db.add(new_follow)
    db.commit()
    return {"mesaj": f"{takip_edilecek_id} ID'li kullanıcı takip edildi."}


@app.get("/akis")
def akis(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    following_ids = db.query(models.Follow.followed_id).filter(models.Follow.follower_id == current_user.id).all()
    ids = [i[0] for i in following_ids]

    feed = db.query(models.Post).filter(models.Post.user_id.in_(ids)).order_by(models.Post.created_at.desc()).all()
    return feed


# --- Portföy İşlemleri ---
@app.post("/portfoy-ekle")
def portfoy_ekle(
    gelen_veri: AssetAdd, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    existing_asset = db.query(models.UserAsset).filter(
        models.UserAsset.user_id == current_user.id,
        models.UserAsset.asset_name == gelen_veri.asset_name
    ).first()

    if existing_asset:
        existing_asset.quantity += gelen_veri.quantity
        db.commit()
        db.refresh(existing_asset)
        return {"mesaj": f"{gelen_veri.asset_name} miktarı güncellendi.", "yeni_miktar": existing_asset.quantity}
    
    new_asset = models.UserAsset(
        user_id=current_user.id,
        asset_name=gelen_veri.asset_name,
        quantity=gelen_veri.quantity
    )
    db.add(new_asset)
    db.commit()
    return {"mesaj": f"{gelen_veri.asset_name} portföyüne başarıyla eklendi!"}


@app.get("/portfoyum")
def portfoyum(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.UserAsset).filter(models.UserAsset.user_id == current_user.id).all()
    if not assets:
        return {"mesaj": "Portföyün boş."}
    return assets


# --- Profil İşlemleri ---
@app.get("/kullanici/{username}")
def kullanici_getir(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    
    posts_query = db.query(models.Post).filter(models.Post.user_id == user.id)
    posts_count = posts_query.count()
    followers_count = db.query(models.Follow).filter(models.Follow.followed_id == user.id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == user.id).count()

    # YENİ: Giriş yapan kişi bu profili zaten takip ediyor mu?
    is_following = False
    if current_user:
        existing_follow = db.query(models.Follow).filter(
            models.Follow.follower_id == current_user.id,
            models.Follow.followed_id == user.id
        ).first()
        if existing_follow:
            is_following = True

    user_posts = posts_query.order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = []
    for p in user_posts:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        # Profil sayfasındaki gönderiler için de beğeni durumunu kontrol edelim
        is_liked = False
        if current_user:
            user_like = db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first()
            if user_like:
                is_liked = True

        formatted_posts.append({
            "id": p.id,
            "content": p.content,
            "likes": like_count,
            "comments": comment_count,
            "tarih": p.created_at,
            "isLiked": is_liked
        })

    return {
        "id": user.id, # YENİ: Frontend'in takip isteği atabilmesi için ID'yi yolluyoruz
        "name": user.username.upper(),
        "username": f"@{user.username.lower()}",
        "avatar": f"https://ui-avatars.com/api/?name={user.username}&background=random&color=fff",
        "bio": "Piyasaları yakından takip eden bir TradeIn kullanıcısı.",
        "postsCount": posts_count,
        "followers": followers_count,
        "following": following_count,
        "is_following": is_following, # YENİ: Backend'den gelen gerçek takip durumu
        "posts": formatted_posts 
    }

@app.get("/profilim")
def kendi_profilim(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    posts_query = db.query(models.Post).filter(models.Post.user_id == current_user.id)
    posts_count = posts_query.count()
    followers_count = db.query(models.Follow).filter(models.Follow.followed_id == current_user.id).count()
    following_count = db.query(models.Follow).filter(models.Follow.follower_id == current_user.id).count()

    user_posts = posts_query.order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = []
    for p in user_posts:
        # YENİ: Kendi profilimiz için de gerçek beğeni ve yorum sayıları
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        formatted_posts.append({
            "id": p.id,
            "content": p.content,
            "likes": like_count,
            "comments": comment_count,
            "tarih": p.created_at
        })

    return {
        "name": current_user.username.upper(),
        "username": f"@{current_user.username.lower()}",
        "avatar": f"https://ui-avatars.com/api/?name={current_user.username}&background=random&color=fff",
        "bio": "TradeIn Geliştiricisi 🚀",
        "postsCount": posts_count,
        "followers": followers_count,
        "following": following_count,
        "posts": formatted_posts 
    }

# --- Canlı Arama (Live Search) İşlemi ---
@app.get("/arama")
def arama_yap(q: str, db: Session = Depends(database.get_db)):
    # Eğer arama kutusu boşsa boş liste dön
    if not q or len(q.strip()) == 0:
        return []
    
    # Kullanıcı adında aranan harfleri barındıranları bul (ilike büyük/küçük harf duyarsızdır)
    # limit(5) ile en fazla 5 sonuç döndürüyoruz ki menü çok uzamasın
    kullanicilar = db.query(models.User).filter(models.User.username.ilike(f"%{q}%")).limit(5).all()
    
    # React tarafının beklediği formata çevir
    sonuclar = [
        {
            "name": u.username.upper(),
            "username": u.username.lower(),
            "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff"
        } 
        for u in kullanicilar
    ]
    return sonuclar