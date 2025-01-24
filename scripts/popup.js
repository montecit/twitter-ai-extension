document.addEventListener('DOMContentLoaded', () => {
    // Ana sayfa elementleri
    const responseTextarea = document.getElementById('generatedResponse');
    const copyButton = document.getElementById('copyButton');
    const replyButton = document.getElementById('replyButton');
    const styleSelect = document.getElementById('responseStyle');

    // Ayarlar sayfası elementleri
    const huggingfaceKeyInput = document.getElementById('huggingfaceKey');
    const googleAIKeyInput = document.getElementById('googleAIKey');
    const activeAPISelect = document.getElementById('activeAPI');
    const saveSettingsButton = document.getElementById('saveSettings');
    const showHuggingfaceKeyButton = document.getElementById('showHuggingfaceKey');
    const showGoogleAIKeyButton = document.getElementById('showGoogleAIKey');

    // Test elementleri
    const testInput = document.getElementById('testInput');
    const testButton = document.getElementById('testAPI');
    const testResult = document.getElementById('testResult');

    // Tab işlevselliği
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    console.log('Popup script yüklendi');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Tab butonlarını güncelle
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Tab içeriklerini güncelle
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabName) {
                    content.classList.add('active');
                }
            });
        });
    });

    // API Key göster/gizle işlevselliği
    function togglePasswordVisibility(input, button) {
        if (input.type === 'password') {
            input.type = 'text';
            button.textContent = 'Gizle';
        } else {
            input.type = 'password';
            button.textContent = 'Göster';
        }
    }

    showHuggingfaceKeyButton.addEventListener('click', () => {
        togglePasswordVisibility(huggingfaceKeyInput, showHuggingfaceKeyButton);
    });

    showGoogleAIKeyButton.addEventListener('click', () => {
        togglePasswordVisibility(googleAIKeyInput, showGoogleAIKeyButton);
    });

    // API Test fonksiyonu
    async function testAPI() {
        console.log('API testi başlatılıyor');
        const testText = testInput.value.trim();
        if (!testText) {
            showTestResult('Lütfen test için bir metin girin', true);
            return;
        }

        testButton.disabled = true;
        testButton.textContent = 'Test Ediliyor...';
        testResult.className = 'test-result';
        testResult.textContent = 'API test ediliyor...';

        try {
            const config = await browser.storage.local.get(['huggingfaceKey', 'googleAIKey', 'activeAPI']);
            console.log('Test için config:', config);

            let response;
            let result;

            if (config.activeAPI === 'googleAI') {
                if (!config.googleAIKey) {
                    throw new Error('Google AI API anahtarı bulunamadı');
                }

                response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${config.googleAIKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: `Aşağıdaki tweet'e profesyonel ve nazik bir yanıt oluştur. Yanıt Türkçe olmalı ve 280 karakteri geçmemeli:\n\n${testText}`
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
            } else {
                if (!config.huggingfaceKey) {
                    throw new Error('Huggingface API anahtarı bulunamadı');
                }

                response = await fetch('https://api-inference.huggingface.co/models/facebook/bart-large-mnli', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.huggingfaceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: testText,
                        parameters: {
                            max_length: 100
                        }
                    })
                });
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Hatası: ${response.status} ${errorText}`);
            }

            result = await response.json();
            console.log('Test sonucu:', result);

            if (config.activeAPI === 'googleAI') {
                if (result.candidates && result.candidates[0].content && result.candidates[0].content.parts) {
                    showTestResult('API başarıyla test edildi:\n' + result.candidates[0].content.parts[0].text);
                } else {
                    throw new Error('API yanıt oluşturmadı');
                }
            } else {
                showTestResult('API başarıyla test edildi:\n' + JSON.stringify(result, null, 2));
            }
        } catch (error) {
            console.error('Test hatası:', error);
            showTestResult(error.message, true);
        } finally {
            testButton.disabled = false;
            testButton.textContent = 'API\'yi Test Et';
        }
    }

    function showTestResult(message, isError = false) {
        testResult.className = 'test-result' + (isError ? ' error' : ' success');
        testResult.textContent = message;
    }

    // Test butonuna tıklandığında
    testButton.addEventListener('click', testAPI);

    // Ayarları kaydet
    saveSettingsButton.addEventListener('click', () => {
        console.log('Ayarlar kaydediliyor');
        browser.storage.local.set({
            huggingfaceKey: huggingfaceKeyInput.value,
            googleAIKey: googleAIKeyInput.value,
            activeAPI: activeAPISelect.value
        }).then(() => {
            alert('Ayarlar kaydedildi!');
        }).catch(error => {
            console.error('Ayarları kaydetme hatası:', error);
            alert('Ayarlar kaydedilirken hata oluştu!');
        });
    });

    // Sayfa yüklendiğinde ayarları yükle
    browser.storage.local.get(['huggingfaceKey', 'googleAIKey', 'activeAPI', 'responseStyle'])
        .then((result) => {
            console.log('Ayarlar yüklendi');
            if (result.huggingfaceKey) {
                huggingfaceKeyInput.value = result.huggingfaceKey;
            }
            if (result.googleAIKey) {
                googleAIKeyInput.value = result.googleAIKey;
            }
            if (result.activeAPI) {
                activeAPISelect.value = result.activeAPI;
            }
            if (result.responseStyle) {
                styleSelect.value = result.responseStyle;
            }
        }).catch(error => {
            console.error('Ayarları yükleme hatası:', error);
        });

    // Yanıt stilini storage'a kaydet
    styleSelect.addEventListener('change', (e) => {
        browser.storage.local.set({
            responseStyle: e.target.value
        });
    });

    // Kopyalama butonu işlevi
    copyButton.addEventListener('click', () => {
        responseTextarea.select();
        document.execCommand('copy');
    });

    // Yanıtlama butonu işlevi
    replyButton.addEventListener('click', async () => {
        const tabs = await browser.tabs.query({active: true, currentWindow: true});
        browser.tabs.sendMessage(tabs[0].id, {
            action: 'submitReply',
            text: responseTextarea.value
        });
    });

    // Background script'ten gelen yanıtları dinle
    browser.runtime.onMessage.addListener((message) => {
        console.log('Popup mesaj aldı:', message);
        if (message.action === 'showResponse' || message.action === 'updatePopup') {
            console.log('Yanıt güncelleniyor:', message.response);
            responseTextarea.value = message.response;
        }
    });
}); 