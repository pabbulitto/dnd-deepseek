/**
 * Игровой движок — основная логика D&D
 * Версия: 3.0 (совместим с DeepSeek API)
 */

class GameEngine {
    constructor(deepseekClient) {
        this.ds = deepseekClient;
        this.currentWorld = null;
        this.currentTheme = null;
        this.messages = [];
        this.character = {
            name: 'Безымянный',
            class: 'warrior',
            level: 1,
            health: 100,
            maxHealth: 100,
            experience: 0,
            stats: { ...CONFIG.GAME.DEFAULT_STATS },
            inventory: [],
            gold: 0,
        };
        
        this.isLoading = false;
        this.listeners = {};
        
        Utils.log('init', 'Game engine created');
    }

    /**
     * Подписка на события
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    /**
     * Вызов события
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Инициализация новой игры
     */
    async init(world, theme, characterName = null, characterClass = 'warrior') {
        this.currentWorld = world;
        this.currentTheme = theme;
        
        if (characterName) {
            this.character.name = characterName;
        }
        
        this.character.class = characterClass;
        this.character.stats = { 
            ...CONFIG.CLASSES[characterClass]?.defaultStats || CONFIG.GAME.DEFAULT_STATS 
        };
        
        Utils.log('init', `Starting game: ${world}/${theme} as ${this.character.name}`);
        
        // Загружаем историю, если есть
        const savedHistory = Storage.loadHistory(world, theme);
        if (savedHistory.length > 0) {
            this.messages = savedHistory;
            this.emit('historyLoaded', savedHistory);
            return;
        }
        
        // Или начинаем новую с промптом
        this.isLoading = true;
        this.emit('loading', true);
        
        try {
            // Получаем промпт через глобальный PromptLoader (не import!)
            const prompt = window.PromptLoader.getPrompt(world, theme, this.character);
            
            // Показываем, что думает
            this.addMessage('system', '✨ Создаю мир...', true);
            
            const response = await this.ds.sendMessage(
                prompt, 
                [], 
                world, 
                theme
            );
            
            this.addMessage('dm', response.text);
            
        } catch (error) {
            this.addMessage('system', `❌ Ошибка: ${error.message}`);
            Utils.log('error', error);
        } finally {
            this.isLoading = false;
            this.emit('loading', false);
        }
    }

    /**
     * Действие игрока
     */
    async playerAction(action) {
        if (this.isLoading) {
            Utils.showNotification('⏳ Подожди, я еще думаю...', 'warning');
            return;
        }

        // Добавляем сообщение игрока
        this.addMessage('player', action);
        
        // Проверяем особые команды
        if (this.handleSpecialCommand(action)) {
            return;
        }
        
        this.isLoading = true;
        this.emit('loading', true);
        
        try {
            // Отправляем в DeepSeek
            const response = await this.ds.sendMessage(
                action,
                this.messages.slice(-10), // Последние 10 сообщений для контекста
                this.currentWorld,
                this.currentTheme
            );
            
            this.addMessage('dm', response.text);
            
        } catch (error) {
            this.addMessage('system', `❌ Ошибка: ${error.message}`);
            Utils.log('error', error);
        } finally {
            this.isLoading = false;
            this.emit('loading', false);
        }
    }

    /**
     * Обработка специальных команд
     */
    handleSpecialCommand(action) {
        const cmd = action.toLowerCase().trim();
        
        // Бросок кубика
        if (cmd === '/roll' || cmd === 'd20' || cmd === 'кинуть кубик') {
            this.rollDice();
            return true;
        }
        
        // Инвентарь
        if (cmd === '/inv' || cmd === 'инвентарь') {
            this.showInventory();
            return true;
        }
        
        // Характеристики
        if (cmd === '/stats' || cmd === 'характеристики') {
            this.showStats();
            return true;
        }
        
        // Помощь
        if (cmd === '/help' || cmd === 'помощь') {
            this.showHelp();
            return true;
        }
        
        return false;
    }

    /**
     * Бросок кубика
     */
    rollDice() {
        const roll = this.ds.rollDice(20);
        
        let message = `🎲 Бросок d20: **${roll.result}**`;
        
        if (roll.isCritical) {
            message += ' 🔥 КРИТИЧЕСКИЙ УСПЕХ!';
        } else if (roll.isFail) {
            message += ' 💀 КРИТИЧЕСКИЙ ПРОВАЛ!';
        }
        
        this.addMessage('dice', message);
        
        // Отправляем результат в DeepSeek для описания
        this.playerAction(`[Результат броска d20: ${roll.result}] Опиши, что произошло.`);
    }

    /**
     * Показать инвентарь
     */
    showInventory() {
        let message = '🎒 **Инвентарь**\n\n';
        
        if (this.character.inventory.length === 0) {
            message += 'Пусто.';
        } else {
            this.character.inventory.forEach((item, i) => {
                message += `${i + 1}. ${item.name} ${item.count > 1 ? `(x${item.count})` : ''}\n`;
            });
        }
        
        message += `\n💰 Золото: ${this.character.gold}`;
        
        this.addMessage('system', message);
    }

    /**
     * Показать характеристики
     */
    showStats() {
        const stats = this.character.stats;
        
        const message = `📊 **Характеристики ${this.character.name}**\n\n` +
            `❤️ Здоровье: ${this.character.health}/${this.character.maxHealth}\n` +
            `📈 Уровень: ${this.character.level}\n` +
            `✨ Опыт: ${this.character.experience}\n\n` +
            `⚔️ Сила: ${stats.strength}\n` +
            `🏹 Ловкость: ${stats.dexterity}\n` +
            `🛡️ Телосложение: ${stats.constitution}\n` +
            `📚 Интеллект: ${stats.intelligence}\n` +
            `🧠 Мудрость: ${stats.wisdom}\n` +
            `💫 Харизма: ${stats.charisma}`;
        
        this.addMessage('system', message);
    }

    /**
     * Показать помощь
     */
    showHelp() {
        const message = `📖 **Команды**\n\n` +
            `🎲 /roll или d20 - бросить кубик\n` +
            `🎒 /inv или инвентарь - показать инвентарь\n` +
            `📊 /stats или характеристики - показать характеристики\n` +
            `💾 /save - сохранить игру\n` +
            `📂 /load - загрузить игру\n` +
            `🔄 /reset - начать заново\n` +
            `❓ /help или помощь - показать это сообщение\n\n` +
            `💡 **Совет**: Просто описывай свои действия, и Мастер ответит!`;
        
        this.addMessage('system', message);
    }

    /**
     * Добавить сообщение в историю
     */
    addMessage(sender, text, temporary = false) {
        const message = {
            id: Utils.generateId(),
            sender: sender,
            text: text,
            timestamp: Date.now(),
            temporary: temporary,
        };
        
        if (!temporary) {
            this.messages.push(message);
            
            // Сохраняем в Storage
            Storage.saveHistory(this.currentWorld, this.currentTheme, this.messages);
        }
        
        this.emit('newMessage', message);
    }

    /**
     * Изменить здоровье
     */
    modifyHealth(amount) {
        this.character.health = Math.max(0, Math.min(
            this.character.health + amount,
            this.character.maxHealth
        ));
        
        if (this.character.health <= 0) {
            this.addMessage('system', '💀 Ты повержен! Используй /restart чтобы начать заново.');
        }
        
        return this.character.health;
    }

    /**
     * Добавить опыт
     */
    addExperience(amount) {
        this.character.experience += amount;
        
        // Проверка на повышение уровня (упрощенно)
        const nextLevel = this.character.level * 100;
        if (this.character.experience >= nextLevel) {
            this.levelUp();
        }
    }

    /**
     * Повышение уровня
     */
    levelUp() {
        this.character.level++;
        this.character.maxHealth += 10;
        this.character.health = this.character.maxHealth;
        
        this.addMessage('system', `✨ **LEVEL UP!** Теперь ты ${this.character.level} уровня! ✨`);
    }

    /**
     * Добавить предмет в инвентарь
     */
    addItem(itemName, count = 1) {
        const existing = this.character.inventory.find(i => i.name === itemName);
        
        if (existing) {
            existing.count += count;
        } else {
            this.character.inventory.push({
                name: itemName,
                count: count,
            });
        }
        
        this.addMessage('system', `📦 Получено: ${itemName} x${count}`);
    }

    /**
     * Сохранить текущую игру
     */
    saveGame(slot = 'auto') {
        const gameState = {
            world: this.currentWorld,
            theme: this.currentTheme,
            character: this.character,
            messages: this.messages,
            timestamp: Date.now(),
        };
        
        Storage.saveGame(slot, gameState);
        this.addMessage('system', '💾 Игра сохранена!');
    }

    /**
     * Загрузить игру
     */
    loadGame(slot = 'auto') {
        const gameState = Storage.loadGame(slot);
        
        if (gameState) {
            this.currentWorld = gameState.world;
            this.currentTheme = gameState.theme;
            this.character = gameState.character;
            this.messages = gameState.messages;
            
            this.emit('gameLoaded', gameState);
            this.addMessage('system', '📂 Игра загружена!');
        } else {
            this.addMessage('system', '❌ Нет сохраненной игры');
        }
    }

    /**
     * Сбросить игру
     */
    reset() {
        if (confirm('Начать новое приключение? Весь прогресс будет потерян.')) {
            Storage.clearHistory(this.currentWorld, this.currentTheme);
            this.messages = [];
            this.character = {
                name: 'Безымянный',
                class: 'warrior',
                level: 1,
                health: 100,
                maxHealth: 100,
                experience: 0,
                stats: { ...CONFIG.GAME.DEFAULT_STATS },
                inventory: [],
                gold: 0,
            };
            
            this.addMessage('system', '🔄 Мир пересоздается...');
            this.init(this.currentWorld, this.currentTheme, this.character.name, this.character.class);
        }
    }
}

window.GameEngine = GameEngine;