<script setup>
  import { inject } from 'vue'

  const toggleTheme = inject('toggleTheme')
  const isDarkMode = inject('isDarkMode')
</script>

<template>
  <header class="header">
    <div class="header-container">
      <!-- Логотип -->
      <div class="logo" @click="goHome">
        <span class="logo-icon">🎨</span>
        <span class="logo-text">Palette Generator</span>
      </div>

      <!-- Навигация с 4 ссылками -->
      <nav class="nav">
        <router-link to="/" class="nav-link" active-class="active" exact>
          <span class="nav-icon">🎲</span>
          <span class="nav-text">Генератор</span>
        </router-link>

        <router-link to="/editor" class="nav-link" active-class="active">
          <span class="nav-icon">✏️</span>
          <span class="nav-text">Редактор</span>
        </router-link>

        <router-link to="/library" class="nav-link" active-class="active">
          <span class="nav-icon">📚</span>
          <span class="nav-text">Библиотека</span>
        </router-link>

        <router-link to="/export" class="nav-link" active-class="active">
          <span class="nav-icon">📤</span>
          <span class="nav-text">Экспорт</span>
        </router-link>
      </nav>

      <button class="theme-toggle-btn" @click="toggleTheme">
        <span class="icon">{{ isDarkMode ? '☀️' : '🌙' }}</span>
        <span>{{ isDarkMode ? 'Светлая' : 'Тёмная' }}</span>
      </button>
    </div>
  </header>
</template>

<script>
import { useRouter } from 'vue-router'

export default {
  name: 'Header',

  setup() {
    const router = useRouter()

    const goHome = () => {
      router.push('/')
    }

    return {
      goHome
    }
  }
}
</script>

<style scoped>
/* Основной контейнер хедера */
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;

  background: linear-gradient(
      135deg,
      var(--bg-secondary) 0%,
      var(--bg-tertiary) 100%
  );
  border-bottom: 1px solid var(--border-color);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  backdrop-filter: blur(10px);
  border-bottom: 1px solid transparent;
}

/* Темная тема */
dark-theme .header {
  background: linear-gradient(135deg, rgba(26, 32, 44, 0.98) 0%, rgba(45, 55, 72, 0.98) 100%);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(74, 85, 104, 0.8);
}

/* Контейнер содержимого */
.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

/* Логотип */
.logo {
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 8px;
  border-radius: 12px;
  flex-shrink: 0;
}

.logo:hover {
  transform: translateY(-2px);
  background: rgba(102, 126, 234, 0.1);
}

.logo-icon {
  font-size: 2.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f56565 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);
}

dark-theme .logo-text {
  background: linear-gradient(135deg, #9f7aea 0%, #667eea 50%, #4299e1 100%);
  text-shadow: 0 2px 10px rgba(159, 122, 234, 0.3);
}

/* Навигация - убраны все фоны, только текст и иконки */
.nav {
  display: flex;
  gap: 32px;
  flex: 1;
  max-width: 600px;
  justify-content: center;
}

/* Ссылки навигации - прозрачный фон */
.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  text-decoration: none;
  color: #4a5568;
  font-weight: 600;
  font-size: 1.05rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: inherit !important; /* Наследуем фон от родителя */
}

dark-theme .nav-link {
  color: #cbd5e0;
}

/* Ховер - только изменение цвета текста */
.nav-link:hover {
  color: #667eea;
  transform: translateY(-2px);
}

.dark-theme .nav-link:hover {
  color: #9f7aea;
}

/* Активная ссылка - подчеркивание и жирный текст */
.nav-link.active {
  color: #667eea;
  font-weight: 700;
}

.dark-theme .nav-link.active {
  color: #9f7aea;
}

/* Подчеркивание для активной ссылки */
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  border-radius: 2px;
  animation: slideIn 0.3s ease;
}

dark-theme .nav-link.active::after {
  background: linear-gradient(90deg, #9f7aea 0%, #667eea 100%);
}

@keyframes slideIn {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.nav-icon {
  font-size: 1.3rem;
  transition: transform 0.3s;
}

.nav-link:hover .nav-icon {
  transform: scale(1.2) rotate(5deg);
}

.nav-link.active .nav-icon {
  transform: scale(1.1);
}

.nav-text {
  font-weight: inherit;
  letter-spacing: 0.3px;
}

/* Адаптивность */
@media (max-width: 1200px) {
  .header-container {
    gap: 20px;
    padding: 0 20px;
  }

  .nav {
    gap: 24px;
  }

  .nav-link {
    font-size: 1rem;
  }
}

@media (max-width: 992px) {
  .header-container {
    flex-wrap: wrap;
    height: auto;
    padding: 16px 20px;
    gap: 16px;
  }

  .logo {
    order: 1;
  }

  .nav {
    order: 3;
    width: 100%;
    max-width: none;
    margin-top: 10px;
    justify-content: space-around;
    gap: 16px;
  }

  .logo-text {
    font-size: 1.3rem;
  }
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }

  .nav-link {
    flex-direction: column;
    gap: 6px;
    padding: 8px 0;
  }

  .nav-text {
    font-size: 0.85rem;
  }

  .nav-icon {
    font-size: 1.1rem;
  }
}

@media (max-width: 576px) {
  .header-container {
    padding: 12px 16px;
  }

  .nav {
    gap: 12px;
  }

  .nav-link {
    padding: 6px 0;
  }

  .nav-text {
    font-size: 0.75rem;
  }

  .nav-icon {
    font-size: 1rem;
  }
}

.theme-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-color);
  color: var(--text-primary);
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}

.theme-toggle-btn:hover {
  background: var(--bg-secondary);
}
</style>