<template>
  <div id="app" :class="{ 'dark-theme': isDarkMode }">
    <Header />
    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <Notification />

    <div v-if="confirmModalVisible">
      <ConfirmModal
          ref="confirmModalRef"
          :title="confirmModalTitle"
          :message="confirmModalMessage"
          :confirm-text="confirmModalConfirmText"
          :cancel-text="confirmModalCancelText"
          @confirm="handleConfirm"
          @cancel="handleCancel"
      />
    </div>

    <footer class="app-footer">
      <div class="footer-content">
        <!-- Лого и описание -->
        <div class="footer-section">
          <div class="footer-logo">
            <span class="footer-logo-icon">🎨</span>
            <span class="footer-logo-text">Palette Generator</span>
          </div>
          <p class="footer-description">
            Мощный инструмент для создания и управления цветовыми палитрами.
            Создавайте гармоничные цветовые схемы для ваших проектов.
          </p>
        </div>

        <!-- Быстрые ссылки (4 штуки) -->
        <div class="footer-section">
          <h4 class="footer-title">🔗 Навигация</h4>
          <div class="footer-links">
            <router-link to="/" class="footer-link">
              <span class="link-icon">🎲</span>
              <span>Генератор палитр</span>
            </router-link>
            <router-link to="/editor" class="footer-link">
              <span class="link-icon">✏️</span>
              <span>Редактор палитр</span>
            </router-link>
            <router-link to="/library" class="footer-link">
              <span class="link-icon">📚</span>
              <span>Библиотека палитр</span>
            </router-link>
            <router-link to="/export" class="footer-link">
              <span class="link-icon">📤</span>
              <span>Экспорт палитр</span>
            </router-link>
          </div>
        </div>

        <!-- Инструменты -->
        <div class="footer-section">
          <h4 class="footer-title">⚙️ Инструменты</h4>
          <div class="footer-links">
            <a href="#" class="footer-link" @click.prevent="exportAllPalettes">
              <span class="link-icon">💾</span>
              <span>Экспорт всех</span>
            </a>
            <a href="#" class="footer-link" @click.prevent="clearAllData">
              <span class="link-icon">🗑️</span>
              <span>Очистить всё</span>
            </a>
            <a href="#" class="footer-link" @click.prevent="showHelp">
              <span class="link-icon">❓</span>
              <span>Помощь</span>
            </a>
            <a href="#" class="footer-link" @click.prevent="toggleTheme">
              <span class="link-icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
              <span>{{ isDarkMode ? 'Светлая тема' : 'Тёмная тема' }}</span>
            </a>
          </div>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="copyright">© 2025 Palette Generator. Все права защищены.</p>
        <p class="footer-info">Создано с ❤️ для дизайнеров и разработчиков</p>
      </div>
    </footer>
  </div>
</template>

<script>
import { ref, onMounted, provide } from 'vue'
import { useRouter } from 'vue-router'
import Header from './components/Header.vue'
import Notification from './components/Notification.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import { PaletteStore } from './utils/paletteStore'
import { notify } from './utils/notifications'

export default {
  name: 'App',
  components: {
    Header,
    Notification,
    ConfirmModal
  },

  setup() {
    const router = useRouter()
    const confirmModalRef = ref(null)
    const isDarkMode = ref(false)

    const confirmModalVisible = ref(false)
    const confirmModalTitle = ref('')
    const confirmModalMessage = ref('')
    const confirmModalConfirmText = ref('Да')
    const confirmModalCancelText = ref('Нет')

    let confirmResolve = null

    // Инициализация темы (светлая по умолчанию)
    const initTheme = () => {
      const savedTheme = localStorage.getItem('paletteTheme')

      // Светлая тема по умолчанию
      isDarkMode.value = savedTheme === 'dark'
      updateThemeClass()
    }

    // Обновление класса темы
    const updateThemeClass = () => {
      if (isDarkMode.value) {
        document.documentElement.classList.add('dark-theme')
      } else {
        document.documentElement.classList.remove('dark-theme')
      }
    }

    // Переключение темы
    const toggleTheme = () => {
      isDarkMode.value = !isDarkMode.value
      localStorage.setItem('paletteTheme', isDarkMode.value ? 'dark' : 'light')
      updateThemeClass()
      notify.success(isDarkMode.value ? 'Тёмная тема включена' : 'Светлая тема включена')
    }

    const showConfirm = (options = {}) => {
      return new Promise((resolve) => {
        confirmModalTitle.value = options.title || 'Подтверждение'
        confirmModalMessage.value = options.message || 'Вы уверены?'
        confirmModalConfirmText.value = options.confirmText || 'Да'
        confirmModalCancelText.value = options.cancelText || 'Нет'

        confirmResolve = resolve
        confirmModalVisible.value = true
      })
    }

    const handleConfirm = () => {
      confirmModalVisible.value = false
      if (confirmResolve) {
        confirmResolve(true)
        confirmResolve = null
      }
    }

    const handleCancel = () => {
      confirmModalVisible.value = false
      if (confirmResolve) {
        confirmResolve(false)
        confirmResolve = null
      }
    }

    // Функции для футера
    const exportAllPalettes = () => {
      const data = PaletteStore.exportToJSON()
      if (!data || data === '[]') {
        notify.warning('Нет палитр для экспорта')
        return
      }

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all-palettes-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      notify.success('Все палитры экспортированы!')
    }

    const clearAllData = async () => {
      const confirmed = await showConfirm({
        title: 'Очистка всех данных',
        message: 'Вы уверены, что хотите удалить ВСЕ палитры? Это действие нельзя отменить.',
        confirmText: 'Удалить всё',
        cancelText: 'Отмена'
      })

      if (confirmed) {
        localStorage.removeItem('paletteLibrary')
        localStorage.removeItem('currentPalette')
        notify.success('Все данные очищены')
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    }

    const showHelp = () => {
      router.push('/')
      notify.info('Документация будет добавлена в будущих обновлениях')
    }

    // Предоставляем глобальные функции
    provide('notify', notify)
    provide('showConfirm', showConfirm)
    provide('toggleTheme', toggleTheme)
    provide('isDarkMode', isDarkMode)

    // Инициализация при монтировании
    onMounted(() => {
      initTheme()
    })

    return {
      isDarkMode,
      confirmModalVisible,
      confirmModalTitle,
      confirmModalMessage,
      confirmModalConfirmText,
      confirmModalCancelText,
      confirmModalRef,
      toggleTheme,
      handleConfirm,
      handleCancel,
      exportAllPalettes,
      clearAllData,
      showHelp
    }
  }
}
</script>

<style>
/* Базовые сбросы */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Глобальные переменные для светлой темы */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-tertiary: #64748b;
  --border-color: #e2e8f0;
  --accent-color: #6366f1;
  --accent-hover: #4f46e5;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --danger-color: #ef4444;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}

/* Глобальные переменные для тёмной темы */
.dark-theme {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
  --border-color: #475569;
  --accent-color: #818cf8;
  --accent-hover: #6366f1;
  --success-color: #34d399;
  --warning-color: #fbbf24;
  --danger-color: #f87171;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2);
}

/* Базовые стили body */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Контейнер приложения */
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
}

/* Основной контент */
.app-main {
  flex: 1;
  padding: 30px 20px 40px;
  max-width: 1400px;
  margin: 72px auto 0;
  width: 100%;
}

/* Анимации переходов */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Стили для футера */
.app-footer {
  background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%);
  color: var(--text-secondary);
  padding: 60px 0 30px;
  border-top: 1px solid var(--border-color);
  margin-top: auto;
}

.footer-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 1.5fr repeat(2, 1fr);
  gap: 60px;
  margin-bottom: 40px;
}

@media (max-width: 1024px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
}

@media (max-width: 768px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
    padding: 0 20px;
  }
}

/* Логотип в футере */
.footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.footer-logo-icon {
  font-size: 2.5rem;
}

.footer-logo-text {
  font-size: 1.8rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-color) 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.footer-description {
  color: var(--text-tertiary);
  font-size: 1.05rem;
  line-height: 1.7;
  margin-bottom: 25px;
  max-width: 400px;
}

/* Заголовки секций футера */
.footer-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Ссылки в футере */
.footer-links {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  padding: 10px 0;
  transition: all 0.3s ease;
  position: relative;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.footer-link:hover {
  color: var(--accent-color);
  transform: translateX(8px);
}

.footer-link.router-link-active {
  color: var(--accent-color);
  font-weight: 600;
}

.link-icon {
  font-size: 1.2rem;
  width: 24px;
  text-align: center;
}

/* Нижняя часть футера */
.footer-bottom {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  padding-top: 30px;
  border-top: 1px solid var(--border-color);
}

.copyright {
  color: var(--text-tertiary);
  font-size: 0.95rem;
  margin-bottom: 8px;
}

.footer-info {
  color: var(--text-tertiary);
  font-size: 0.9rem;
  opacity: 0.8;
}

/* Адаптивность основного контента */
@media (max-width: 768px) {
  .app-main {
    padding: 20px 16px 30px;
    margin-top: 60px;
  }

  .footer-content {
    gap: 30px;
  }

  .footer-logo-text {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .app-main {
    padding: 16px 12px 24px;
    margin-top: 56px;
  }

  .footer-content {
    padding: 0 16px;
  }

  .footer-logo {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
}
</style>