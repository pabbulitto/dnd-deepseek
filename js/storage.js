/**
 * Управление localStorage — сохранение игр, истории, настроек
 */

const Storage = {
    /**
     * Ключи для localStorage
     */
    KEYS: {
        HISTORY_PREFIX: 'history_',        // история для каждого мира
        CHARACTERS: 'characters',           // сохраненные персонажи
        SETTINGS: 'settings',               // настройки приложения
        CURRENT_WORLD: 'currentWorld',      // текущий мир
        CURRENT_THEME: 'currentTheme',      // текущий тон
        CURRENT_CHARACTER: 'currentCharacter', // текущий персонаж
        SAVED_GAMES: 'savedGames',          // сохраненные игры
    },

    /**
     * Сохраняет историю сообщений для мира
     */
    saveHistory(worldKey, themeKey, messages) {
        const key = `${Storage.KEYS.HISTORY_PREFIX}${worldKey}_${themeKey}`;
        
        // Оставляем только последние N сообщений
        const trimmed = messages.slice(-CONFIG.GAME.MAX_HISTORY_LENGTH);
        
        // Добавляем timestamp для управления устареванием
        const data = {
            messages: trimmed,
            savedAt: Date.now(),
            version: CONFIG.VERSION,
        };
        
        try {
            localStorage.setItem(key, JSON.stringify(data));
            Utils.log('save', { key, count: trimmed.length });
            return true;
        } catch (e) {
            console.error('Storage save error:', e);
            return false;
        }
    },

    /**
     * Загружает историю сообщений для мира
     */
    loadHistory(worldKey, themeKey) {
        const key = `${Storage.KEYS.HISTORY_PREFIX}${worldKey}_${themeKey}`;
        
        try {
            const data = localStorage.getItem(key);
            if (!data) return [];
            
            const parsed = JSON.parse(data);
            
            // Проверяем, не устарела ли история
            if (Date.now() - parsed.savedAt > CONFIG.GAME.MAX_HISTORY_AGE) {
                Utils.log('load', 'History expired, starting fresh');
                return [];
            }
            
            Utils.log('load', { key, count: parsed.messages.length });
            return parsed.messages || [];
            
        } catch (e) {
            console.error('Storage load error:', e);
            return [];
        }
    },

    /**
     * Сохраняет персонажа
     */
    saveCharacter(character) {
        const characters = this.getCharacters();
        const worldKey = character.world || 'default';
        
        characters[worldKey] = {
            ...character,
            lastPlayed: Date.now(),
        };
        
        localStorage.setItem(Storage.KEYS.CHARACTERS, JSON.stringify(characters));
        
        // Также сохраняем как текущего
        this.setCurrentCharacter(character);
        
        Utils.log('save', { type: 'character', name: character.name });
    },

    /**
     * Загружает всех персонажей
     */
    getCharacters() {
        try {
            const data = localStorage.getItem(Storage.KEYS.CHARACTERS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error loading characters:', e);
            return {};
        }
    },

    /**
     * Загружает персонажа для конкретного мира
     */
    getCharacter(worldKey) {
        const characters = this.getCharacters();
        return characters[worldKey] || null;
    },

    /**
     * Сохраняет текущего персонажа
     */
    setCurrentCharacter(character) {
        localStorage.setItem(Storage.KEYS.CURRENT_CHARACTER, JSON.stringify(character));
    },

    /**
     * Загружает текущего персонажа
     */
    getCurrentCharacter() {
        try {
            const data = localStorage.getItem(Storage.KEYS.CURRENT_CHARACTER);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Сохраняет настройки
     */
    saveSettings(settings) {
        localStorage.setItem(Storage.KEYS.SETTINGS, JSON.stringify(settings));
    },

    /**
     * Загружает настройки
     */
    getSettings() {
        try {
            const data = localStorage.getItem(Storage.KEYS.SETTINGS);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * Сохраняет текущий мир и тон
     */
    saveCurrentWorld(worldKey, themeKey) {
        localStorage.setItem(Storage.KEYS.CURRENT_WORLD, worldKey);
        localStorage.setItem(Storage.KEYS.CURRENT_THEME, themeKey);
    },

    /**
     * Загружает текущий мир и тон
     */
    getCurrentWorld() {
        return {
            world: localStorage.getItem(Storage.KEYS.CURRENT_WORLD) || 'fantasy',
            theme: localStorage.getItem(Storage.KEYS.CURRENT_THEME) || 'epic',
        };
    },

    /**
     * Сохраняет игру целиком (снэпшот)
     */
    saveGame(slot, gameState) {
        const savedGames = this.getSavedGames();
        
        savedGames[slot] = {
            ...gameState,
            savedAt: Date.now(),
            version: CONFIG.VERSION,
        };
        
        localStorage.setItem(Storage.KEYS.SAVED_GAMES, JSON.stringify(savedGames));
        Utils.showNotification(`💾 Игра сохранена в слот ${slot}`, 'success');
    },

    /**
     * Загружает сохраненную игру
     */
    loadGame(slot) {
        const savedGames = this.getSavedGames();
        const game = savedGames[slot];
        
        if (game) {
            Utils.showNotification(`📂 Загружена игра от ${new Date(game.savedAt).toLocaleString()}`, 'info');
            return game;
        }
        
        return null;
    },

    /**
     * Получает все сохраненные игры
     */
    getSavedGames() {
        try {
            const data = localStorage.getItem(Storage.KEYS.SAVED_GAMES);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    /**
     * Очищает историю для мира
     */
    clearHistory(worldKey, themeKey) {
        const key = `${Storage.KEYS.HISTORY_PREFIX}${worldKey}_${themeKey}`;
        localStorage.removeItem(key);
        Utils.log('clear', { key });
    },

    /**
     * Очищает все данные (сброс)
     */
    clearAll() {
        if (confirm('Точно сбросить весь прогресс? Это удалит все сохранения!')) {
            localStorage.clear();
            Utils.showNotification('🧹 Все данные удалены', 'warning');
            location.reload();
        }
    },

    /**
     * Проверяет доступность localStorage
     */
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
};

// Проверяем доступность при загрузке
if (!Storage.isAvailable()) {
    alert('Внимание: localStorage недоступен. Сохранения не будут работать!');
}

window.Storage = Storage;