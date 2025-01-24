// API anahtarlarını ve aktif API'yi saklamak için
let config = {
    huggingface: null,
    googleAI: null,
    activeAPI: 'huggingface'
};

// Konfigürasyonu storage'dan al
browser.storage.local.get(['huggingfaceKey', 'googleAIKey', 'activeAPI']).then((result) => {
    console.log('Mevcut config:', result);
    config.huggingface = result.huggingfaceKey;
    config.googleAI = result.googleAIKey;
    config.activeAPI = result.activeAPI || 'huggingface';
}).catch(error => {
    console.error('Config yüklenirken hata:', error);
});

// Storage değişikliklerini dinle
browser.storage.onChanged.addListener((changes) => {
    console.log('Storage değişiklikleri:', changes);
    if (changes.huggingfaceKey) {
        config.huggingface = changes.huggingfaceKey.newValue;
    }
    if (changes.googleAIKey) {
        config.googleAI = changes.googleAIKey.newValue;
    }
    if (changes.activeAPI) {
        config.activeAPI = changes.activeAPI.newValue;
    }
});

// Sağ tık menüsünü oluştur
browser.contextMenus.create({
    id: "analyze-tweet",
    title: "AI ile Yanıt Oluştur",
    contexts: ["selection"],
    documentUrlPatterns: ["*://*.twitter.com/*", "*://*.x.com/*"]
}, () => {
    if (browser.runtime.lastError) {
        console.error('Context menu oluşturma hatası:', browser.runtime.lastError);
    } else {
        console.log('Context menu başarıyla oluşturuldu');
    }
});

// Popup'ı aç
async function openPopup() {
    try {
        await browser.browserAction.openPopup();
    } catch (error) {
        console.error('Popup açma hatası:', error);
    }
}

// Sağ tık menüsüne tıklandığında
browser.contextMenus.onClicked.addListener((info, tab) => {
    console.log('Context menu tıklandı:', info);
    if (info.menuItemId === "analyze-tweet" && info.selectionText) {
        console.log('Analiz edilecek metin:', info.selectionText);
        openPopup(); // Popup'ı aç
        analyzeTweetWithAI(info.selectionText).then(response => {
            console.log('API yanıtı:', response);
            browser.runtime.sendMessage({
                action: 'showResponse',
                response: response
            }).catch(error => {
                console.error('Yanıt gönderme hatası:', error);
            });
        }).catch(error => {
            console.error('Tweet analiz hatası:', error);
            browser.runtime.sendMessage({
                action: 'showResponse',
                response: 'Hata: ' + error.message
            }).catch(error => {
                console.error('Hata mesajı gönderme hatası:', error);
            });
        });
    }
});

// Content script'ten gelen mesajları dinle
browser.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    console.log('Gelen mesaj:', message);
    if (message.action === 'analyzeTweet') {
        try {
            console.log('Tweet analizi başlatılıyor:', message.text);
            const response = await analyzeTweetWithAI(message.text);
            console.log('Analiz sonucu:', response);
            // Yanıtı popup'a gönder
            await browser.runtime.sendMessage({
                action: 'showResponse',
                response: response
            });
        } catch (error) {
            console.error('Tweet analiz hatası:', error);
            await browser.runtime.sendMessage({
                action: 'showResponse',
                response: 'Hata: ' + error.message
            });
        }
    }
});

// Tweet'i AI ile analiz et
async function analyzeTweetWithAI(tweetText) {
    console.log('Aktif API:', config.activeAPI);
    if (config.activeAPI === 'huggingface') {
        return await analyzeWithHuggingface(tweetText);
    } else if (config.activeAPI === 'googleAI') {
        return await analyzeWithGoogleAI(tweetText);
    } else {
        throw new Error('Geçerli bir API seçilmedi');
    }
}

// Huggingface ile analiz
async function analyzeWithHuggingface(text) {
    console.log('Huggingface analizi başlatılıyor');
    if (!config.huggingface) {
        console.error('API anahtarı bulunamadı');
        throw new Error('Huggingface API anahtarı bulunamadı');
    }

    try {
        console.log('API isteği gönderiliyor...');
        const response = await fetch('https://api-inference.huggingface.co/models/dbmdz/bert-base-turkish-cased', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.huggingface}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `Tweet: ${text}\nGörev: Bu tweet'e profesyonel ve nazik bir yanıt oluştur. Yanıt Türkçe olmalı ve 280 karakteri geçmemeli.`,
                parameters: {
                    max_length: 280,
                    temperature: 0.7,
                    top_p: 0.9,
                    do_sample: true
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('API hatası:', response.status, errorText);
            throw new Error(`Huggingface API hatası: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('API yanıtı:', result);

        // Yanıtı metin olarak döndür
        if (Array.isArray(result) && result.length > 0) {
            return result[0].generated_text || result[0];
        } else if (typeof result === 'string') {
            return result;
        } else {
            return JSON.stringify(result);
        }
    } catch (error) {
        console.error('API çağrısı hatası:', error);
        throw error;
    }
}

// Google AI ile analiz
async function analyzeWithGoogleAI(text) {
    console.log('Google AI analizi başlatılıyor');
    if (!config.googleAI) {
        throw new Error('Google AI API anahtarı bulunamadı');
    }

    try {
        console.log('Google AI API isteği gönderiliyor...');
        const apiKey = config.googleAI;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Aşağıdaki tweet'e profesyonel ve nazik bir yanıt oluştur. Yanıt Türkçe olmalı ve 280 karakteri geçmemeli:\n\n${text}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 800,
                    topP: 0.8,
                    topK: 40
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google AI API hatası:', response.status, errorText);
            throw new Error(`Google AI API hatası: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('Google AI yanıtı:', result);

        if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
            return result.candidates[0].content.parts[0].text;
        } else {
            throw new Error('API yanıt oluşturmadı');
        }
    } catch (error) {
        console.error('Google AI API çağrısı hatası:', error);
        throw error;
    }
} 