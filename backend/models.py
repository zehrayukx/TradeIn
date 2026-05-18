from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, DECIMAL, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    
    # 🎯 EKSİK OLAN SÜTUN BURASI:
    name = Column(String(100), nullable=True) 
    
    bio = Column(Text, nullable=True)
    profile_pic = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # İlişkiler
    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")
    assets = relationship("UserAsset", back_populates="owner", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    media_url = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # İlişkiler
    owner = relationship("User", back_populates="posts")
    likes = relationship("Like", back_populates="post", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

class UserAsset(Base):
    __tablename__ = "user_assets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    asset_name = Column(String(50), nullable=False)  
    quantity = Column(DECIMAL(18, 8), default=0.0)

    # İlişkiler
    owner = relationship("User", back_populates="assets")

class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))

    # İlişkiler
    user = relationship("User", back_populates="likes")
    post = relationship("Post", back_populates="likes")

# YENİ EKLENEN YORUM TABLOSU
class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"))
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # İlişkiler
    user = relationship("User", back_populates="comments")
    post = relationship("Post", back_populates="comments")

class Follow(Base):
    __tablename__ = "follows"

    id = Column(Integer, primary_key=True, index=True)
    follower_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    followed_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))