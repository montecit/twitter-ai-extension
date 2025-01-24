console.log('Twitter AI Asistanı content script yüklendi');

// Stil ekle
const style = document.createElement('style');
style.textContent = `
    .ai-assistant-tooltip {
        position: fixed;
        background: #1DA1F2;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: none;
        pointer-events: none;
    }

    .ai-assistant-button {
        position: fixed;
        background: #1DA1F2;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        z-index: 10000;
        cursor: pointer;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        display: none;
    }
`;
document.head.appendChild(style);

// Tooltip ve buton elementlerini oluştur
const tooltip = document.createElement('div');
tooltip.className = 'ai-assistant-tooltip';
tooltip.textContent = 'Metni seçin ve AI yanıt oluşturmak için tıklayın';
document.body.appendChild(tooltip);

const analyzeButton = document.createElement('div');
analyzeButton.className = 'ai-assistant-button';
analyzeButton.textContent = 'AI ile Yanıtla';
document.body.appendChild(analyzeButton);

// Twitter gönderisi seçildiğinde çalışacak fonksiyon
function handleTweetSelection() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    console.log('Seçilen metin:', selectedText);

    if (selectedText) {
        try {
            // Seçili metnin pozisyonunu al
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            console.log('Seçim pozisyonu:', rect);

            // Analiz butonunu göster
            analyzeButton.style.display = 'block';
            analyzeButton.style.position = 'absolute';
            analyzeButton.style.left = rect.left + 'px';
            analyzeButton.style.top = (rect.bottom + 10) + 'px';

            // Butona tıklandığında
            analyzeButton.onclick = () => {
                console.log('Analiz butonu tıklandı');
                // Seçili metni background script'e gönder
                browser.runtime.sendMessage({
                    action: 'analyzeTweet',
                    text: selectedText
                }).then(() => {
                    console.log('Mesaj background script\'e gönderildi');
                }).catch(error => {
                    console.error('Mesaj gönderme hatası:', error);
                });

                // Butonu gizle
                analyzeButton.style.display = 'none';
            };
        } catch (error) {
            console.error('Seçim işleme hatası:', error);
        }
    } else {
        analyzeButton.style.display = 'none';
    }
}

// Tweet içeriğini yakalama
document.addEventListener('mouseup', handleTweetSelection);

// Background script'ten gelen mesajları dinle
browser.runtime.onMessage.addListener((message) => {
    console.log('Content script mesaj aldı:', message);
    if (message.action === 'showResponse') {
        console.log('Yanıt alındı:', message.response);
        // Yanıtı popup'ta göster
        browser.runtime.sendMessage({
            action: 'updatePopup',
            response: message.response
        }).then(() => {
            console.log('Yanıt popup\'a iletildi');
        }).catch(error => {
            console.error('Popup güncelleme hatası:', error);
        });
    }
}); 