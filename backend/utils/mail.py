# backend/utils/mail.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def send_alarm_email(to_email: str, asset: str, target_price: float, current_price: float, condition: str):
    SENDER_EMAIL = os.getenv("EMAIL_ADDRESS")
    APP_PASSWORD = os.getenv("EMAIL_PASSWORD")
    durum_metni = "Üzerine Çıktı " if condition.lower() == "above" else "Altına Düştü "
    subject = f"TradeIn Alarm: {asset} Hedefe Ulaştı!"
    body = f"Merhaba,\n\nTradeIn alarmı tetiklendi!\n Varlık: {asset}\n Hedeflenen: {target_price}\n Tetiklenme: {current_price}\n Koşul: {durum_metni}"
    
    msg = MIMEMultipart()
    msg['From'] = SENDER_EMAIL
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain', 'utf-8'))
    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.send_message(msg)
        print(f"📩 [SMTP ALARM]: E-posta başarıyla '{to_email}' adresine gönderildi.")
    except Exception as e: print(f"❌ E-posta hatası: {e}")


def send_social_notification_email(to_email: str, actor_name: str, notification_type: str, post_preview: str = None, comment_preview: str = None):
    SENDER_EMAIL = os.getenv("EMAIL_ADDRESS")
    APP_PASSWORD = os.getenv("EMAIL_PASSWORD")
    
    if not SENDER_EMAIL or not APP_PASSWORD:
        return

    if notification_type == "follow":
        subject = f"Bildirim: TradeIn: {actor_name} seni takip etmeye başladı!"
        action_text = "seni takip etmeye başladı."
        details_html = ""
    elif notification_type == "like":
        subject = f"Bildirim: TradeIn: {actor_name} gönderini beğendi!"
        action_text = "gönderini beğendi."
        details_html = f"<p style='color: #64748b; font-style: italic; margin-top: 8px;'>\"{post_preview}\"</p>"
    elif notification_type == "comment":
        subject = f"Bildirim: TradeIn: {actor_name} gönderine yorum yaptı!"
        action_text = "gönderine yorum yaptı."
        details_html = f"""
        <p style='color: #64748b; font-size: 13px; margin-bottom: 4px;'><b>Gönderiniz:</b> \"{post_preview}\"</p>
        <p style='color: #1e293b; background-color: #f1f5f9; padding: 10px; border-radius: 8px; font-style: italic; margin-top: 4px;'>
            <b>Yorum:</b> \"{comment_preview}\"
        </p>
        """
    else: return

    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0;">
                <h2 style="color: #2563eb; text-align: center;">TradeIn</h2>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;">
                <p>Merhaba,</p>
                <p><b>{actor_name}</b> {action_text}</p>
                {details_html}
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        print(f"✅ [SMTP SOSYAL]: {notification_type} maili {to_email} adresine gitti!")
    except Exception as e: print(f"❌ [SMTP SOSYAL HATA]: {e}")



def send_reset_code_email(to_email: str, code: str):
    SENDER_EMAIL = os.getenv("EMAIL_ADDRESS")
    APP_PASSWORD = os.getenv("EMAIL_PASSWORD")
    
    if not SENDER_EMAIL or not APP_PASSWORD:
        print("❌ HATA: .env dosyasında EMAIL_ADDRESS veya EMAIL_PASSWORD bulunamadı!")
        return

    subject = "TradeIn - Şifre Sıfırlama Kodunuz"

    # Senin tasarım diline uygun, premium görünümlü HTML şifre sıfırlama şablonu
    html_content = f"""
    <html>
        <body style="font-family: Arial, sans-serif; background-color: #f8fafc; padding: 20px;">
            <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center;">
                <h2 style="color: #2563eb;">TradeIn</h2>
                <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;">
                <p style="color: #334155; font-size: 16px; text-align: left;">Merhaba,</p>
                <p style="color: #334155; font-size: 15px; text-align: left;">Hesabınızın şifresini sıfırlamak için doğrulama kodunuz aşağıdadır:</p>
                
                <div style="background-color: #eff6ff; border: 1px dashed #3b82f6; padding: 15px; border-radius: 8px; margin: 25px 0; font-size: 28px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8;">
                    {code}
                </div>
                
                <p style="color: #64748b; font-size: 13px; text-align: left;">Bu kod <b>10 dakika</b> boyunca geçerlidir. Eğer bu şifre sıfırlama talebini siz yapmadıysanız lütfen bu e-postayı görmezden gelin.</p>
            </div>
        </body>
    </html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = SENDER_EMAIL
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(SENDER_EMAIL, APP_PASSWORD)
            server.sendmail(SENDER_EMAIL, to_email, msg.as_string())
        print(f"✅ [SMTP SIFRE SIFIRLAMA]: Kod {to_email} adresine gönderildi!")
    except Exception as e: 
        print(f"❌ [SMTP SIFRE HATA]: {e}")