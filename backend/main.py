from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine

# YENİ: Parçalanmış router'ları çağırıyoruz
from routers import auth_routes, posts, profiles, portfolio, alarms, settings

# Veritabanı tablolarını oluştur
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TradeIn Borsa API")

# CORS (React bağlantısı için)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# 🚀 Bütün parçaları ana motora bağlıyoruz
app.include_router(auth_routes.router)
app.include_router(posts.router)
app.include_router(profiles.router)
app.include_router(portfolio.router)
app.include_router(alarms.router)
app.include_router(settings.router)

@app.get("/")
def root():
    return {"mesaj": "TradeIn Sistemine Hoşgeldiniz, Motor Çalışıyor! 🚀"}