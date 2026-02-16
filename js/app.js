/**
 * Главный файл приложения
 * Версия: 3.1 (упрощенная, без проверок CONFIG)
 */

// Глобальные переменные
let deepseekClient;
let gameEngine;
let uiManager;

// Ждем загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    Utils.log('init', '🚀 D&D Master starting...');
    
    try {
        // Проверяем поддержку localStorage
        if (!Storage.isAvailable()) {
            Utils.showNotification('⚠️ LocalStorage недоступен. Сохранения не будут работать!', 'warning', 5000);
        }
        
        // Инициализируем UI
        uiManager = new UIManager();
        
        // Создаем клиент DeepSeek (ключ уже внутри)
        deepseekClient = new DeepSeekClient();
        
        // Просто логируем, что клиент создан
        Utils.log('init', 'DeepSeek клиент инициализирован');
        
        // Создаем игровой движок
        gameEngine = new GameEngine(deepseekClient);
        window.gameEngine = gameEngine;  
        // Подписываемся на события игры
        setupGameEvents();
        
        // Проверяем, есть ли сохраненная игра
        const lastWorld = Storage.getCurrentWorld();
        const lastCharacter = Storage.getCurrentCharacter();
        
        if (lastWorld && lastCharacter) {
            // Спрашиваем, хочет ли игрок продолжить
            setTimeout(() => {
                if (confirm('🔄 Продолжить последнее приключение?')) {
                    gameEngine.init(
                        lastWorld.world, 
                        lastWorld.theme, 
                        lastCharacter.name,
                        lastCharacter.class
                    );
                }
            }, 500);
        }
        
        Utils.log('init', '✅ D&D Master ready!');
        
    } catch (error) {
        Utils.log('error', error);
        Utils.showNotification('❌ Ошибка при запуске: ' + error.message, 'error', 5000);
    }
});

/**
 * Настройка обработчиков событий игры
 */
function setupGameEvents() {
    // Новое сообщение
    gameEngine.on('newMessage', (message) => {
        uiManager.addMessage(message.sender, message.text);
    });
    
    // Изменение состояния загрузки
    gameEngine.on('loading', (isLoading) => {
        uiManager.showLoading(isLoading);
    });
    
    // Загрузка истории
    gameEngine.on('historyLoaded', (messages) => {
        uiManager.clearChat();
        messages.forEach(msg => {
            uiManager.addMessage(msg.sender, msg.text);
        });
    });
    
    // Загрузка игры
    gameEngine.on('gameLoaded', (gameState) => {
        uiManager.clearChat();
        gameState.messages.forEach(msg => {
            uiManager.addMessage(msg.sender, msg.text);
        });
        
        // Обновляем шапку
        document.getElementById('world-name').textContent = 
            `${CONFIG.WORLDS[gameState.world]?.name} (${CONFIG.THEMES[gameState.theme]?.name})`;
        document.getElementById('character-name').textContent = 
            `(${gameState.character.name})`;
    });
}

// Обработка ошибок
window.addEventListener('error', (event) => {
    Utils.log('error', event.error);
    Utils.showNotification('❌ Ошибка: ' + event.message, 'error');
});

// Сохранение состояния при уходе
window.addEventListener('beforeunload', () => {
    if (gameEngine) {
        gameEngine.saveGame('auto');
    }
});

// Делаем объекты глобально доступными для отладки
window.debug = {
    Utils,
    Storage,
    gameEngine,
    deepseekClient,
    uiManager,
};