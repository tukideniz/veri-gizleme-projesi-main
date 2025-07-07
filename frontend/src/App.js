import React, { useState } from 'react';
import './App.css'; 

function App() {
  const [coverFile, setCoverFile] = useState(null);
  const [secretFile, setSecretFile] = useState(null);
  const [method, setMethod] = useState('method1');
  const [key, setKey] = useState('170');
  const [bits, setBits] = useState('3');
  
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const coverPreview = coverFile ? URL.createObjectURL(coverFile) : null;
  const secretPreview = secretFile ? URL.createObjectURL(secretFile) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!coverFile || !secretFile) {
      setError('Lütfen hem kapak hem de gizli görseli seçin.');
      return;
    }
    
    setLoading(true);
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('coverImage', coverFile);
    formData.append('secretImage', secretFile);
    formData.append('method', method);
    formData.append('key', key);
    formData.append('bits', bits);

    try {
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Bilinmeyen bir sunucu hatası oluştu.');
      }
      
      setResults(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Görüntü Steganografi Uygulaması</h1>
        <p>Rukiye Deniz Yelken</p>
      </header>

      <main className="app-main">
        <div className="card controls-card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title">1. Görselleri Yükle</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cover-file">Kapak Görseli</label>
                <input id="cover-file" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} required />
              </div>
              <div className="form-group">
                <label htmlFor="secret-file">Gizli Görsel</label>
                <input id="secret-file" type="file" accept="image/*" onChange={(e) => setSecretFile(e.target.files[0])} required />
              </div>
            </div>

            <h2 className="section-title">2. Ayarları Yapılandır</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="method">Steganografi Yöntemi</label>
                <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="method1">1-Bit Şifreli LSB</option>
                  <option value="method2">N-Bit Şifreli LSB</option>
                  <option value="method3">1-Bit Basit LSB (Şifresiz)</option>
                </select>
              </div>
              {method === 'method2' && (
                <div className="form-group">
                  <label htmlFor="bits">Bit Sayısı</label>
                  <select id="bits" value={bits} onChange={(e) => setBits(e.target.value)}>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                  </select>
                </div>
              )}
              {(method === 'method1' || method === 'method2') && (
                <div className="form-group">
                  <label htmlFor="key">Şifreleme Anahtarı</label>
                  <input id="key" type="number" value={key} onChange={(e) => setKey(e.target.value)} />
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={loading}>
                {loading ? 'İşleniyor...' : '3. İşlemi Başlat'}
              </button>
            </div>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>

        {results && (
          <div className="results-section">
            <h2 className="section-title text-center">Sonuçlar</h2>
            <div className="results-grid">
              <div className="card image-card">
                <img src={coverPreview} alt="Orijinal Kapak" />
                <h3>Kapak Görseli (Orijinal)</h3>
              </div>
              <div className="card image-card">
                <img src={secretPreview} alt="Orijinal Gizli" />
                <h3>Gizli Görsel (Orijinal)</h3>
              </div>
              <div className="card image-card">
                <img src={`data:image/png;base64,${results.stego_image_b64}`} alt="Stego Sonucu" />
                <h3>Stego Görseli (Gizlenmiş)</h3>
              </div>
              <div className="card image-card">
                <img src={`data:image/png;base64,${results.extracted_image_b64}`} alt="Çıkarılan Sonuç" />
                <h3>Çıkarılan Görsel</h3>
              </div>
            </div>
            <div className="card metrics-card">
              <h2 className="section-title">Performans Metrikleri</h2>
              <div className="metrics-content">
                <div className="metric-group">
                  <h4>Kapak vs. Stego</h4>
                  <p><strong>PSNR:</strong> {results.metrics.cover_vs_stego.psnr} dB</p>
                  <p><strong>SSIM:</strong> {results.metrics.cover_vs_stego.ssim}</p>
                </div>
                <div className="metric-group">
                  <h4>Gizli vs. Çıkarılan</h4>
                  <p><strong>PSNR:</strong> {results.metrics.secret_vs_extracted.psnr} dB</p>
                  <p><strong>SSIM:</strong> {results.metrics.secret_vs_extracted.ssim}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Steganografi Uygulaması. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}

export default App;