from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json

router = APIRouter(tags=["Chat"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        # 🚀 SİHİRLİ NOKTA: Son mesajları burada RAM'de tutuyoruz
        self.message_history: List[dict] = [] 

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
        # 🚀 Biri odaya girince, sayfayı yenilese bile eski mesajları ona gönder
        for msg in self.message_history:
            await websocket.send_json(msg)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        # Önce geçmişe ekle (Maksimum 100 mesaj tutsun ki sunucu şişmesin)
        self.message_history.append(message)
        if len(self.message_history) > 100:
            self.message_history.pop(0)
            
        # O an aktif olan herkese (kendisi dahil) anında gönder
        for connection in self.active_connections:
            await connection.send_json(message)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def websocket_chat(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # React'ten JSON verisi bekliyoruz: {"username": "emircan", "text": "selam"}
            data = await websocket.receive_json()
            await manager.broadcast(data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)