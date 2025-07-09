# Steganografi Projesi

Bu proje, bir kapak görselinin içine gizli bir görselin farklı yöntemlerle saklanmasını sağlayan bir web uygulamasıdır. Proje, Python/Flask backend'i ve React frontend'inden oluşur ve Docker ile konteynerize edilmiştir.

## Gereksinimler

Bu projeyi çalıştırabilmek için bilgisayarınızda olması gereken:

* **Docker Desktop**: [Resmi sitesinden](https://www.docker.com/products/docker-desktop/) işletim sisteminize uygun versiyonu indirip kurun.

Başka hiçbir Python, Node.js veya kütüphane kurulumuna ihtiyacınız yoktur. Tüm gereksinimler Docker konteynerinin içinde mevcuttur.

## Nasıl Çalıştırılır?

1.  Projeyi bilgisayarınıza indirin ve `.zip` dosyasından çıkarın.
2.  Bilgisayarınızda **Docker Desktop** programının çalıştığından ve stabil olduğundan emin olun (genellikle 1-2 dakika sürer).
3.  İşletim sisteminize göre aşağıdaki adımları izleyin:
    * **Windows'ta:** Proje klasörünün içindeki `start.bat` dosyasına çift tıklayın.
    * **MacOS veya Linux'ta:** Terminali proje klasörünün içinde açın ve `./start.sh` komutunu çalıştırın.//henuz eklenmedi
4.  Script, imajları oluşturup konteynerleri başlatacaktır. Bu işlem ilk seferde birkaç dakika sürebilir.
5.  Script "Proje basariyla baslatildi!" mesajını verdiğinde, bir web tarayıcısı açın ve **`http://localhost:5000`** adresine gidin.

Uygulama artık kullanıma hazırdır.

## Nasıl Durdurulur?

Uygulamayı tamamen durdurmak ve arka plandaki konteynerleri kaldırmak için:

* **Windows'ta:** `stop.bat` dosyasına çift tıklayın.
* **MacOS veya Linux'ta:** Terminalde `./stop.sh` komutunu çalıştırın.