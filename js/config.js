/**
 * Конфигурация приложения
 * Версия: 3.0 (с API ключом)
 */

const CONFIG = {
    // Версия приложения
    VERSION: '1.0.0',
    
    // Настройки DeepSeek API
    DEEPSEEK: {
        // Твой API ключ (только что пополнил на 10 юаней)
        API_KEY: 'sk-f6b506da63ee4620af0d46c182f38ad8',
        
        // URL API (менять не нужно)
        BASE_URL: 'https://api.deepseek.com/v1',
        
        // Модель по умолчанию
        MODEL: 'deepseek-chat',
        
        // Таймауты (в миллисекундах)
        TIMEOUT_MS: 30000,
        
        // Настройки генерации
        TEMPERATURE: 0.8,
        MAX_TOKENS: 2000,
        TOP_P: 0.95,
        FREQUENCY_PENALTY: 0.3,
        PRESENCE_PENALTY: 0.3,
    },
    
    // Настройки игры
    GAME: {
        MAX_HISTORY_LENGTH: 100,        // Сколько сообщений хранить в истории
        MAX_HISTORY_AGE: 7 * 24 * 60 * 60 * 1000, // 7 дней в миллисекундах
        
        // Настройки кубиков
        DICE: {
            D20: 20,
            D12: 12,
            D10: 10,
            D8: 8,
            D6: 6,
            D4: 4,
            CRITICAL_SUCCESS: 20,
            CRITICAL_FAIL: 1,
        },
        
        // Характеристики персонажа по умолчанию
        DEFAULT_STATS: {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10,
        },
    },
    
    // Доступные миры
    WORLDS: {
        fantasy: {
            id: 'fantasy',
            name: '🏰 Фэнтези',
            icon: '🏰',
            description: 'Королевства, драконы, магия',
            font: 'MedievalSharp',
            themes: ['epic', 'humor', 'horror'],
            defaultTheme: 'epic',
        },
        cyberpunk: {
            id: 'cyberpunk',
            name: '🤖 Киберпанк',
            icon: '🤖',
            description: 'Неон, импланты, корпорации',
            font: 'Orbitron',
            themes: ['epic', 'humor', 'horror'],
            defaultTheme: 'epic',
        },
        postapoc: {
            id: 'postapoc',
            name: '🌆 Постапокалипсис',
            icon: '🌆',
            description: 'Пустошь, мутанты, выживание',
            font: 'Courier New',
            themes: ['epic', 'humor', 'horror'],
            defaultTheme: 'horror',
        },
    },
    
    // Доступные тона
    THEMES: {
        epic: {
            id: 'epic',
            name: '⚔️ Эпичный',
            icon: '⚔️',
            description: 'Героический, величественный, судьбоносный',
            color: '#ffd700',
        },
        humor: {
            id: 'humor',
            name: '😄 Юморной',
            icon: '😄',
            description: 'Легкий, абсурдный, смешной',
            color: '#ff6b6b',
        },
        horror: {
            id: 'horror',
            name: '👻 Хоррор',
            icon: '👻',
            description: 'Мрачный, пугающий, безысходный',
            color: '#6b4f4f',
        },
    },
    
    // Классы персонажей
    CLASSES: {
        warrior: {
            name: '⚔️ Воин',
            description: 'Мастер ближнего боя, высокий урон и защита',
            defaultStats: {
                strength: 15,
                dexterity: 12,
                constitution: 14,
                intelligence: 8,
                wisdom: 10,
                charisma: 10,
            },
        },
        rogue: {
            name: '🗡️ Плут',
            description: 'Скрытность, ловкость, критические удары',
            defaultStats: {
                strength: 10,
                dexterity: 15,
                constitution: 12,
                intelligence: 12,
                wisdom: 10,
                charisma: 10,
            },
        },
        mage: {
            name: '✨ Маг',
            description: 'Магические заклинания, интеллект',
            defaultStats: {
                strength: 8,
                dexterity: 10,
                constitution: 10,
                intelligence: 15,
                wisdom: 14,
                charisma: 12,
            },
        },
        cleric: {
            name: '🙏 Клирик',
            description: 'Лечение, поддержка, святая магия',
            defaultStats: {
                strength: 12,
                dexterity: 10,
                constitution: 12,
                intelligence: 10,
                wisdom: 15,
                charisma: 12,
            },
        },
    },
    
    // Сообщения системы
    MESSAGES: {
        WELCOME: 'Добро пожаловать в мир D&D! Выбери мир в настройках и начни приключение.',
        LOADING: '🤔 Думаю...',
        ERROR: '❌ Произошла ошибка. Попробуй еще раз.',
        API_ERROR: '❌ Ошибка подключения к DeepSeek API. Проверь ключ и баланс.',
        SAVED: '💾 Игра сохранена!',
        LOADED: '📂 Игра загружена!',
        RESET: '🔄 Прогресс сброшен. Начни новое приключение!',
    },
};

// Замораживаем конфиг
Object.freeze(CONFIG);