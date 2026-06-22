from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import notifications
from routers import auth_routes, posts, profiles, portfolio, alarms, settings

# main.py dosyasının üst kısımlarındaki import alanına:
from routers import chat 

# main.py içinde app.include_router() komutlarının olduğu yere şunu ekle:


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TradeIn Borsa API")



app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)
app.include_router(chat.router)
app.include_router(auth_routes.router)
app.include_router(posts.router)
app.include_router(profiles.router)
app.include_router(portfolio.router)
app.include_router(alarms.router)
app.include_router(settings.router)
app.include_router(notifications.router)

@app.get("/")
def root():
    return {"mesaj": "TradeIn Sistemine Hoşgeldiniz, Motor Çalışıyor! 🚀"}