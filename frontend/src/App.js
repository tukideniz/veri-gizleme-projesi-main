import React, { useState } from 'react';
import './App.css'; 

function App() {
  const [method, setMethod] = useState('lsb_multi'); 
  const [bits, setBits] = useState('1'); 
  const [coverFile, setCoverFile] = useState(null);
  const [secretFile, setSecretFile] = useState(null);
  const [key, setKey] = useState('170');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Akordiyon menüleri için ayrı state'ler
  const [openExplanation, setOpenExplanation] = useState(null);
  const [openExperience, setOpenExperience] = useState(null);

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
      // Bu adresi Render'a deploy ederken kendi Render URL'in ile değiştirmeyi unutma
      const response = await fetch('http://localhost:5000/api/process', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Bilinmeyen bir sunucu hatası oluştu.');
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (id, type) => {
    if (type === 'explanation') {
      setOpenExplanation(openExplanation === id ? null : id);
    } else if (type === 'experience') {
      setOpenExperience(openExperience === id ? null : id);
    }
  };

  // --- AÇIKLAMA METİNLERİ ---
  const explanations = [
    { id: 'lsb_multi', title: 'Çok-Bitli LSB (Şifresiz)', content: "Gizli görselin her pikselinin en anlamsız bitlerini (LSB) alır. Seçtiğiniz bit sayısına göre bu veriyi, kapak görselinin piksellerinin yine aynı sayıdaki en anlamsız bitlerine doğrudan yerleştirir. Şifreleme olmadığı için hızlıdır ama verileriniz korunmaz." },
    { id: 'lsb_encrypted', title: 'Çok-Bitli LSB (Şifreli)', content: "Bu yöntem, 'Çok-Bitli LSB' yönteminin üzerine bir güvenlik katmanı ekler. Gizli görselin en anlamsız bitlerini (LSB) aldıktan sonra, bu bitleri bir şifreleme anahtarı ile XOR işlemine tabi tutar. Bu basit şifreleme, verinin kapak görseli içindeyken anlamsız görünmesini sağlar. Veriyi geri çıkarmak için aynı anahtar gereklidir." },
    { id: 'msb_simple', title: 'Basit MSB (Karşılaştırma için)', content: "Bu yöntem, eğitim amaçlıdır ve LSB ile MSB arasındaki farkı gösterir. Gizli görselin en anlamsız bitleri (LSB) yerine, en anlamlı bitlerini (MSB) alır. Bu biti kapak görselinin LSB'sine saklar. Geri çıkarılan görsel, orijinalin sadece çok kaba bir taslağı olur." }
  ];

  const experiences = [
    {
      id: 'black_image',
      title: 'Deneyim 1: Çıkarılan Görsel Neden Simsiyah Göründü?',
      content: (
        <>
          <p>
            İlk denemelerde, LSB metotlarıyla çıkarılan görseller simsiyah görünüyordu. Bunun sebebi, sadece 1 veya 2 bitlik veri çıkardığımızda, piksel değerlerinin 0-3 gibi çok küçük sayılar olmasıydı. 0-255'lik bir renk skalasında bu değerler siyaha çok yakındır.
          </p>
          <p>
            Başlangıçta kodu <code>extracted_img = extracted_bits.astype(np.uint8)</code> şeklinde yazdığımızda, bu düşük değerli pikselleri doğrudan bir görsele çevirmeye çalışıyorduk. Bu, veriyi doğru çıkarsa da görsel olarak bir anlam ifade etmiyordu.
          </p>
          <p>
            <strong>Çözüm:</strong> Bu "kısık sesli" veriyi görünür kılmak için onu matematiksel olarak ölçeklendiren bir fonksiyon yazdık. <code>normalize_for_display</code> fonksiyonu, 0-3 gibi bir aralığı alıp 0-255 aralığına "gererek" görseli parlak ve görünür hale getirdi.
          </p>
        </>
      )
    },
    {
      id: 'noise_image',
      title: 'Deneyim 2: LSB Neden "Karıncalı", MSB Neden "Net" Görüntü Veriyor?',
      content: (
        <>
            <p>
                Bu, iki yöntemin temel farkından kaynaklanır. <strong>MSB (En Anlamlı Bit)</strong>, bir görselin ana hatlarını ve yapısını belirler. MSB'yi çıkaran kodumuz <code>secret_resized &gt;&gt; 7</code> komutuyla pikselin en başındaki biti alır. Bu taslak bilgiyi <code>extracted_bits &lt;&lt; 7</code> ile tekrar görünür yaptığımızda, orijinal görselin tanınabilir bir versiyonu ortaya çıkar.
            </p>
            <p>
                <strong>LSB (En Anlamsız Bit)</strong> ise, görselin en ince detaylarını ve en yüksek frekanslı 'gürültü' bilgisini taşır. 1-bit LSB çıkardığımızda, aslında o gürültünün bir haritasını çıkarmış oluruz. Bu haritanın orijinal görselin şekliyle bir ilgisi olmadığı için de sonuç bize rastgele 'karıncalanma' gibi görünür.
            </p>
        </>
      )
    },
    {
      id: 'bit_count',
      title: 'Deneyim 3: Bit Sayısını Artırmanın Etkisi Nedir?',
      content: (
        <>
          <p>
            LSB yönteminde kullanılan bit sayısını artırdıkça, gizli görselden daha fazla veri katmanı kopyalamış oluruz. Bu işlemi yapan kod satırı şudur: <code>secret_bits = secret_resized & ((1 &lt;&lt; bits_to_hide) - 1)</code>.
          </p>
          <p>
            Eğer <code>bits_to_hide</code> değeri <strong>1</strong> ise, sadece en anlamsız bitleri alırız ve sonuç karıncalı görünür. Ama bu değeri <strong>4</strong> veya <strong>6</strong>'ya çıkardığımızda, gizli görselin ana hatlarına daha yakın olan bitleri de kopyalamaya başlarız.
          </p>
          <p>
            Bu yüzden bit sayısı arttıkça, çıkarılan görselin orijinaline daha çok benzediğini, karıncalanmanın azalıp şekillerin belirdiğini görürüz. Ancak bu durum, kapak görseli üzerinde daha fazla değişiklik yapıldığı için, "Kapak vs. Stego" PSNR/SSIM değerlerini bir miktar düşürür. Bu, kapasite ve bozulma arasındaki dengeyi gösterir.
          </p>
        </>
      )
    }
  ];

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Görüntü Steganografi Uygulaması</h1>
        <p>Görsellerin Pikselleri Arasında Veri Gizleme Sanatı</p>
      </header>

      <main className="app-main">
        <div className="card controls-card">
          <form onSubmit={handleSubmit}>
            <h2 className="section-title"><span>1</span>Görselleri Seç</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cover-file">Kapak Görseli (İçine Gizlenecek)</label>
                <input id="cover-file" type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files[0])} required />
              </div>
              <div className="form-group">
                <label htmlFor="secret-file">Gizli Görsel (Gizlenecek Olan)</label>
                <input id="secret-file" type="file" accept="image/*" onChange={(e) => setSecretFile(e.target.files[0])} required />
              </div>
            </div>

            <h2 className="section-title"><span>2</span>Yöntem ve Ayarları Belirle</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="method">Steganografi Yöntemi</label>
                <select id="method" value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="lsb_multi">Çok-Bitli LSB (Şifresiz)</option>
                  <option value="lsb_encrypted">Çok-Bitli LSB (Şifreli)</option>
                  <option value="msb_simple">Basit MSB (Karşılaştırma için)</option>
                </select>
              </div>
              {(method === 'lsb_multi' || method === 'lsb_encrypted') && (
                <div className="form-group">
                  <label htmlFor="bits">Kullanılacak Bit Sayısı</label>
                  <select id="bits" value={bits} onChange={(e) => setBits(e.target.value)}>
                    <option value="1">1 Bit (En Az Bozulma)</option>
                    <option value="2">2 Bit</option>
                    <option value="4">4 Bit (Daha Çok Kapasite)</option>
                    <option value="6">6 Bit (En Çok Kapasite)</option>
                  </select>
                </div>
              )}
              {method === 'lsb_encrypted' && (
                <div className="form-group">
                  <label htmlFor="key">Şifreleme Anahtarı (Sayı)</label>
                  <input id="key" type="number" value={key} onChange={(e) => setKey(e.target.value)} />
                </div>
              )}
            </div>
            
            <div className="form-actions">
              <button type="submit" className="button-primary" disabled={loading}>
                {loading ? 'İşleniyor...' : 'Steganografi Uygula'}
              </button>
            </div>
          </form>
          {error && <div className="error-message">{error}</div>}
        </div>

        {results && (
          <div className="card results-section">
            <h2 className="section-title text-center"><span>✓</span>Sonuçlar</h2>
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

        {/* --- YENİ EKLENEN AÇIKLAMA BÖLÜMLERİ --- */}
        <div className="explanation-wrapper">
          <div className="explanation-section">
            <h2 className="section-title text-center">Yöntemler Nasıl Çalışıyor?</h2>
            {explanations.map(item => (
              <div className="accordion-item" key={item.id}>
                <button className={`accordion-header ${openExplanation === item.id ? 'open' : ''}`} onClick={() => toggleAccordion(item.id, 'explanation')}>
                  {item.title}
                  <span className="accordion-icon">+</span>
                </button>
                <div className={`accordion-content ${openExplanation === item.id ? 'open' : ''}`}>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="explanation-section">
            <h2 className="section-title text-center">Görsel Çıkarma Asamasında Ögrendiklerim</h2>
            {experiences.map(item => (
              <div className="accordion-item" key={item.id}>
                <button className={`accordion-header ${openExperience === item.id ? 'open' : ''}`} onClick={() => toggleAccordion(item.id, 'experience')}>
                  {item.title}
                  <span className="accordion-icon">+</span>
                </button>
                <div className={`accordion-content ${openExperience === item.id ? 'open' : ''}`}>
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
      <footer className="app-footer">
        <p>&copy; {new Date().getFullYear()} Steganografi Uygulaması</p>
      </footer>
    </div>
  );
}

export default App;