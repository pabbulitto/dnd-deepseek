/**
 * Утилиты — вспомогательные функции
 */

const Utils = {
    /**
     * Генерирует случайное число от min до max включительно
     */
    random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * Задержка (промис)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * Форматирует время в читаемый вид
     */
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // Меньше минуты
        if (diff < 60 * 1000) {
            return 'только что';
        }
        
        // Меньше часа
        if (diff < 60 * 60 * 1000) {
            const minutes = Math.floor(diff / (60 * 1000));
            return `${minutes} ${Utils.pluralize(minutes, 'минута', 'минуты', 'минут')} назад`;
        }
        
        // Сегодня
        if (date.toDateString() === now.toDateString()) {
            return `сегодня в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // Вчера
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `вчера в ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // Старше
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    },

    /**
     * Склонение слов (1 минута, 2 минуты, 5 минут)
     */
    pluralize(number, one, few, many) {
        const mod10 = number % 10;
        const mod100 = number % 100;
        
        if (mod100 >= 11 && mod100 <= 19) {
            return many;
        }
        
        if (mod10 === 1) {
            return one;
        }
        
        if (mod10 >= 2 && mod10 <= 4) {
            return few;
        }
        
        return many;
    },

    /**
     * Обрезает текст до определенной длины
     */
    truncate(text, length = 100) {
        if (text.length <= length) return text;
        return text.slice(0, length) + '...';
    },

    /**
     * Экранирует HTML-спецсимволы
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Форматирует текст с Markdown-подобными элементами
     */
    formatText(text) {
        if (!text) return '';
        
        // Экранируем HTML
        let formatted = Utils.escapeHtml(text);
        
        // **жирный**
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // *курсив*
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // `код`
        formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // Переносы строк
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    },

    /**
     * Генерирует ID для сообщения
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Проверяет, является ли устройство мобильным
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },

    /**
     * Копирует текст в буфер обмена
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    },

    /**
     * Создает снек-бар уведомление
     */
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Удаление через duration
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    /**
     * Логирование с эмодзи
     */
    log(action, data) {
        const emojis = {
            init: '🚀',
            game: '🎮',
            dice: '🎲',
            error: '❌',
            save: '💾',
            load: '📂',
            chat: '💬',
            deepseek: '🤖',
        };
        
        const emoji = emojis[action] || '📌';
        console.log(`${emoji} ${action}:`, data);
    },
};

// Добавляем в глобальную область
window.Utils = Utils;