from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import database, models
from .dependencies import get_current_user, get_optional_current_user

# --- YAPAY ZEKA KÜTÜPHANELERİ ---
import os
from pathlib import Path 
from dotenv import load_dotenv
from groq import Groq  # 🚀 Resmi Groq kütüphanemiz
from utils.mail import send_social_notification_email

# .env dosyasını bul ve yükle
backend_dizini = Path(__file__).resolve().parent.parent
env_adresi = backend_dizini / ".env"
load_dotenv(dotenv_path=env_adresi, override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Yapılandırma
client = None
if GROQ_API_KEY:
    try:
        client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Groq başlatma hatası: {e}")
else:
    print("UYARI: GROQ_API_KEY bulunamadı!")

# --- LOGLAMA ---
print("\n" + "="*50)
print("   TRADEIN GROQ AI MODERASYON SİSTEMİ")
print("="*50)
print(f"🔑 Yapay Zeka Durumu: {'AKTİF (Llama 3) ✅' if client else 'PASİF (Lokal Koruma Aktif) ❌'}")
print("="*50 + "\n")

router = APIRouter(tags=["Gönderiler ve Sosyal Ağ"])

# --- PYDANTIC ŞEMALARI ---
class PostCreate(BaseModel):
    content: str
    media_url: str = None  

class PostUpdate(BaseModel):
    content: str

class CommentCreate(BaseModel):
    content: str

# --- YAPAY ZEKA MODERATÖR FONKSİYONU (HİBRİT MİMARİ) ---
async def yapay_zeka_onayi(metin: str) -> bool:
    # 1. YOL: Eğer Groq istemcisi hazırsa gerçek yapay zekayı çalıştır
    if client:
        try:
            prompt = f"""
            Sen TradeIn adlı finansal sosyal medya platformunun katı bir moderatörüsün.
            Aşağıdaki kullanıcı yorumunu incele. İçinde küfür, ağır hakaret, zorbalık, argo, nefret söylemi veya gizlenmiş kötü kelime varsa sadece 'RED' yaz.
            Eğer finans, borsa, günlük yaşamla ilgili normal, temiz veya eleştirel bir metinse sadece 'KABUL' yaz.
            Açıklama yapma, sadece KABUL veya RED yaz.
            
            Yorum Metni: "{metin}"
            """
            
            # Dünyanın en hızlı açık kaynaklı modeli Llama 3'ü çağırıyoruz
            # 🚀 MODEL İSMİNİ GÜNCEL VERSİYONA ÇEKİYORUZ:
            completion = client.chat.completions.create(
                model="llama-3.1-8b-instant",  # Groq'un şu an ücretsiz planda en çok kullanılan, aktif modeli
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=10
            )
            
            response_text = completion.choices[0].message.content
            if response_text:
                sonuc = response_text.strip().upper()
                print(f"🤖 [Groq AI Analizi]: {sonuc}")
                return "RED" not in sonuc
                
        except Exception as e:
            print(f"⚠️ Groq API Hatası, Lokal Korumaya Geçiliyor... Detay: {e}")
            # API'de bir sorun olursa alt satırdaki yerel filtreye pasla
            pass

    # 2. YOL (FALLBACK): API yoksa veya çökerse lokal regex koruması devreye girer
    temiz_metin = metin.lower().strip()
    kara_liste = ["salak", "beyinsiz", "gerizekali", "gerizekalı", "aptal", "piç", "orospu", "amk"]
    for kelime in kara_liste:
        if kelime in temiz_metin:
            print(f"🚨 [Lokal Filtre]: Argo tespit edildi! Kelime: '{kelime}'")
            return False
            
    return True
# --- UÇLAR (ENDPOINTS) ---

# --- UÇLAR (ENDPOINTS) ---

@router.post("/post-olustur")
async def post_olustur(gelen_veri: PostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # 🚀 YENİ: Post içeriği veritabanına kaydedilmeden önce yapay zekaya/filtreye soruluyor
    is_clean = await yapay_zeka_onayi(gelen_veri.content)
    if not is_clean:
        raise HTTPException(
            status_code=400, 
            detail="Gönderiniz topluluk kurallarımıza (argo/hakaret/küfür) aykırı olduğu için yapay zeka tarafından engellendi."
        )

    new_post = models.Post(user_id=current_user.id, content=gelen_veri.content, media_url=gelen_veri.media_url)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return {"mesaj": "Post yayınlandı!", "yazar": current_user.username, "post_id": new_post.id}


@router.put("/post/{post_id}")
async def post_guncelle(post_id: int, gelen_veri: PostUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post bulunamadı")
    if post.user_id != current_user.id: raise HTTPException(status_code=403, detail="Yetkiniz yok")
    
    # 🚀 YENİ: Düzenlenen yeni içerik de yapay zeka kontrolünden geçiyor
    is_clean = await yapay_zeka_onayi(gelen_veri.content)
    if not is_clean:
        raise HTTPException(
            status_code=400, 
            detail="Düzenlediğiniz içerik topluluk kurallarımıza (argo/hakaret/küfür) aykırı olduğu için yapay zeka tarafından engellendi."
        )

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
        # Beğeni başarıyla eklendiğinde (new_like commit edildikten hemen sonra):
    if post.user_id != current_user.id:
        yeni_bildirim = models.Notification(
            user_id=post.user_id,
            actor_id=current_user.id,
            type="like",
            post_id=post.id
        )
        db.add(yeni_bildirim)
        db.commit()
        hedef_kullanici = db.query(models.User).filter(models.User.id == post.user_id).first()
        if hedef_kullanici and hedef_kullanici.email:
            send_social_notification_email(
                to_email=hedef_kullanici.email,
                actor_name=current_user.username,
                notification_type="like",
                post_preview=post.content[:40] + "..."
            )
        return {"mesaj": "Post beğenildi", "begenildi": True}

@router.post("/post/{post_id}/yorum")
async def yorum_yap(post_id: int, yorum: CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post: raise HTTPException(status_code=404, detail="Post bulunamadı")
    
    # Yorum veritabanına girmeden önce yapay zekaya soruluyor
    is_clean = await yapay_zeka_onayi(yorum.content)
    if not is_clean:
        raise HTTPException(
            status_code=400, 
            detail="Yorumunuz topluluk kurallarımıza (argo/hakaret) aykırı olduğu için yapay zeka tarafından engellendi."
        )
    
    new_comment = models.Comment(post_id=post_id, user_id=current_user.id, content=yorum.content)
    db.add(new_comment)
    db.commit()
    if post.user_id != current_user.id: # Kendi postuna yorum yapınca bildirim gitmesin
        yeni_bildirim = models.Notification(
            user_id=post.user_id, # Postun asıl sahibi (Hedef)
            actor_id=current_user.id, # Yorumu yapan (Aktör)
            type="comment",
            post_id=post.id,
            comment_id=new_comment.id
        )
        db.add(yeni_bildirim)
        db.commit()
        hedef_kullanici = db.query(models.User).filter(models.User.id == post.user_id).first()
        if hedef_kullanici and hedef_kullanici.email:
            send_social_notification_email(
                to_email=hedef_kullanici.email,
                actor_name=current_user.username,
                notification_type="comment",
                post_preview=post.content[:40] + "...",
                comment_preview=new_comment.content
            )
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
    # Takip satırı veritabanına eklendiğinde (new_follow commit edildikten hemen sonra):
    yeni_bildirim = models.Notification(
        user_id=takip_edilecek_id, # Takip edilen kişi (Hedef)
        actor_id=current_user.id, # Takip butonuna basan (Aktör)
        type="follow"
    )
    db.add(yeni_bildirim)
    db.commit()
    hedef_kullanici = db.query(models.User).filter(models.User.id == takip_edilecek_id).first()
    if hedef_kullanici and hedef_kullanici.email:
        send_social_notification_email(
            to_email=hedef_kullanici.email,
            actor_name=current_user.username,
            notification_type="follow"
        )
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

@router.delete("/post/yorum-sil/{yorum_id}")
def yorum_sil(yorum_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    yorum = db.query(models.Comment).filter(models.Comment.id == yorum_id).first()
    if not yorum: 
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    if yorum.user_id != current_user.id: 
        raise HTTPException(status_code=403, detail="Bu yorumu silme yetkiniz yok")
    db.delete(yorum)
    db.commit()
    return {"mesaj": "Yorum başarıyla silindi"}