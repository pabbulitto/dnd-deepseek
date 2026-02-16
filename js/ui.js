/**
 * Управление пользовательским интерфейсом
 * Версия: 3.1 (совместим с DeepSeek API)
 */

class UIManager {
    constructor() {
        this.elements = {};
        this.currentTheme = null;
        this.selectedWorld = null;
        this.selectedTheme = null;
        this.init();
    }

    /**
     * Инициализация UI
     */
    init() {
        Utils.log('init', 'UI Manager initializing');
        
        // Кэшируем все DOM элементы
        this.cacheElements();
        
        // Навешиваем обработчики
        this.attachEvents();
        
        // Инициализируем темы
        this.initThemes();
        
        // Показываем модалку приветствия
        this.showSettings(true);
    }

    /**
     * Кэширование DOM элементов
     */
    cacheElements() {
        const ids = [
            'messages', 'user-input', 'send-btn', 'settings-btn', 'menu-btn',
            'settings-modal', 'modal-close', 'modal-cancel', 'modal-start',
            'world-selector', 'theme-section', 'theme-selector', 'character-section',
            'character-name-input', 'world-name', 'character-name', 'side-menu',
            'menu-close', 'action-panel', 'roll-d20', 'quick-attack', 'quick-look',
            'quick-talk', 'quick-inventory', 'menu-save', 'menu-load', 'menu-history',
            'menu-reset', 'menu-about'
        ];
        
        ids.forEach(id => {
            this.elements[id] = document.getElementById(id);
        });
        
        // Добавляем еще несколько
        this.elements.modalOverlay = document.querySelector('.modal-overlay');
        this.elements.sideMenuOverlay = document.querySelector('.side-menu-overlay');
    }

    /**
     * Навешивание обработчиков
     */
    attachEvents() {
        console.log('Attaching UI events...');
        
        // Отправка сообщения
        if (this.elements['send-btn']) {
            this.elements['send-btn'].addEventListener('click', () => this.onSendMessage());
        }
        
        if (this.elements['user-input']) {
            this.elements['user-input'].addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.onSendMessage();
            });
        }
        
        // Кнопки быстрых действий
        if (this.elements['quick-attack']) {
            this.elements['quick-attack'].addEventListener('click', () => 
                this.setInputValue('Атакую ближайшего врага'));
        }
        
        if (this.elements['quick-look']) {
            this.elements['quick-look'].addEventListener('click', () => 
                this.setInputValue('Осматриваюсь по сторонам'));
        }
        
        if (this.elements['quick-talk']) {
            this.elements['quick-talk'].addEventListener('click', () => 
                this.setInputValue('"Приветствую!"'));
        }
        
        if (this.elements['quick-inventory']) {
            this.elements['quick-inventory'].addEventListener('click', () => 
                this.setInputValue('/inv'));
        }
        
        // Бросок кубика
        if (this.elements['roll-d20']) {
            this.elements['roll-d20'].addEventListener('click', () => {
                this.animateDice();
                if (window.gameEngine) {
                    window.gameEngine.rollDice();
                }
            });
        }
        
        // Модальное окно
        if (this.elements['settings-btn']) {
            this.elements['settings-btn'].addEventListener('click', () => this.showSettings());
        }
        
        if (this.elements['modal-close']) {
            this.elements['modal-close'].addEventListener('click', () => this.hideSettings());
        }
        
        if (this.elements['modal-cancel']) {
            this.elements['modal-cancel'].addEventListener('click', () => this.hideSettings());
        }
        
        // Боковое меню
        if (this.elements['menu-btn']) {
            this.elements['menu-btn'].addEventListener('click', () => this.showSideMenu());
        }
        
        if (this.elements['menu-close']) {
            this.elements['menu-close'].addEventListener('click', () => this.hideSideMenu());
        }
        
        // Выбор мира
        if (this.elements['world-selector']) {
            this.elements['world-selector'].addEventListener('click', (e) => {
                const card = e.target.closest('.option-card');
                if (card && card.dataset.world) {
                    this.selectWorld(card.dataset.world);
                }
            });
        }
        
        // Выбор темы
        if (this.elements['theme-selector']) {
            this.elements['theme-selector'].addEventListener('click', (e) => {
                const card = e.target.closest('.option-card');
                if (card && card.dataset.theme) {
                    this.selectTheme(card.dataset.theme);
                }
            });
        }
        
        // Старт игры
        if (this.elements['modal-start']) {
            this.elements['modal-start'].addEventListener('click', () => this.startGame());
        }
        
        // Меню пункты
        if (this.elements['menu-save']) {
            this.elements['menu-save'].addEventListener('click', () => {
                if (window.gameEngine) window.gameEngine.saveGame();
                this.hideSideMenu();
            });
        }
        
        if (this.elements['menu-load']) {
            this.elements['menu-load'].addEventListener('click', () => {
                if (window.gameEngine) window.gameEngine.loadGame();
                this.hideSideMenu();
            });
        }
        
        if (this.elements['menu-reset']) {
            this.elements['menu-reset'].addEventListener('click', () => {
                if (window.gameEngine) window.gameEngine.reset();
                this.hideSideMenu();
            });
        }
        
        // Закрытие модалок по клику на оверлей
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.modalOverlay) this.hideSettings();
            });
        }
        
        if (this.elements.sideMenuOverlay) {
            this.elements.sideMenuOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.sideMenuOverlay) this.hideSideMenu();
            });
        }
    }

    /**
     * Установка значения в поле ввода
     */
    setInputValue(text) {
        const input = this.elements['user-input'];
        if (input) {
            input.value = text;
            input.focus();
        }
    }

    /**
     * Отправка сообщения
     */
    onSendMessage() {
        const input = this.elements['user-input'];
        if (!input) return;
        
        const text = input.value.trim();
        
        if (!text) return;
        
        if (!window.gameEngine) {
            console.warn('gameEngine not initialized');
            Utils.showNotification('Сначала выбери мир и начни игру', 'warning');
            return;
        }
        
        console.log('Sending message:', text);
        input.value = '';
        window.gameEngine.playerAction(text);
    }

    /**
     * Добавление сообщения в чат
     */
    addMessage(sender, text) {
        const container = this.elements['messages'];
        if (!container) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.dataset.id = Utils.generateId();
        
        // Аватар
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const avatars = {
            dm: '<i class="fas fa-dragon"></i>',
            player: '<i class="fas fa-user"></i>',
            dice: '<i class="fas fa-dice-d20"></i>',
            system: '<i class="fas fa-robot"></i>',
        };
        avatar.innerHTML = avatars[sender] || '<i class="fas fa-comment"></i>';
        
        // Контент
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = Utils.formatText(text);
        
        // Время
        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = Utils.formatTime(Date.now());
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);
        messageDiv.appendChild(time);
        
        container.appendChild(messageDiv);
        
        // Скролл вниз
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    /**
     * Показать модальное окно настроек
     */
    showSettings(force = false) {
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.classList.remove('hidden');
        }
        
        // Сброс выбора
        document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        
        if (this.elements['theme-section']) {
            this.elements['theme-section'].classList.add('hidden');
        }
        
        if (this.elements['character-section']) {
            this.elements['character-section'].classList.add('hidden');
        }
        
        if (this.elements['modal-start']) {
            this.elements['modal-start'].disabled = true;
        }
        
        // Загружаем последние настройки
        const last = Storage.getCurrentWorld();
        if (last && !force) {
            // TODO: предзаполнить
        }
    }

    /**
     * Скрыть модальное окно
     */
    hideSettings() {
        if (this.elements.modalOverlay) {
            this.elements.modalOverlay.classList.add('hidden');
        }
    }

    /**
     * Показать боковое меню
     */
    showSideMenu() {
        if (this.elements.sideMenuOverlay) {
            this.elements.sideMenuOverlay.classList.add('active');
        }
    }

    /**
     * Скрыть боковое меню
     */
    hideSideMenu() {
        if (this.elements.sideMenuOverlay) {
            this.elements.sideMenuOverlay.classList.remove('active');
        }
    }

    /**
     * Выбор мира
     */
    selectWorld(worldKey) {
        this.selectedWorld = worldKey;
        
        // Подсветка выбранного
        document.querySelectorAll('[data-world]').forEach(c => {
            c.classList.toggle('selected', c.dataset.world === worldKey);
        });
        
        // Показываем выбор темы
        if (this.elements['theme-section']) {
            this.elements['theme-section'].classList.remove('hidden');
        }
        
        // Меняем тему оформления под мир
        this.applyWorldTheme(worldKey);
    }

    /**
     * Выбор темы
     */
    selectTheme(themeKey) {
        this.selectedTheme = themeKey;
        
        document.querySelectorAll('[data-theme]').forEach(c => {
            c.classList.toggle('selected', c.dataset.theme === themeKey);
        });
        
        // Показываем ввод имени
        if (this.elements['character-section']) {
            this.elements['character-section'].classList.remove('hidden');
        }
        
        if (this.elements['modal-start']) {
            this.elements['modal-start'].disabled = false;
        }
    }

    /**
     * Старт игры
     */
    startGame() {
        const world = this.selectedWorld || 'fantasy';
        const theme = this.selectedTheme || 'epic';
        const characterNameInput = this.elements['character-name-input'];
        const characterName = characterNameInput ? characterNameInput.value.trim() : '';
        const finalName = characterName || 'Искатель';
        
        // Сохраняем выбор
        Storage.saveCurrentWorld(world, theme);
        
        // Скрываем модалку
        this.hideSettings();
        
        // Обновляем название мира в шапке
        if (this.elements['world-name']) {
            this.elements['world-name'].textContent = 
                `${CONFIG.WORLDS[world]?.name || 'Фэнтези'} (${CONFIG.THEMES[theme]?.name || 'Эпичный'})`;
        }
        
        if (this.elements['character-name']) {
            this.elements['character-name'].textContent = `(${finalName})`;
        }
        
        // Запускаем игру
        if (window.gameEngine) {
            console.log('Starting game with:', world, theme, finalName);
            window.gameEngine.init(world, theme, finalName);
        } else {
            console.error('gameEngine not found!');
        }
    }

    /**
     * Применить тему мира
     */
    applyWorldTheme(worldKey) {
        const themeLink = document.getElementById('theme-style');
        if (themeLink) {
            themeLink.href = `css/themes/${worldKey}.css`;
        }
        
        // Меняем шрифт
        const world = CONFIG.WORLDS[worldKey];
        if (world?.font) {
            document.body.style.fontFamily = world.font;
        }
    }

    /**
     * Анимация кубика
     */
    animateDice() {
        const btn = this.elements['roll-d20'];
        if (btn) {
            btn.classList.add('dice-animation');
            setTimeout(() => btn.classList.remove('dice-animation'), 500);
        }
    }

    /**
     * Показать индикатор загрузки
     */
    showLoading(show) {
        const sendBtn = this.elements['send-btn'];
        if (!sendBtn) return;
        
        if (show) {
            sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            sendBtn.disabled = true;
        } else {
            sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            sendBtn.disabled = false;
        }
    }

    /**
     * Обновить контекстные действия
     */
    updateActionPanel(actions) {
        const panel = this.elements['action-panel'];
        if (!panel) return;
        
        panel.innerHTML = '';
        
        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.innerHTML = action.label;
            btn.addEventListener('click', () => {
                this.setInputValue(action.action);
            });
            panel.appendChild(btn);
        });
    }

    /**
     * Очистить чат
     */
    clearChat() {
        const container = this.elements['messages'];
        if (container) {
            container.innerHTML = '';
        }
    }

    /**
     * Инициализация тем
     */
    initThemes() {
        // Загружаем последнюю использованную тему
        const last = Storage.getCurrentWorld();
        if (last?.world) {
            this.applyWorldTheme(last.world);
        }
    }
}

window.UIManager = UIManager;