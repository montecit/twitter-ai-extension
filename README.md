# Twitter AI Yanıt Asistanı

Twitter (X) platformu için yapay zeka destekli yanıt oluşturma eklentisi.

## Özellikler

- Tweet'leri seçip sağ tık menüsü ile AI yanıt oluşturma
- Google AI (Gemini) ve Huggingface API desteği
- Farklı yanıt stilleri (Resmi, Samimi, Profesyonel)
- Türkçe dil desteği
- API test arayüzü
- Güvenli API anahtarı yönetimi

## Kurulum

1. Firefox tarayıcınızda `about:debugging` sayfasına gidin
2. "This Firefox" sekmesine tıklayın
3. "Load Temporary Add-on" butonuna tıklayın
4. Eklenti dizinindeki `manifest.json` dosyasını seçin

## Kullanım

1. API Ayarları:
   - Ayarlar sekmesinde Google AI veya Huggingface API anahtarınızı girin
   - Kullanmak istediğiniz API'yi seçin
   - Ayarları kaydedin

2. Tweet Yanıtlama:
   - Twitter'da bir tweet metnini seçin
   - Sağ tıklayıp "AI ile Yanıt Oluştur"u seçin veya beliren "AI ile Yanıtla" butonuna tıklayın
   - Oluşturulan yanıtı düzenleyip kullanın

## API Anahtarları

- Google AI (Gemini) API anahtarı için: https://aistudio.google.com
- Huggingface API anahtarı için: https://huggingface.co/settings/tokens

## Geliştirme

Eklentiyi geliştirmek için:

```bash
git clone https://github.com/montecit/twitter-ai-extension.git
cd twitter-ai-extension
```

## Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b yeni-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik: XYZ'`)
4. Branch'inizi push edin (`git push origin yeni-ozellik`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın. 
