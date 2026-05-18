from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from jose import JWTError, jwt
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
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

class ProfileUpdate(BaseModel):
    bio: str


class ProfileUpdate(BaseModel):
    name: str # 🎯 YENİ
    bio: str
    
class PostUpdate(BaseModel):
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

@app.put("/post/{post_id}")
def post_guncelle(
    post_id: int, 
    gelen_veri: PostUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post bulunamadı")
    
    # Güvenlik: Sadece postun sahibi düzenleyebilir!
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bu postu düzenleme yetkiniz yok")
    
    post.content = gelen_veri.content
    db.commit()
    return {"mesaj": "Post başarıyla güncellendi", "content": post.content}

@app.get("/populer-postlar")
def populer_postlar(hashtag: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    query = db.query(models.Post, models.User.username).join(models.User)
    
    # 🎯 KİLİT NOKTA: Eğer frontend'den bir arama/hashtag kelimesi geldiyse sadece onları filtrele
    if hashtag:
        query = query.filter(models.Post.content.ilike(f"%{hashtag}%"))
        
    results = query.all()
    
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
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
            "isLiked": is_liked 
        })
        
    formatted_posts.sort(key=lambda x: x["likes"], reverse=True)
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
    # Kullanıcının takip ettiği kişilerin ID'lerini alıyoruz
    following_ids = db.query(models.Follow.followed_id).filter(models.Follow.follower_id == current_user.id).all()
    ids = [i[0] for i in following_ids]

    # 🎯 KİLİT NOKTA: Sadece takip edilen kullanıcıların postlarını ve kullanıcı adlarını çekiyoruz
    results = db.query(models.Post, models.User.username).join(models.User).filter(models.Post.user_id.in_(ids)).order_by(models.Post.created_at.desc()).all()

    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        # Akıştaki postları giriş yapan kullanıcı beğenmiş mi kontrolü
        user_like = db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first()
        
        formatted_posts.append({
            "post_id": p.id, 
            "icerik": p.content, 
            "yazar": u, 
            "tarih": p.created_at,
            "likes": like_count,
            "comments": comment_count,
            "isLiked": user_like is not None
        })
        
    return formatted_posts


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

    # 🎯 KİLİT NOKTA BURASI: Aranan kişi aslında giriş yapan kişinin ta kendisi mi?
    is_following = False
    is_own_profile = False 
    
    if current_user:
        if current_user.id == user.id:
            is_own_profile = True # Evet, bu sensin!
        else:
            # Sen değilsen, takip ediyor musun ona bakalım
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
        "id": user.id,
        "name": user.name if user.name else user.username.upper(),
        "username": f"@{user.username.lower()}",
        "avatar": f"https://ui-avatars.com/api/?name={user.username}&background=random&color=fff",
        "bio": user.bio if user.bio else "Piyasaları yakından takip eden bir TradeIn kullanıcısı.",
        "postsCount": posts_count,
        "followers": followers_count,
        "following": following_count,
        "is_following": is_following,
        "is_own_profile": is_own_profile, # 🎯 Frontend'e bu işareti uçuruyoruz
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
        "name": current_user.name if current_user.name else current_user.username.upper(),
        "username": f"@{current_user.username.lower()}",
        "avatar": f"https://ui-avatars.com/api/?name={current_user.username}&background=random&color=fff",
        "bio": current_user.bio if current_user.bio else "TradeIn platformuna yeni katıldım",
        "postsCount": posts_count,
        "followers": followers_count,
        "following": following_count,
        "posts": formatted_posts 
    }

@app.get("/profilim/begendiklerim")
def kendi_begendiklerim(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # 🎯 Giriş yapan kullanıcının beğendiği postları, postun asıl yazarıyla birleştirerek çekiyoruz
    results = db.query(models.Post, models.User.username).\
        join(models.Like, models.Like.post_id == models.Post.id).\
        join(models.User, models.Post.user_id == models.User.id).\
        filter(models.Like.user_id == current_user.id).\
        order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        formatted_posts.append({
            "post_id": p.id, 
            "icerik": p.content, 
            "yazar": u, 
            "tarih": p.created_at,
            "likes": like_count,
            "comments": comment_count,
            "isLiked": True # Zaten beğendikleri listesi olduğu için doğrudan True
        })
    return formatted_posts


@app.get("/kullanici/{username}/begendiklerim")
def kullanici_begendiklerim(username: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
        
    # 🎯 İsmi verilen kullanıcının beğendiği postları çekiyoruz
    results = db.query(models.Post, models.User.username).\
        join(models.Like, models.Like.post_id == models.Post.id).\
        join(models.User, models.Post.user_id == models.User.id).\
        filter(models.Like.user_id == user.id).\
        order_by(models.Post.created_at.desc()).all()
    
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        
        # Sayfayı gezen giriş yapmış kullanıcı bu postu beğenmiş mi kontrolü
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
            "isLiked": is_liked
        })
    return formatted_posts


@app.put("/profilimi-guncelle")
def profilimi_guncelle(
    gelen_veri: ProfileUpdate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    current_user.name = gelen_veri.name # 🎯 YENİ
    current_user.bio = gelen_veri.bio
    db.commit()
    return {"mesaj": "Profil başarıyla güncellendi", "name": current_user.name, "bio": current_user.bio}

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

# YENİ: Bir gönderinin tüm yorumlarını listeleyen uç
@app.get("/post/{post_id}/yorumlar")
def yorumlari_getir(post_id: int, db: Session = Depends(database.get_db)):
    # Yorumları ve o yorumu yapan kullanıcıları veritabanından birleştirerek (join) çekiyoruz
    results = db.query(models.Comment, models.User).join(
        models.User, models.Comment.user_id == models.User.id
    ).filter(models.Comment.post_id == post_id).order_by(models.Comment.created_at.desc()).all()
    
    formatted_comments = []
    for c, u in results:
        formatted_comments.append({
            "id": c.id,
            "content": c.content,
            "yazar": u.username,
            "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff",
            "tarih": c.created_at
        })
        
    return formatted_comments

@app.get("/onerilen-kullanicilar")
def onerilen_kullanicilar(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_optional_current_user)):
    users = db.query(models.User).all()
    user_data = []
    
    for u in users:
        # 🎯 KİLİT NOKTA: Eğer kullanıcı giriş yapmışsa, algoritma ona "KENDİSİNİ" önermesin!
        if current_user and current_user.id == u.id:
            continue
            
        followers_count = db.query(models.Follow).filter(models.Follow.followed_id == u.id).count()
        
        # Giriş yapmış kullanıcı bu önerilen kişiyi zaten takip ediyor mu?
        is_following = False
        if current_user:
            existing_follow = db.query(models.Follow).filter(
                models.Follow.follower_id == current_user.id,
                models.Follow.followed_id == u.id
            ).first()
            if existing_follow:
                is_following = True
        
        user_data.append({
            "id": u.id,
            "name": u.name if u.name else u.username.upper(),
            "username": u.username.lower(),
            "avatar": f"https://ui-avatars.com/api/?name={u.username}&background=random&color=fff",
            "followers": followers_count,
            "is_following": is_following
        })
        
    # 🎯 ALGORİTMA: Kullanıcıları takipçi sayısına göre büyükten küçüğe sırala
    user_data.sort(key=lambda x: x["followers"], reverse=True)
    
    # 🎯 LİMİT: Sadece en popüler (ilk) 4 kullanıcıyı döndür
    return user_data[:4]