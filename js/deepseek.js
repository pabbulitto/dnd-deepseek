/**
 * Клиент для работы с DeepSeek API (упрощенная версия)
 */

class DeepSeekClient {
    constructor() {
        // Ключ вставлен жестко
        this.apiKey = 'sk-f6b506da63ee4620af0d46c182f38ad8';
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.requestQueue = [];
        this.isProcessing = false;
        
        console.log('✅ DeepSeekClient создан, ключ загружен');
    }

    async sendMessage(message, history = [], world, theme) {
        return new Promise((resolve, reject) => {
            this.requestQueue.push({
                message,
                history,
                world,
                theme,
                resolve,
                reject,
            });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.isProcessing || this.requestQueue.length === 0) return;
        
        this.isProcessing = true;
        
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            
            try {
                const response = await this._makeRequest(
                    request.message,
                    request.history,
                    request.world,
                    request.theme
                );
                request.resolve(response);
            } catch (error) {
                console.error('Request error:', error);
                request.reject(error);
            }
            
            await new Promise(r => setTimeout(r, 100));
        }
        
        this.isProcessing = false;
    }

    async _makeRequest(message, history, world, theme) {
        // Получаем промпт из глобального загрузчика
        const systemPrompt = window.PromptLoader?.getPrompt(world, theme) || 
            `Ты Мастер Подземелий в мире ${world} с тоном ${theme}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...(history || []).map(msg => ({
                role: msg.sender === 'player' ? 'user' : 'assistant',
                content: msg.text
            })),
            { role: 'user', content: message }
        ];

        try {
            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            
            return {
                text: data.choices[0].message.content,
                usage: data.usage,
            };

        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    rollDice(sides = 20) {
        const result = Math.floor(Math.random() * sides) + 1;
        return {
            result,
            sides,
            isCritical: result === 20,
            isFail: result === 1,
        };
    }

    // Убираем testConnection, чтобы не вызывал 401
}

window.DeepSeekClient = DeepSeekClient;