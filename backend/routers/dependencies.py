from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import database, models, auth

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    hata_mesaji = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kimlik doğrulanamadı", headers={"WWW-Authenticate": "Bearer"})
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None: raise hata_mesaji
        user_id = int(user_id_str)
    except JWTError: raise hata_mesaji
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None: raise hata_mesaji
    return user

def get_optional_current_user(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(database.get_db)):
    if not token: return None
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None: return None
        user_id = int(user_id_str)
    except JWTError: return None
    return db.query(models.User).filter(models.User.id == user_id).first()