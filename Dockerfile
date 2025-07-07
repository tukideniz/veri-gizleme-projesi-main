# --- STAGE 1: React Frontend'ini Build Etmek (Node.js Atölyesi) ---
# Hafif bir Node.js imajıyla başlıyoruz ve ona "builder" adını veriyoruz.
FROM node:20-alpine AS builder

# Uygulama dosyaları için bir klasör oluşturuyoruz.
WORKDIR /app/frontend

# Önce sadece package.json dosyalarını kopyalıyoruz.
# Böylece her seferinde tüm paketleri indirmek yerine önbelleği kullanabilir.
COPY frontend/package*.json ./
RUN npm install

# Geri kalan tüm frontend kodunu kopyalıyoruz.
COPY frontend/ .

# React uygulamasını build ediyoruz.
RUN npm run build


# --- STAGE 2: Python Backend'ini Oluşturmak (Son Montaj Hattı) ---
# Hafif bir Python imajıyla başlıyoruz. Sonuçta çalışacak olan kutu bu olacak.
FROM python:3.11-slim

# Uygulama dosyaları için bir klasör oluşturuyoruz.
WORKDIR /app

# ÖNCEKİ STAGE'DEN (builder) SADECE build klasörünü kopyalıyoruz.
# Bu en sihirli kısım! Node.js ve diğer her şey geride kalıyor.
COPY --from=builder /app/frontend/build ./frontend/build

# Backend kodumuzu ve gereksinimler dosyasını kopyalıyoruz.
COPY backend/ .

# Python kütüphanelerini kuruyoruz.
RUN pip install --no-cache-dir -r requirements.txt

# Docker'a bu kutunun 5000 portunu dış dünyaya açacağını söylüyoruz.
EXPOSE 5000

# Konteyner çalıştığında çalıştırılacak olan ana komut.
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]