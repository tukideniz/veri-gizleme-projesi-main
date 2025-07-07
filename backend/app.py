from flask import Flask, request, jsonify, send_from_directory # send_from_directory eklendi
from flask_cors import CORS
import cv2
import numpy as np
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim
import base64
import io
import os # os kütüphanesi eklendi

# --- DEĞİŞİKLİK 1: Flask uygulamasını 'build' klasörünü tanıyacak şekilde başlat ---
# Flask'a diyoruz ki, statik dosyaları (React'in CSS ve JS dosyaları) 
# ../frontend/build/static klasöründen sun.
app = Flask(__name__, static_folder='frontend/build', static_url_path='/')

# Geliştirme sırasında CORS hala gerekli olabilir, o yüzden kalmasında sakınca yok.
CORS(app)

# --- SENİN STEGANOGRAFİ FONKSİYONLARIN (DEĞİŞİKLİK YOK) ---
# ...
# Buradaki perform_lsb_msb_encrypted, perform_lsb_n_bit_encrypted,
# perform_lsb_simple ve diğer yardımcı fonksiyonların hepsi aynı kalacak.
# O yüzden uzun olmasın diye buraya tekrar eklemiyorum.
# Kendi dosyadaki mevcut fonksiyonların burada olduğunu varsayalım.
def image_stream_to_numpy(image_stream):
    in_memory_file = io.BytesIO()
    image_stream.save(in_memory_file)
    data = np.frombuffer(in_memory_file.getvalue(), dtype=np.uint8)
    return cv2.imdecode(data, cv2.IMREAD_COLOR)

def numpy_to_base64_string(np_array):
    _, buffer = cv2.imencode('.png', np_array)
    return base64.b64encode(buffer).decode('utf-8')

def perform_lsb_msb_encrypted(cover_img, secret_img, key):
    secret_resized = cv2.resize(cv2.cvtColor(secret_img, cv2.COLOR_BGR2GRAY), (cover_img.shape[1], cover_img.shape[0]))
    secret_msb_plane = (secret_resized >> 7)
    key_bit = key & 1
    encrypted_msb = secret_msb_plane ^ key_bit
    stego_img = cover_img.copy()
    stego_img[:, :, 0] = (cover_img[:, :, 0] & 0xFE) | encrypted_msb
    extracted_encrypted_msb = stego_img[:, :, 0] & 0x01
    decrypted_msb = extracted_encrypted_msb ^ key_bit
    extracted_img = (decrypted_msb << 7).astype(np.uint8)
    psnr_val = psnr(cover_img, stego_img, data_range=255)
    ssim_val = ssim(cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY), cv2.cvtColor(stego_img, cv2.COLOR_BGR2GRAY), data_range=255)
    recovery_psnr_val = psnr(secret_resized, extracted_img, data_range=255)
    recovery_ssim_val = ssim(secret_resized, extracted_img, data_range=255)
    return {"stego_image": stego_img,"extracted_image": extracted_img,"psnr_cover_stego": f"{psnr_val:.2f}","ssim_cover_stego": f"{ssim_val:.4f}","psnr_secret_extracted": f"{recovery_psnr_val:.2f}","ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}

def perform_lsb_n_bit_encrypted(cover_img, secret_img, bits_to_hide, key):
    secret_resized = cv2.resize(cv2.cvtColor(secret_img, cv2.COLOR_BGR2GRAY), (cover_img.shape[1], cover_img.shape[0]))
    key_bits = key & ((1 << bits_to_hide) - 1)
    secret_bits = secret_resized >> (8 - bits_to_hide)
    encrypted_bits = secret_bits ^ key_bits
    stego_img = cover_img.copy()
    mask = 0xFF - ((1 << bits_to_hide) - 1)
    stego_img[:, :, 0] = (cover_img[:, :, 0] & mask) | encrypted_bits
    extracted_encrypted = stego_img[:, :, 0] & ((1 << bits_to_hide) - 1)
    decrypted_bits = extracted_encrypted ^ key_bits
    extracted_img = (decrypted_bits << (8 - bits_to_hide)).astype(np.uint8)
    psnr_val = psnr(cover_img, stego_img, data_range=255)
    ssim_val = ssim(cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY), cv2.cvtColor(stego_img, cv2.COLOR_BGR2GRAY), data_range=255)
    recovery_psnr_val = psnr(secret_resized, extracted_img, data_range=255)
    recovery_ssim_val = ssim(secret_resized, extracted_img, data_range=255)
    return {"stego_image": stego_img,"extracted_image": extracted_img,"psnr_cover_stego": f"{psnr_val:.2f}","ssim_cover_stego": f"{ssim_val:.4f}","psnr_secret_extracted": f"{recovery_psnr_val:.2f}","ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}

def perform_lsb_simple(cover_img, secret_img):
    secret_resized = cv2.resize(cv2.cvtColor(secret_img, cv2.COLOR_BGR2GRAY), (cover_img.shape[1], cover_img.shape[0]))
    msb_bits = secret_resized >> 7
    stego_img = cover_img.copy()
    stego_img[:, :, 0] = (cover_img[:, :, 0] & 0xFE) | msb_bits
    extracted_bits = stego_img[:, :, 0] & 0x01
    extracted_img = (extracted_bits << 7).astype(np.uint8)
    psnr_val = psnr(cover_img, stego_img, data_range=255)
    ssim_val = ssim(cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY), cv2.cvtColor(stego_img, cv2.COLOR_BGR2GRAY), data_range=255)
    recovery_psnr_val = psnr(secret_resized, extracted_img, data_range=255)
    recovery_ssim_val = ssim(secret_resized, extracted_img, data_range=255)
    return {"stego_image": stego_img,"extracted_image": extracted_img,"psnr_cover_stego": f"{psnr_val:.2f}","ssim_cover_stego": f"{ssim_val:.4f}","psnr_secret_extracted": f"{recovery_psnr_val:.2f}","ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}
# ...

# --- API ENDPOINT (DEĞİŞİKLİK YOK) ---
@app.route('/api/process', methods=['POST'])
def process_images():
    # ... Bu fonksiyonun içi de tamamen aynı ...
    if 'coverImage' not in request.files or 'secretImage' not in request.files:
        return jsonify({"error": "Kapak ve Gizli görsel dosyaları gerekli"}), 400
    cover_image_file = request.files['coverImage']
    secret_image_file = request.files['secretImage']
    method = request.form.get('method')
    cover_img_np = image_stream_to_numpy(cover_image_file)
    secret_img_np = image_stream_to_numpy(secret_image_file)
    if cover_img_np is None or secret_img_np is None:
        return jsonify({"error": "Görsel dosyaları okunamadı veya bozuk."}), 400
    results = {}
    try:
        if method == 'method1':
            key = int(request.form.get('key', 170))
            results = perform_lsb_msb_encrypted(cover_img_np, secret_img_np, key)
        elif method == 'method2':
            key = int(request.form.get('key', 170))
            bits = int(request.form.get('bits', 3))
            results = perform_lsb_n_bit_encrypted(cover_img_np, secret_img_np, bits, key)
        elif method == 'method3':
            results = perform_lsb_simple(cover_img_np, secret_img_np)
        else:
            return jsonify({"error": "Geçersiz yöntem seçildi."}), 400
        response_data = {"stego_image_b64": numpy_to_base64_string(results["stego_image"]),"extracted_image_b64": numpy_to_base64_string(results["extracted_image"]),"metrics": {"cover_vs_stego": {"psnr": results["psnr_cover_stego"],"ssim": results["ssim_cover_stego"]},"secret_vs_extracted": {"psnr": results["psnr_secret_extracted"],"ssim": results["ssim_secret_extracted"]}}}
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": f"İşlem sırasında bir hata oluştu: {str(e)}"}), 500

# --- DEĞİŞİKLİK 2: React Uygulamasını Sunmak İçin Route Ekle ---
# Bu route, /api/ ile başlamayan TÜM istekleri yakalar ve React'in
# ana HTML dosyasını (index.html) gönderir.
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)