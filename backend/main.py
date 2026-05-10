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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

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
        return {"hata": "Kullanıcı adı veya şifre hatalı!"}
    
    access_token = auth.create_access_token(data={"sub": str(user.id)})
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/kullanicilari-listele")
def kullanicilari_listele(db: Session = Depends(database.get_db)):
    return db.query(models.User).all()


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
def populer_postlar(db: Session = Depends(database.get_db)):
    results = db.query(models.Post, models.User.username).join(models.User).all()
    
    formatted_posts = [{"post_id": p.id, "icerik": p.content, "yazar": u, "tarih": p.created_at} for p, u in results]
    return formatted_posts


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
        return {"mesaj": "Zaten takip ediyorsun"}

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