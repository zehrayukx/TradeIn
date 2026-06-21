from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import database, models
from .dependencies import get_current_user, get_optional_current_user
from sqlalchemy import or_ # 🚀 En tepede or_ fonksiyonunu import etmeyi unutma!
import os
import json
from groq import Groq # 🚀 1. ADIM: Groq kütüphanesini import et
from fastapi import BackgroundTasks

# 🎯 AKILLI KATEGORİ SÖZLÜĞÜ (Keyword Mapping)
# Kullanıcı soldaki anahtara bastığında, sağdaki dizideki tüm kelimeler aranır.
FINANCE_CATEGORY_MAP = {
    "bitcoin": ["bitcoin", "btc", "ethereum", "eth", "kripto", "crypto", "solana", "altcoin","dogecoin","xrp","cardano","ada","polkadot","dot","binancecoin","bnb","avalanche","avax","chainlink","link","litecoin","ltc"],
    "borsa": ["borsa", "bist", "bist100", "hisse", "halka arz", "spk", "temettü"],
    "dolar": ["dolar", "usd", "yeşilçete", "fed"],
    "euro": ["euro", "eur", "ecb"],
    "altın": ["altın", "gold", "ons", "gram altın", "xau"],
    "gümüş": ["gümüş", "silver", "xag"]
}

# --- YAPAY ZEKA KÜTÜPHANELERİ ---

from pathlib import Path 
from dotenv import load_dotenv
from groq import Groq  # 🚀 Resmi Groq kütüphanemiz
from utils.mail import send_social_notification_email


# .env dosyasını bul ve yükle
backend_dizini = Path(__file__).resolve().parent.parent
env_adresi = backend_dizini / ".env"
load_dotenv(dotenv_path=env_adresi, override=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


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

class SifreSifirlaSchema(BaseModel):
    email: str
    yeni_sifre: str

# --- PYDANTIC ŞEMALARI ---
class PostCreate(BaseModel):
    content: str
    media_url: str = None  

class PostUpdate(BaseModel):
    content: str

class CommentCreate(BaseModel):
    content: str
    # 🚀 1. Yeni Şema (Dosyanın üst kısımlarındaki şemaların arasına veya direkt endpointin üstüne ekleyebilirsin)
class CommentUpdate(BaseModel):
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
    kara_liste = []
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
    # Orijinal kullanıcı join sorgun
    query = db.query(models.Post, models.User.username).join(models.User)
    results = query.all()
    
    # 🚀 3. ADIM: EĞER HASHTAG (KATEGORİ) SEÇİLİYSE YAPAY ZEKAYI TETİKLE
    if hashtag and results:
        # Groq'a göndermek üzere tüm postların sadece id ve içeriklerini minik bir listeye alıyoruz
        posts_for_ai = [{"id": p.id, "content": p.content} for p, u in results]
        
        system_prompt = (
            "Sen gelişmiş bir finansal analist yapay zekasısın. Sana gönderilen sosyal medya post listesini, "
            "kullanıcının seçtiği finansal kategoriye göre analiz etmelisin. Görevin, içerik olarak (doğrudan veya anlamsal olarak) "
            "bu kategoriyle ilişkili olan postların ID'lerini ayıklamaktır.\n\n"
            "ZORUNLU KURAL: Çıktın SADECE ve SADECE şu formatta bir JSON olmalıdır, asla açıklama yazma:\n"
            '{"matched_ids": [1, 4, 7]}'
        )
        
        user_prompt = f"Hedef Finansal Kategori: {hashtag}\nPost Listesi: {json.dumps(posts_for_ai, ensure_ascii=False)}"
        
        try:
            # Groq üzerinden en hızlı model olan Llama 3'ü (veya benzerini) çağırıyoruz
            chat_completion = groq_client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama3-8b-8192", # ya da kullandığın aktif groq modeli
                temperature=0.0, # Tutarlı ve kesin yanıt vermesi için 0 yapıyoruz
                response_format={"type": "json_object"} # Yanıtın kesinlikle JSON gelmesini zorunlu kılıyoruz
            )
            
            # Gelen yanıtı parse et ve eşleşen ID listesini al
            ai_response = json.loads(chat_completion.choices[0].message.content)
            matched_ids = ai_response.get("matched_ids", [])
            
            # Veritabanı sonuçlarımızı, yapay zekanın onay verdiği ID'lere göre filtrele!
            results = [(p, u) for p, u in results if p.id in matched_ids]
            
        except Exception as e:
            print(f"Groq Filtreleme Hatası: {e}")
            # Eğer yapay zeka katmanı anlık bir problem yaşarsa sistem çökmesin diye 
            # klasik kelime eşleşmesi filtresine (Fallback) düşüyoruz:
            results = [(p, u) for p, u in results if hashtag.lower() in p.content.lower()]

    # 🔒 4. ADIM: Senin Orijinal Döngün ve Formatlaman (Milimetrik olarak korundu)
    formatted_posts = []
    for p, u in results:
        like_count = db.query(models.Like).filter(models.Like.post_id == p.id).count()
        comment_count = db.query(models.Comment).filter(models.Comment.post_id == p.id).count()
        is_liked = bool(current_user and db.query(models.Like).filter(models.Like.post_id == p.id, models.Like.user_id == current_user.id).first())
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

@router.post("/post/{post_id}/begen")
def post_begen(
    post_id: int, 
    background_tasks: BackgroundTasks, # 2. Parametre olarak ekle
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
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
        
        # Bildirim SADECE başkasının gönderisini beğenirsek gitsin
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
                # 3. E-POSTAYI ARKA PLANA GÖNDER!
                background_tasks.add_task(
                    send_social_notification_email,
                    to_email=hedef_kullanici.email,
                    actor_name=current_user.username,
                    notification_type="like",
                    post_preview=post.content[:40] + "..."
                )
                
        # 🚀 DÜZELTME: Return işlemi if bloğundan bağımsız, her halükarda dönecek!
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
    


# 🚀 2. Yorum Güncelleme Endpoint'i
@router.put("/post/yorum-guncelle/{yorum_id}")
async def yorum_guncelle(yorum_id: int, gelen_veri: CommentUpdate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Yorumu bul
    yorum = db.query(models.Comment).filter(models.Comment.id == yorum_id).first()
    if not yorum: 
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    
    # 2. Yetki kontrolü (Sadece yorumun sahibi düzenleyebilir)
    if yorum.user_id != current_user.id: 
        raise HTTPException(status_code=403, detail="Bu yorumu düzenleme yetkiniz yok")
    
    # 3. YZ Koruması: Yeni yorum içeriği de Groq onayından geçmeli!
    is_clean = await yapay_zeka_onayi(gelen_veri.content)
    if not is_clean:
        raise HTTPException(
            status_code=400, 
            detail="Düzenlediğiniz yorum topluluk kurallarımıza aykırı olduğu için yapay zeka tarafından engellendi."
        )
    
    # 4. Güncelle ve kaydet
    yorum.content = gelen_veri.content
    db.commit()
    
    return {"mesaj": "Yorum başarıyla güncellendi", "content": yorum.content}


@router.delete("/post/sil/{post_id}")
def post_sil(post_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # 1. Gönderiyi veritabanında arıyoruz
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    
    # 2. Gönderi var mı kontrolü
    if not post: 
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı")
        
    # 3. Yetki Kontrolü: Sadece postun sahibi silebilir
    if post.user_id != current_user.id: 
        raise HTTPException(status_code=403, detail="Bu gönderiyi silme yetkiniz yok!")
        
    # 4. Silme ve Kaydetme
    db.delete(post)
    db.commit()
    
    return {"mesaj": "Gönderi ve bağlı tüm etkileşimler başarıyla silindi"}

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

@router.post("/sifre-sifirla")
def sifre_sifirla(data: SifreSifirlaSchema, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == data.email).first()
    if not db_user: raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    db_user.password = get_password_hash(data.yeni_sifre)
    db.commit()
    return {"message": "Şifre başarıyla güncellendi ve hashlendi!"}