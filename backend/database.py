from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base # YENİ: declarative_base artık buradan çağrılıyor

# MySQL bağlantı adresin (Kullanıcı adı, şifre ve DB adın aynı)
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:123456@localhost:3306/borsa_sosyal_medya"

# Veritabanı motorunu oluşturuyoruz
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Oturum (Session) ayarları: Her istek için güvenli bir bağlantı sağlar
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tüm modellerimizin (User, Post, Like, Comment vb.) miras alacağı temel sınıf
Base = declarative_base()

# FastAPI'nin veritabanına bağlanmasını ve işi bitince bağlantıyı kapatmasını sağlayan fonksiyon
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()