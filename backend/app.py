from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import cv2
import numpy as np
from skimage.metrics import peak_signal_noise_ratio as psnr, structural_similarity as ssim
import base64
import io
import os

# Docker ve yerel ortamda uyumlu çalışacak dinamik yol tanımı
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
STATIC_FOLDER = os.path.join(BASE_DIR, '..', 'frontend', 'build')
app = Flask(__name__, static_folder='frontend/build', static_url_path='/')

CORS(app)

# --- YARDIMCI FONKSİYONLAR ---
def image_stream_to_numpy(image_stream):
    in_memory_file = io.BytesIO()
    image_stream.save(in_memory_file)
    data = np.frombuffer(in_memory_file.getvalue(), dtype=np.uint8)
    img = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Desteklenmeyen veya bozuk dosya formatı. Lütfen JPEG veya PNG kullanın.")
    return img

def numpy_to_base64_string(np_array):
    _, buffer = cv2.imencode('.png', np_array)
    return base64.b64encode(buffer).decode('utf-8')

# --- YENİ YARDIMCI FONKSİYON: Görselleştirmeyi Düzeltmek İçin ---
def normalize_for_display(image_data, bits_used):
    """Düşük yoğunluklu piksel verisini 0-255 aralığına ölçeklendirir."""
    max_val = (1 << bits_used) - 1
    if max_val == 0: return image_data # 0'a bölme hatasını önle
    
    # Matematiksel ölçeklendirme yapıyoruz
    visual_img = (image_data * (255.0 / max_val)).astype(np.uint8)
    return visual_img

# --- Steganografi Fonksiyonları ---

# YÖNTEM 1: Çok-Bitli LSB (Şifresiz)
def perform_lsb_multi_bit(cover_img, secret_img, bits_to_hide):
    secret_resized = cv2.resize(cv2.cvtColor(secret_img, cv2.COLOR_BGR2GRAY), (cover_img.shape[1], cover_img.shape[0]))
    lsb_mask = (1 << bits_to_hide) - 1
    secret_bits = secret_resized & lsb_mask
    stego_img = cover_img.copy()
    cover_mask = 0xFF - lsb_mask
    stego_img[:, :, 0] = (cover_img[:, :, 0] & cover_mask) | secret_bits
    
    extracted_bits = stego_img[:, :, 0] & lsb_mask
    # Çıkarılan görseli görünür hale getiriyoruz
    extracted_img_visual = normalize_for_display(extracted_bits, bits_to_hide)

    psnr_val = psnr(cover_img, stego_img, data_range=255)
    ssim_val = ssim(cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY), cv2.cvtColor(stego_img, cv2.COLOR_BGR2GRAY), data_range=255)
    
    recovery_psnr_val = psnr(secret_resized, extracted_bits.astype(np.uint8), data_range=255)
    recovery_ssim_val = ssim(secret_resized, extracted_bits.astype(np.uint8), data_range=255)
    
    return {"stego_image": stego_img, "extracted_image": extracted_img_visual, "psnr_cover_stego": f"{psnr_val:.2f}", "ssim_cover_stego": f"{ssim_val:.4f}", "psnr_secret_extracted": f"{recovery_psnr_val:.2f}", "ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}

# YÖNTEM 2: Basit MSB (Şifresiz)
def perform_msb_simple(cover_img, secret_img):
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
    return {"stego_image": stego_img, "extracted_image": extracted_img, "psnr_cover_stego": f"{psnr_val:.2f}", "ssim_cover_stego": f"{ssim_val:.4f}", "psnr_secret_extracted": f"{recovery_psnr_val:.2f}", "ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}

# YÖNTEM 3: Çok-Bitli Şifreli LSB
def perform_lsb_encrypted(cover_img, secret_img, bits_to_hide, key):
    secret_resized = cv2.resize(cv2.cvtColor(secret_img, cv2.COLOR_BGR2GRAY), (cover_img.shape[1], cover_img.shape[0]))
    lsb_mask = (1 << bits_to_hide) - 1
    secret_bits = secret_resized & lsb_mask
    key_bits = key & lsb_mask
    encrypted_bits = secret_bits ^ key_bits
    stego_img = cover_img.copy()
    cover_mask = 0xFF - lsb_mask
    stego_img[:, :, 0] = (cover_img[:, :, 0] & cover_mask) | encrypted_bits
    
    extracted_encrypted_bits = stego_img[:, :, 0] & lsb_mask
    decrypted_bits = extracted_encrypted_bits ^ key_bits
    # Çıkarılan görseli görünür hale getiriyoruz
    extracted_img_visual = normalize_for_display(decrypted_bits, bits_to_hide)
    
    psnr_val = psnr(cover_img, stego_img, data_range=255)
    ssim_val = ssim(cv2.cvtColor(cover_img, cv2.COLOR_BGR2GRAY), cv2.cvtColor(stego_img, cv2.COLOR_BGR2GRAY), data_range=255)
    recovery_psnr_val = psnr(secret_resized, decrypted_bits.astype(np.uint8), data_range=255)
    recovery_ssim_val = ssim(secret_resized, decrypted_bits.astype(np.uint8), data_range=255)
    
    return {"stego_image": stego_img, "extracted_image": extracted_img_visual, "psnr_cover_stego": f"{psnr_val:.2f}", "ssim_cover_stego": f"{ssim_val:.4f}", "psnr_secret_extracted": f"{recovery_psnr_val:.2f}", "ssim_secret_extracted": f"{recovery_ssim_val:.4f}"}

# --- Ana API Endpoint'i (DEĞİŞİKLİK YOK) ---
@app.route('/api/process', methods=['POST'])
def process_images():
    if 'coverImage' not in request.files or 'secretImage' not in request.files:
        return jsonify({"error": "Kapak ve Gizli görsel dosyaları gerekli"}), 400
    try:
        cover_image_file = request.files['coverImage']
        secret_image_file = request.files['secretImage']
        method = request.form.get('method')
        cover_img_np = image_stream_to_numpy(cover_image_file)
        secret_img_np = image_stream_to_numpy(secret_image_file)
        results = {}
        if method == 'lsb_multi':
            bits = int(request.form.get('bits', 1))
            results = perform_lsb_multi_bit(cover_img_np, secret_img_np, bits)
        elif method == 'msb_simple':
            results = perform_msb_simple(cover_img_np, secret_img_np)
        elif method == 'lsb_encrypted':
            bits = int(request.form.get('bits', 1))
            key = int(request.form.get('key', 170))
            results = perform_lsb_encrypted(cover_img_np, secret_img_np, bits, key)
        else:
            return jsonify({"error": "Geçersiz yöntem seçildi."}), 400
        response_data = {"stego_image_b64": numpy_to_base64_string(results["stego_image"]),"extracted_image_b64": numpy_to_base64_string(results["extracted_image"]),"metrics": {"cover_vs_stego": {"psnr": results["psnr_cover_stego"],"ssim": results["ssim_cover_stego"]},"secret_vs_extracted": {"psnr": results["psnr_secret_extracted"],"ssim": results["ssim_secret_extracted"]}}}
        return jsonify(response_data)
    except (ValueError, TypeError) as ve:
        return jsonify({"error": f"Geçersiz girdi: {str(ve)}"}), 400
    except Exception as e:
        app.logger.error(f"Beklenmedik bir hata oluştu: {e}")
        return jsonify({"error": f"Sunucuda bir hata oluştu: {str(e)}"}), 500

# --- React Uygulamasını Sunmak İçin Gerekli Route'lar (DEĞİŞİKLİK YOK) ---
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(404)
def not_found(e):
    return send_from_directory(app.static_folder, 'index.html')

# --- Uygulamayı Çalıştırma Bloğu (DEĞİŞİKLİK YOK) ---
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)