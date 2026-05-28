from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from decimal import Decimal
import database, models
from .dependencies import get_current_user

router = APIRouter(tags=["Portföy"])

class AssetAdd(BaseModel):
    asset_name: str
    quantity: Decimal

@router.post("/portfoy-ekle")
def portfoy_ekle(gelen_veri: AssetAdd, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    existing_asset = db.query(models.UserAsset).filter(models.UserAsset.user_id == current_user.id, models.UserAsset.asset_name == gelen_veri.asset_name).first()
    if existing_asset:
        existing_asset.quantity += gelen_veri.quantity
        db.commit()
        db.refresh(existing_asset)
        return {"mesaj": f"{gelen_veri.asset_name} güncellendi.", "yeni_miktar": existing_asset.quantity}
    new_asset = models.UserAsset(user_id=current_user.id, asset_name=gelen_veri.asset_name, quantity=gelen_veri.quantity)
    db.add(new_asset)
    db.commit()
    return {"mesaj": f"{gelen_veri.asset_name} eklendi!"}

@router.get("/portfoyum")
def portfoyum(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    assets = db.query(models.UserAsset).filter(models.UserAsset.user_id == current_user.id).all()
    if not assets: return {"mesaj": "Portföyün boş."}
    return assets

@router.delete("/portfoy-sil/{asset_id}")
def portfoy_sil(asset_id: int, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    asset = db.query(models.UserAsset).filter(models.UserAsset.id == asset_id, models.UserAsset.user_id == current_user.id).first()
    if not asset: raise HTTPException(status_code=404, detail="Varlık bulunamadı")
    db.delete(asset)
    db.commit()
    return {"mesaj": "Varlık silindi"}