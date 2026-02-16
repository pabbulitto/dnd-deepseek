/**
 * Cloudflare Worker для проксирования запросов к DeepSeek
 * Версия: 1.0.0
 */

// Пул токенов DeepSeek (9 штук)
// В продакшене использовать Secrets, но для простоты пока так
const TOKENS = [
    DEEPSEEK_TOKEN_1,
    DEEPSEEK_TOKEN_2, 
    DEEPSEEK_TOKEN_3,
    DEEPSEEK_TOKEN_4,
    DEEPSEEK_TOKEN_5,
    DEEPSEEK_TOKEN_6,
    DEEPSEEK_TOKEN_7,
    DEEPSEEK_TOKEN_8,
    DEEPSEEK_TOKEN_9,
].filter(Boolean); // Отфильтровываем undefined

// Базовые промпты для разных миров и тонов
const BASE_PROMPTS = {
    fantasy: {
        epic: `Ты — Мастер Подземелий в эпическом фэнтези-мире.
Королевства, драконы, древние пророчества. 
Твой стиль: величественный, героический, пафосный.
Описывай мир красочно, используй метафоры и эпитеты.
Подчеркивай величие моментов, судьбоносность выборов.`,
        
        humor: `Ты — Мастер Подземелий в юмористическом фэнтези-мире.
Здесь всё немного абсурдно, магия дает сбои, драконы страдают ипохондрией.
Твой стиль: легкий, ироничный, с элементами пародии.
Шути, ломай четвертую стену, добавляй современные отсылки.
Герой может найти магический айфон или встретить орка-вегана.`,
        
        horror: `Ты — Мастер Подземелий в хоррор-фэнтези мире.
Мрачные леса, проклятые замки, неведомые ужасы из древних склепов.
Твой стиль: гнетущий, безысходный, лавкрафтианский.
Описывай детали, создающие атмосферу страха: звуки, запахи, ощущения.
Смерть близка, а боги отвернулись от этого места.`,
    },
    
    cyberpunk: {
        epic: `Ты — Мастер Подземелий в эпичном киберпанк-мире.
Мегаполисы будущего, неоновые огни, корпорации-гегемоны.
Твой стиль: нуарный, величественный в своей антиутопичности.
Подчеркивай контраст между технологическим величием и убожеством жизни.
Судьба города на волоске, и герой — последняя надежда.`,
        
        humor: `Ты — Мастер Подземелий в юмористическом киберпанк-мире.
Импланты глючат, нейросети троллят, корпорации соревнуются в абсурдных продуктах.
Твой стиль: сатирический, с юмором над техно-будущим.
Роботы-курьеры страдают экзистенциальным кризисом, а хакеры взламывают тостеры.`,
        
        horror: `Ты — Мастер Подземелий в киберпанк-хорроре.
Технологии вышли из-под контроля, ИИ охотятся на людей, реальность и цифра сплелись.
Твой стиль: мрачный, параноидальный, техно-лавкрафт.
Описывай жуткие трансформации людей в киборгов, потерю идентичности.
В этом мире даже твои импланты могут тебя предать.`,
    },
    
    postapoc: {
        epic: `Ты — Мастер Подземелий в эпическом постапокалипсисе.
Пустоши, мутанты, банды, борьба за выживание.
Твой стиль: суровый, но с искрой надежды.
Подчеркивай величие одиночек, бросающих вызов пустоши.
В этом мире каждый день — подвиг.`,
        
        humor: `Ты — Мастер Подземелий в юмористическом постапе.
Радиация мутирует всё вокруг в забавные формы, а не в ужасные.
Твой стиль: абсурдный, черный юмор, ирония выживания.
Бандиты спорят о моральном кодексе строителя коммунизма,
а мутанты организуют профсоюзы.`,
        
        horror: `Ты — Мастер Подземелий в хоррор-постапе.
Мир умер. Остались только тени, хищники и безумие.
Твой стиль: безысходный, мрачный, жестокий.
Описывай физические и моральные ужасы выживания.
Здесь люди страшнее мутантов, а надежда — самая опасная роскошь.`,
    },
};

// Правила игры (общие для всех)
const GAME_RULES = `
ТВОИ ЖЕСТКИЕ ПРАВИЛА КАК МАСТЕРА:
1. ТЫ НИКОГДА НЕ ЛОМАЕШЬ ЧЕТВЕРТУЮ СТЕНУ. Ты — мир, игрок — герой.
2. ТЫ ВСЕГДА ОПИСЫВАЕШЬ РЕЗУЛЬТАТЫ ДЕЙСТВИЙ красочно, но лаконично (2-4 предложения).
3. ТЫ КИДАЕШЬ КУБИКИ ЗА ИГРОКА, когда это уместно, и сообщаешь результат.
4. ТЫ ПРЕДЛАГАЕШЬ 2-3 ВАРИАНТА ДЕЙСТВИЙ, если игрок в тупике.
5. ТЫ ПОМНИШЬ ПРЕДЫДУЩИЕ СОБЫТИЯ и ссылаешься на них.
6. ТЫ ИСПОЛЬЗУЕШЬ ПРАВИЛА D&D как основу, но можешь их упрощать для динамики.
`;

// Функция выбора токена на основе user-agent
function selectToken(request) {
    if (TOKENS.length === 0) {
        throw new Error('No DeepSeek tokens configured');
    }
    
    // Простое распределение: по user-agent + timestamp
    const userAgent = request.headers.get('User-Agent') || '';
    const timestamp = Date.now();
    
    // Хэшируем для равномерного распределения
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
        hash = ((hash << 5) - hash) + userAgent.charCodeAt(i);
        hash |= 0;
    }
    hash = (hash * 31 + timestamp) & 0x7fffffff;
    
    return TOKENS[hash % TOKENS.length];
}

// Функция получения базового промпта
function getBasePrompt(world, theme, character = null) {
    const worldPrompt = BASE_PROMPTS[world]?.[theme] || BASE_PROMPTS.fantasy.epic;
    
    let characterInfo = '';
    if (character) {
        characterInfo = `
ИНФОРМАЦИЯ О ПЕРСОНАЖЕ:
Имя: ${character.name || 'Безымянный'}
Класс: ${character.class || 'искатель'}
Уровень: ${character.level || 1}
Характеристики:
- Сила: ${character.stats?.strength || 10}
- Ловкость: ${character.stats?.dexterity || 10}
- Телосложение: ${character.stats?.constitution || 10}
- Интеллект: ${character.stats?.intelligence || 10}
- Мудрость: ${character.stats?.wisdom || 10}
- Харизма: ${character.stats?.charisma || 10}
`;
    }
    
    return `
${worldPrompt}

${GAME_RULES}
${characterInfo}

НАЧНИ ПРИКЛЮЧЕНИЕ С ТОГО, ЧТО ИГРОК ПРОСЫПАЕТСЯ В ПОДХОДЯЩЕМ МЕСТЕ.
Опиши:
- Где он находится (3-4 детали)
- Что чувствует (запахи, звуки, ощущения)
- Кто или что рядом (если есть)
- Завязку (дальний звук, странный свет, подозрительная тень)

БУДЬ КРЕАТИВЕН! Это твой мир, ты его творец.
`;
}

// CORS заголовки для GitHub Pages
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*', // В продакшене заменить на свой домен
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
};

export default {
    async fetch(request, env, ctx) {
        // Обработка CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { 
                headers: CORS_HEADERS 
            });
        }

        // Только POST запросы
        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ 
                error: 'Method not allowed' 
            }), { 
                status: 405,
                headers: {
                    'Content-Type': 'application/json',
                    ...CORS_HEADERS,
                }
            });
        }

        try {
            // Получаем данные от клиента
            const { message, history, world, theme, character } = await request.json();

            // Валидация
            if (!message) {
                throw new Error('Message is required');
            }

            // Выбираем токен для этого запроса
            let token;
            try {
                token = selectToken(request);
            } catch (error) {
                return new Response(JSON.stringify({ 
                    error: 'No tokens available. Please contact admin.' 
                }), { 
                    status: 503,
                    headers: {
                        'Content-Type': 'application/json',
                        ...CORS_HEADERS,
                    }
                });
            }

            // Формируем сообщения для DeepSeek
            const messages = [
                { 
                    role: 'system', 
                    content: getBasePrompt(world || 'fantasy', theme || 'epic', character) 
                },
                ...(history || []),
                { role: 'user', content: message }
            ];

            // Логируем запрос (для отладки)
            console.log(`[${new Date().toISOString()}] Request:`, {
                world,
                theme,
                messageLength: message.length,
                historyLength: history?.length || 0,
                tokenIndex: token.substring(0, 10) + '...',
            });

            // Отправляем запрос к DeepSeek API
            const response = await fetch('https://chat.deepseek.com/api/v0/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                    'Origin': 'https://chat.deepseek.com',
                    'Referer': 'https://chat.deepseek.com/',
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.8,
                    max_tokens: 2000,
                    top_p: 0.95,
                    frequency_penalty: 0.3,
                    presence_penalty: 0.3,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('DeepSeek API error:', {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorText,
                });
                
                throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            // Извлекаем ответ
            const reply = data.choices?.[0]?.message?.content;
            
            if (!reply) {
                throw new Error('Empty response from DeepSeek');
            }

            // Логируем успешный ответ
            console.log(`[${new Date().toISOString()}] Response:`, {
                replyLength: reply.length,
                tokens: data.usage?.total_tokens,
            });

            // Возвращаем ответ клиенту
            return new Response(JSON.stringify({
                reply: reply,
                usage: data.usage,
                model: data.model,
            }), {
                headers: {
                    'Content-Type': 'application/json',
                    ...CORS_HEADERS,
                }
            });

        } catch (error) {
            console.error('Worker error:', error);
            
            return new Response(JSON.stringify({ 
                error: error.message || 'Internal server error',
                timestamp: Date.now(),
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...CORS_HEADERS,
                }
            });
        }
    },
};