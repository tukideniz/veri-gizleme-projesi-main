@echo off
REM Bu script, Docker Compose kullanarak projeyi başlatır.

echo Steganografi projesi Docker konteynerleri olusturuluyor ve baslatiliyor...
echo.
echo Bu islem, ilk calistirmada bilgisayarinizin hizina gore birkac dakika surebilir.
echo Lutfen bu pencereyi kapatmayin.
echo.

REM Docker imajlarını build eder ve konteynerleri arka planda başlatır.
docker-compose up --build -d

echo.
echo Proje basariyla baslatildi!
echo.
echo Arayuze ulasmak icin lutfen bir tarayici acin ve su adrese gidin:
echo http://localhost:5000
echo.
echo Projeyi durdurmak icin ayni klasordeki 'stop.bat' dosyasini calistirabilirsiniz.
echo.

REM Kullanıcının mesajı görmesi için pencereyi açık tutar.
pause

@echo off
echo Proje konteynerleri durduruluyor ve kaldiriliyor...
docker-compose down
echo.
echo Proje basariyla durduruldu.
echo.
pause
