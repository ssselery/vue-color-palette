<template>
  <div class="palette-generator">
    <div class="hero-section">
      <h1 class="hero-title">🎨 Генератор цветовых палитр</h1>
      <p class="hero-subtitle">Создавайте, сохраняйте и тестируйте гармоничные цветовые схемы для ваших проектов</p>
    </div>

    <div class="controls-section">
      <div class="controls-row">
        <div class="control-group">
          <label>Количество цветов</label>
          <div class="number-buttons">
            <button
                v-for="count in [3, 4, 5, 6, 7]"
                :key="count"
                :class="['count-btn', { active: colorCount === count }]"
                @click="setColorCount(count)"
            >
              {{ count }}
            </button>
          </div>
        </div>
      </div>

      <div class="controls-row">
        <div class="action-buttons">
          <button @click="generatePalette" class="btn btn-primary">
            <span class="btn-icon">🎲</span>
            {{ paletteType === 'random' ? 'Случайная' : 'Сгенерировать' }}
          </button>
          <button @click="saveToLibrary" class="btn btn-success" :disabled="!canSave">
            <span class="btn-icon">💾</span>
            Сохранить в библиотеку
          </button>
          <button @click="clearPalette" class="btn btn-secondary">
            <span class="btn-icon">🗑️</span>
            Очистить
          </button>
          <button @click="exportPalette" class="btn btn-secondary" :disabled="!canSave">
            <span class="btn-icon">📋</span>
            Экспорт
          </button>
        </div>
      </div>
    </div>

    <!-- Палитра цветов -->
    <div class="palette-container" v-if="currentPalette.length > 0">
      <div class="palette-grid">
        <div
            v-for="(color, index) in currentPalette"
            :key="`color-${color.hex}-${index}`"
            class="color-item"
            :style="{ backgroundColor: color.hex }"
            @click="copyToClipboard(color)"
        >
          <div class="color-info" :class="{ 'text-dark': !color.isLight, 'text-light': color.isLight }">
            <div class="color-value">
              {{ colorFormat === 'hex' ? color.hex : color.rgb }}
            </div>
            <div class="color-actions">
              <button
                  @click.stop="toggleLock(index)"
                  class="action-btn lock-btn"
                  :title="color.locked ? 'Разблокировать' : 'Заблокировать'"
              >
                {{ color.locked ? '🔒' : '🔓' }}
              </button>
              <button
                  @click.stop="removeColor(index)"
                  class="action-btn remove-btn"
                  title="Удалить"
              >
                ✕
              </button>
            </div>
          </div>
          <div v-if="color.copied" class="copied-badge" :class="{ 'text-dark': !color.isLight, 'text-light': color.isLight }">
            Скопировано!
          </div>
        </div>
      </div>

      <div class="palette-actions-bottom">
        <button @click="shuffleColors" class="btn btn-secondary">
          <span class="btn-icon">🔀</span>
          Перемешать
        </button>
        <button @click="invertColors" class="btn btn-secondary">
          <span class="btn-icon">🔄</span>
          Инвертировать
        </button>
      </div>
    </div>

    <!-- Палитры из библиотеки -->
    <div v-if="savedPalettes.length > 0" class="saved-palettes-section">
      <div class="section-header">
        <h2 class="section-title">📚 Палитры из библиотеки</h2>
        <button @click="refreshSavedPalettes" class="refresh-btn" title="Обновить">
          🔄
        </button>
      </div>

      <div class="palettes-grid">
        <div
            v-for="palette in savedPalettes"
            :key="palette.id"
            class="saved-palette-card"
        >
          <div class="palette-header">
            <h3 class="palette-name">{{ palette.name }}</h3>
            <div class="palette-badges">
              <span v-if="palette.featured" class="badge featured">★</span>
              <span class="badge count">{{ palette.colors.length }} цветов</span>
            </div>
          </div>

          <div class="palette-colors">
            <div
                v-for="(color, idx) in palette.colors.slice(0, 5)"
                :key="idx"
                class="palette-color"
                :style="{ backgroundColor: color }"
                :title="color"
            ></div>
            <div v-if="palette.colors.length > 5" class="more-colors">
              +{{ palette.colors.length - 5 }}
            </div>
          </div>

          <div class="palette-actions">
            <button @click="loadPalette(palette)" class="action-btn load-btn" title="Загрузить">
              🚀
            </button>
            <button @click="copyPalette(palette)" class="action-btn copy-btn" title="Копировать">
              📋
            </button>
            <button @click="toggleFavorite(palette)" class="action-btn favorite-btn" :title="palette.featured ? 'Убрать из избранного' : 'В избранное'">
              {{ palette.featured ? '★' : '☆' }}
            </button>
            <button @click="deletePalette(palette)" class="action-btn delete-btn" title="Удалить">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Предпросмотр -->
    <div class="preview-section" :class="{ 'dark-mode': previewDarkMode }">
      <div class="preview-header">
        <h3>Предпросмотр интерфейса</h3>
        <div class="preview-controls">
          <button @click="previewDarkMode = !previewDarkMode" class="toggle-theme-btn">
            {{ previewDarkMode ? '☀️ Светлая тема' : '🌙 Тёмная тема' }}
          </button>
        </div>
      </div>

      <div class="preview-content full-preview">

        <!-- HEADER -->
        <header class="preview-header-bar"
                :style="{
            backgroundColor: previewColors.accent,
            color: isLightColor(previewColors.accent) ? '#000' : '#fff'
          }">

          <div class="ph-logo">MyApp</div>

          <nav class="ph-nav">
            <a href="javascript:void(0)" class="ph-link">Главная</a>
            <a href="javascript:void(0)" class="ph-link">Каталог</a>
            <a href="javascript:void(0)" class="ph-link">Контакты</a>
          </nav>

          <button class="ph-login-btn"
                  :style="{
             backgroundColor: previewColors.primary,
             color: isLightColor(previewColors.primary) ? '#000' : '#fff'
           }">
            Войти
          </button>
        </header>

        <div class="preview-layout">

          <!-- SIDEBAR -->
          <aside class="ph-sidebar"
                 :style="{
             backgroundColor: previewColors.surface,
             borderColor: previewColors.border,
             color: previewColors.text
           }">

            <div class="ph-side-title">Меню</div>

            <ul class="ph-side-menu">
              <li class="ph-item">Профиль</li>
              <li class="ph-item">Проекты</li>
              <li class="ph-item">Статистика</li>
              <li class="ph-item">Настройки</li>
            </ul>
          </aside>

          <!-- MAIN CONTENT -->
          <main class="ph-main">
            <h2 class="ph-title">Попробуйте вашу палитру в интерфейсе</h2>

            <div class="ph-card"
                 :style="{
             backgroundColor: previewColors.surface,
             borderColor: previewColors.border,
             color: previewColors.text
           }">
              <h3>Карточка товара</h3>
              <p>Это демонстрация текстов, кнопок и тегов в вашем цветовом наборе.</p>

              <div class="ph-tags">
          <span class="ph-tag"
                :style="{
                  backgroundColor: previewColors.secondary,
                  color: isLightColor(previewColors.secondary) ? '#000' : '#fff'
                }">
            New
          </span>
                <span class="ph-tag"
                      :style="{
                  backgroundColor: previewColors.primary,
                  color: isLightColor(previewColors.primary) ? '#000' : '#fff'
                }">
            -50%
          </span>
              </div>

              <div class="ph-buttons">
                <button class="ph-btn primary"
                        :style="{
                    backgroundColor: previewColors.primary,
                    color: isLightColor(previewColors.primary) ? '#000' : '#fff'
                  }">
                  Купить
                </button>

                <button class="ph-btn secondary"
                        :style="{
                    backgroundColor: previewColors.secondary,
                    color: isLightColor(previewColors.secondary) ? '#000' : '#fff'
                  }">
                  В корзину
                </button>
              </div>
            </div>
          </main>
        </div>

        <!-- FOOTER -->
        <footer class="ph-footer"
                :style="{
            backgroundColor: previewColors.secondary,
            color: isLightColor(previewColors.secondary) ? '#000' : '#fff'
          }">
          © 2025 Demo interface preview
        </footer>

      </div>

    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { PaletteStore } from '../utils/paletteStore'

export default {
  name: 'PaletteGenerator',

  setup() {
    const router = useRouter()
    const notify = inject('notify')
    const showConfirm = inject('showConfirm')

    // Основные реактивные переменные
    const colorCount = ref(5)
    const colorFormat = ref('hex')
    const previewDarkMode = ref(false)
    const currentPalette = ref([])
    const savedPalettes = ref([])

    const paletteType = ref('random')

    // Компьютед свойства
    const canSave = computed(() => {
      return currentPalette.value.length > 0
    })

    const previewColors = computed(() => {
      const p = currentPalette.value

      return {
        bg: p[0]?.hex || "#ffffff",
        primary: p[1]?.hex || "#667eea",
        secondary: p[2]?.hex || "#e2e8f0",
        accent: p[3]?.hex || p[1]?.hex || "#764ba2",
        text: p[4]?.hex || (p[0]?.isLight ? "#000" : "#fff"),
        border: p[5]?.hex || "rgba(0,0,0,0.15)",
        surface: p[6]?.hex || "#f1f5f9"
      }
    })

    const accessibilityScore = computed(() => {
      if (currentPalette.value.length === 0) return 85
      const scores = currentPalette.value.map(color => color.isLight ? 90 : 80)
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    })

    const contrastRating = computed(() => {
      if (currentPalette.value.length < 2) return 'A'
      const contrasts = []
      for (let i = 0; i < Math.min(currentPalette.value.length, 3); i++) {
        for (let j = i + 1; j < Math.min(currentPalette.value.length, 3); j++) {
          const contrast = calculateContrast(currentPalette.value[i].hex, currentPalette.value[j].hex)
          if (contrast >= 7) contrasts.push('AAA')
          else if (contrast >= 4.5) contrasts.push('AA')
          else contrasts.push('A')
        }
      }
      return contrasts.includes('AAA') ? 'AAA' : contrasts.includes('AA') ? 'AA' : 'A'
    })

    const colorHarmony = computed(() => {
      if (currentPalette.value.length < 2) return 'Хорошая'
      const harmonies = ['Отличная', 'Хорошая', 'Удовлетворительная']
      const avgSaturation = currentPalette.value.reduce((sum, color) => {
        const hsl = hexToHsl(color.hex)
        return sum + hsl.s
      }, 0) / currentPalette.value.length

      return avgSaturation > 50 ? harmonies[0] : avgSaturation > 30 ? harmonies[1] : harmonies[2]
    })

    const previewCardStyle = computed(() => {
      return {
        backgroundColor: previewDarkMode.value ? "#1a1e29" : previewColors.value.bg,
        color: previewColors.value.text,
        border: `1px solid ${previewColors.value.border}`
      }
    })

    const previewButtonStyle = computed(() => ({
      backgroundColor: previewColors.value.primary,
      color: isLightColor(previewColors.value.primary) ? "#000" : "#fff"
    }))

    const previewSecondaryButtonStyle = computed(() => ({
      backgroundColor: previewColors.value.secondary,
      color: isLightColor(previewColors.value.secondary) ? "#000" : "#fff"
    }))

    // Вспомогательные функции
    const generateRandomColor = () => {
      const letters = '0123456789ABCDEF'
      let color = '#'
      for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)]
      }
      return color
    }

    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ?
          `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` :
          null
    }

    const rgbToHex = (r, g, b) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)
    }

    const hexToHsl = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      let r = parseInt(result[1], 16) / 255
      let g = parseInt(result[2], 16) / 255
      let b = parseInt(result[3], 16) / 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2

      if (max === min) {
        h = s = 0 // achromatic
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }

        h /= 6
      }

      return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
      }
    }

    const hslToHex = (h, s, l) => {
      h /= 360
      s /= 100
      l /= 100

      let r, g, b

      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1/6) return p + (q - p) * 6 * t
          if (t < 1/2) return q
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
          return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q

        r = hue2rgb(p, q, h + 1/3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1/3)
      }

      const toHex = (x) => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    const adjustColor = (hex, saturationDelta = 0, brightnessDelta = 0) => {
      const hsl = hexToHsl(hex)
      let newS = Math.max(0, Math.min(100, hsl.s + saturationDelta))
      let newL = Math.max(0, Math.min(100, hsl.l + brightnessDelta))

      return hslToHex(hsl.h, newS, newL)
    }

    const isLightColor = (hex) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return false
      const [r, g, b] = rgb.match(/\d+/g).map(Number)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 128
    }

    const calculateContrast = (color1, color2) => {
      const rgb1 = hexToRgb(color1).match(/\d+/g).map(Number)
      const rgb2 = hexToRgb(color2).match(/\d+/g).map(Number)

      const lum1 = (0.2126 * rgb1[0] + 0.7152 * rgb1[1] + 0.0722 * rgb1[2]) / 255
      const lum2 = (0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2]) / 255

      const brightest = Math.max(lum1, lum2)
      const darkest = Math.min(lum1, lum2)

      return (brightest + 0.05) / (darkest + 0.05)
    }

    const generateHarmoniousPalette = (type, baseColor = null) => {
      const baseHex = baseColor || generateRandomColor()
      const baseHsl = hexToHsl(baseHex)
      const colors = [baseHex]

      switch (type) {
        case 'analogous':
          // 30 градусов разницы
          for (let i = 1; i < colorCount.value; i++) {
            const hue = (baseHsl.h + i * 30) % 360
            colors.push(hslToHex(hue, baseHsl.s, baseHsl.l))
          }
          break

        case 'complementary':
          // Основной цвет + противоположный
          colors.push(hslToHex((baseHsl.h + 180) % 360, baseHsl.s, baseHsl.l))
          // Дополнительные цвета
          for (let i = 2; i < colorCount.value; i++) {
            const hue = (baseHsl.h + i * 60) % 360
            colors.push(hslToHex(hue, baseHsl.s, baseHsl.l))
          }
          break

        case 'triadic':
          // Триадная схема (120 градусов)
          for (let i = 1; i < colorCount.value; i++) {
            const hue = (baseHsl.h + i * 120) % 360
            colors.push(hslToHex(hue, baseHsl.s, baseHsl.l))
          }
          break

        case 'monochromatic':
          // Оттенки одного цвета
          for (let i = 1; i < colorCount.value; i++) {
            const lightness = Math.max(10, Math.min(90, baseHsl.l + (i * 15 - 30)))
            colors.push(hslToHex(baseHsl.h, baseHsl.s, lightness))
          }
          break

        default: // random
          for (let i = 1; i < colorCount.value; i++) {
            colors.push(generateRandomColor())
          }
      }

      return colors.map(hex => ({
        hex,
        rgb: hexToRgb(hex),
        locked: false,
        copied: false,
        isLight: isLightColor(hex)
      }))
    }

    // Основные методы
    const setColorCount = (count) => {
      colorCount.value = count
      if (currentPalette.value.length > count) {
        currentPalette.value = currentPalette.value.slice(0, count)
      } else if (currentPalette.value.length < count) {
        const needed = count - currentPalette.value.length
        for (let i = 0; i < needed; i++) {
          addColor()
        }
      }
    }

    const generatePalette = () => {
      // Оставляем заблокированные цвета
      const lockedColors = currentPalette.value.filter(color => color.locked)

      const newPalette = []

      // Если есть заблокированные цвета - оставляем их
      if (lockedColors.length > 0) {
        newPalette.push(...lockedColors)
      }

      // Добавляем случайные цвета до нужного количества
      const needed = colorCount.value - newPalette.length
      for (let i = 0; i < needed; i++) {
        const hex = generateRandomColor()
        newPalette.push({
          hex,
          rgb: hexToRgb(hex),
          locked: false,
          copied: false,
          isLight: isLightColor(hex)
        })
      }

      currentPalette.value = newPalette
      notify.success('Палитра сгенерирована!')
    }

    const copyToClipboard = async (color) => {
      const textToCopy = colorFormat.value === 'hex' ? color.hex : color.rgb

      try {
        await navigator.clipboard.writeText(textToCopy)
        color.copied = true
        notify.success('Цвет скопирован!')

        setTimeout(() => {
          color.copied = false
        }, 2000)
      } catch (err) {
        console.error('Ошибка копирования:', err)
        // Fallback
        const textArea = document.createElement('textarea')
        textArea.value = textToCopy
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        color.copied = true
        notify.success('Цвет скопирован!')
        setTimeout(() => {
          color.copied = false
        }, 2000)
      }
    }

    const toggleLock = (index) => {
      currentPalette.value[index].locked = !currentPalette.value[index].locked
    }

    const removeColor = (index) => {
      if (currentPalette.value.length > 1) {
        currentPalette.value.splice(index, 1)
      } else {
        notify.warning('Палитра должна содержать хотя бы один цвет')
      }
    }

    const addColor = () => {
      const hex = generateRandomColor()
      currentPalette.value.push({
        hex,
        rgb: hexToRgb(hex),
        locked: false,
        copied: false,
        isLight: isLightColor(hex)
      })
    }

    const shuffleColors = () => {
      const unlockedColors = currentPalette.value.filter(c => !c.locked)
      const lockedColors = currentPalette.value.filter(c => c.locked)

      // Перемешиваем только разблокированные цвета
      for (let i = unlockedColors.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [unlockedColors[i], unlockedColors[j]] = [unlockedColors[j], unlockedColors[i]]
      }

      currentPalette.value = [...lockedColors, ...unlockedColors].slice(0, colorCount.value)
    }

    const invertColors = () => {
      currentPalette.value.forEach((color, index) => {
        if (!color.locked) {
          const rgb = hexToRgb(color.hex).match(/\d+/g).map(Number)
          const inverted = rgbToHex(255 - rgb[0], 255 - rgb[1], 255 - rgb[2])
          currentPalette.value[index].hex = inverted
          currentPalette.value[index].rgb = hexToRgb(inverted)
          currentPalette.value[index].isLight = isLightColor(inverted)
        }
      })
    }

    const saveToLibrary = async () => {
      if (currentPalette.value.length === 0) {
        notify.warning('Добавьте цвета в палитру')
        return
      }

      const name = prompt('Введите название для палитры:', `Палитра ${new Date().toLocaleDateString('ru-RU')}`)
      if (!name) return

      const description = prompt('Введите описание (необязательно):', '')
      const tagsInput = prompt('Введите теги через запятую (необязательно):', '')

      const tags = tagsInput
          ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag)
          : []

      const newPalette = {
        id: Date.now(),
        name: name.trim(),
        description: description?.trim() || '',
        colors: currentPalette.value.map(c => c.hex),
        tags,
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      PaletteStore.add(newPalette)
      refreshSavedPalettes()
      notify.success(`Палитра "${name}" сохранена в библиотеку!`)
    }

    const loadPalette = (palette) => {
      currentPalette.value = palette.colors.map(color => ({
        hex: color,
        rgb: hexToRgb(color),
        locked: false,
        copied: false,
        isLight: isLightColor(color)
      }))
      PaletteStore.setCurrent(currentPalette.value)
      notify.success(`Палитра "${palette.name}" загружена!`)
    }

    const copyPalette = (palette) => {
      const paletteString = JSON.stringify(palette, null, 2)
      navigator.clipboard.writeText(paletteString)
          .then(() => notify.success('Палитра скопирована в буфер!'))
          .catch(err => {
            console.error('Ошибка копирования:', err)
            notify.error('Ошибка копирования')
          })
    }

    const previewCardBackground = computed(() => {
      if (!currentPalette.value.length) return '#ffffff'

      const base = currentPalette.value[0]
      return darkMode.value
          ? base.isLight ? '#1a1a1a' : '#2a2a2a'
          : '#ffffff'
    })

    const toggleFavorite = (palette) => {
      const updated = { ...palette, featured: !palette.featured }
      PaletteStore.update(palette.id, updated)
      refreshSavedPalettes()
      notify.success(updated.featured ? 'Добавлено в избранное' : 'Убрано из избранного')
    }

    const deletePalette = async (palette) => {
      const confirmed = await showConfirm({
        title: 'Удаление палитры',
        message: `Вы уверены, что хотите удалить палитру "${palette.name}"?`,
        confirmText: 'Удалить',
        cancelText: 'Отмена'
      })

      if (confirmed) {
        PaletteStore.delete(palette.id)
        refreshSavedPalettes()
        notify.success('Палитра удалена!')
      }
    }

    const exportPalette = () => {
      if (currentPalette.value.length === 0) {
        notify.warning('Добавьте цвета в палитру')
        return
      }

      const paletteData = {
        name: `Палитра ${new Date().toLocaleDateString('ru-RU')}`,
        colors: currentPalette.value.map(c => ({
          hex: c.hex,
          rgb: c.rgb,
          isLight: c.isLight
        })),
        exportedAt: new Date().toISOString(),
        source: 'Генератор палитр'
      }

      const dataStr = JSON.stringify(paletteData, null, 2)
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)

      const exportFileDefaultName = `palette-${new Date().toISOString().split('T')[0]}.json`

      const linkElement = document.createElement('a')
      linkElement.setAttribute('href', dataUri)
      linkElement.setAttribute('download', exportFileDefaultName)
      document.body.appendChild(linkElement)
      linkElement.click()
      document.body.removeChild(linkElement)

      notify.success('Палитра экспортирована!')
    }

    const clearPalette = async () => {
      if (currentPalette.value.length === 0) return

      const confirmed = await showConfirm({
        title: 'Очистка палитры',
        message: 'Вы уверены, что хотите очистить текущую палитру?',
        confirmText: 'Очистить',
        cancelText: 'Отмена'
      })

      if (confirmed) {
        currentPalette.value = []
        PaletteStore.setCurrent([])
        notify.success('Палитра очищена!')
      }
    }

    const refreshSavedPalettes = () => {
      // Загружаем последние 6 палитр из библиотеки
      savedPalettes.value = PaletteStore.getAll()
          .slice(0, 6)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    // Сохранение текущей палитры при изменении
    watch(currentPalette, (newPalette) => {
      if (newPalette.length > 0) {
        PaletteStore.setCurrent(newPalette.map(color => ({
          hex: color.hex,
          rgb: color.rgb,
          isLight: color.isLight
        })))
      }
    }, { deep: true })

    // Загрузка данных при монтировании
    onMounted(() => {
      refreshSavedPalettes()

      const savedCurrent = PaletteStore.getCurrent()
      if (savedCurrent && savedCurrent.length > 0) {
        currentPalette.value = savedCurrent.map(color => ({
          ...color,
          locked: false,
          copied: false
        }))
      } else {
        generatePalette()
      }
    })

    return {
      colorCount,
      colorFormat,
      previewDarkMode,
      currentPalette,
      savedPalettes,
      canSave,
      accessibilityScore,
      contrastRating,
      colorHarmony,
      previewCardStyle,
      previewButtonStyle,
      previewSecondaryButtonStyle,
      setColorCount,
      generatePalette,
      copyToClipboard,
      toggleLock,
      removeColor,
      addColor,
      shuffleColors,
      invertColors,
      saveToLibrary,
      loadPalette,
      copyPalette,
      toggleFavorite,
      deletePalette,
      exportPalette,
      clearPalette,
      refreshSavedPalettes,
      paletteType,
      isLightColor,
      previewColors
    }
  }
}
</script>

<style scoped>
.palette-generator {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  padding: 40px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
}

.hero-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 16px;
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.hero-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  line-height: 1.6;
}

.controls-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

body.dark-theme .controls-section {
  background: #2d3748;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 20px;
}

.controls-row:last-child {
  margin-bottom: 0;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.control-group label {
  font-weight: 600;
  color: #2d3748;
  font-size: 0.9rem;
}

body.dark-theme .control-group label {
  color: #e2e8f0;
}

.number-buttons,
.palette-type-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.count-btn,
.type-btn {
  padding: 10px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

body.dark-theme .count-btn,
body.dark-theme .type-btn {
  background: #4a5568;
  border-color: #718096;
  color: #e2e8f0;
}

.count-btn:hover,
.type-btn:hover {
  border-color: #667eea;
  transform: translateY(-2px);
}

.count-btn.active,
.type-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(72, 187, 120, 0.3);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

body.dark-theme .btn-secondary {
  background: #4a5568;
  color: #e2e8f0;
}

.btn-secondary:hover:not(:disabled) {
  background: #cbd5e0;
  transform: translateY(-3px);
}

body.dark-theme .btn-secondary:hover:not(:disabled) {
  background: #718096;
}

.btn-icon {
  font-size: 1.2rem;
}

.color-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 250px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #4a5568;
}

body.dark-theme .slider-group label {
  color: #e2e8f0;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #e2e8f0;
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #667eea;
  cursor: pointer;
  border: 3px solid white;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.palette-container {
  margin-bottom: 40px;
}

.palette-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.color-item {
  border-radius: 12px;
  overflow: hidden;
  height: 180px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.color-item:hover {
  transform: translateY(-5px);
}

.color-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.text-dark {
  color: #fff;
}

.text-light {
  color: #000;
}

.color-value {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.color-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  color: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.lock-btn:hover {
  background: rgba(255, 235, 59, 0.3);
}

.remove-btn:hover {
  background: rgba(244, 67, 54, 0.3);
}

.delete-btn:hover {
  background: rgba(245, 101, 101, 0.3);
}

.copied-badge {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.palette-actions-bottom {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.saved-palettes-section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 1.5rem;
  margin: 0;
}

body.dark-theme .section-title {
  color: #fff;
}

.refresh-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #667eea;
  transition: transform 0.3s;
}

.refresh-btn:hover {
  transform: rotate(180deg);
}

.palettes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.saved-palette-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
}

body.dark-theme .saved-palette-card {
  background: #2d3748;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.saved-palette-card:hover {
  transform: translateY(-5px);
}

.palette-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.palette-name {
  margin: 0;
  font-size: 1.1rem;
  color: #2d3748;
  font-weight: 600;
}

body.dark-theme .palette-name {
  color: #e2e8f0;
}

.palette-badges {
  display: flex;
  gap: 6px;
}

.badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.featured {
  background: #fff3cd;
  color: #856404;
}

body.dark-theme .badge.featured {
  background: #4a5568;
  color: #f6e05e;
}

.badge.count {
  background: #e2e8f0;
  color: #4a5568;
}

body.dark-theme .badge.count {
  background: #4a5568;
  color: #e2e8f0;
}

.palette-colors {
  display: flex;
  gap: 8px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.palette-color {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.more-colors {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: #718096;
  font-weight: 600;
}

body.dark-theme .more-colors {
  background: #4a5568;
  color: #a0aec0;
}

.palette-actions {
  display: flex;
  gap: 8px;
}

.load-btn:hover {
  background: rgba(102, 126, 234, 0.3);
}

.edit-btn:hover {
  background: rgba(66, 153, 225, 0.3);
}

.copy-btn:hover {
  background: rgba(159, 122, 234, 0.3);
}

.favorite-btn:hover {
  background: rgba(246, 224, 94, 0.3);
}

.delete-btn:hover {
  background: rgba(245, 101, 101, 0.3);
}

.preview-section {
  background: var(--bg-secondary);
  border-radius: 16px;
  padding: 24px;
  transition: 0.25s ease;
  color: var(--text-primary);
}

.preview-section.dark-mode {
  background: #1a1e29 !important; /* Чистый, красивый тёмный фон */
  color: #f1f5f9 !important;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
}

.preview-section.dark-mode .preview-header h3 {
  color: #ffffff !important;
}

.preview-controls {
  display: flex;
  gap: 12px;
}

.toggle-theme-btn {
  padding: 8px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-theme-btn:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.preview-content {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.preview-card {
  flex: 1;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: 0.25s ease;
}

.preview-section.dark-mode .preview-card {
  box-shadow: 0 4px 16px rgba(255,255,255,0.08);
}
body.dark-theme .preview-card {
  color: #e2e8f0;
}

.preview-card h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1.2rem;
  font-weight: 700;
  color: inherit;
}

.preview-card p {
  margin-bottom: 20px;
  color: #718096;
}

.preview-section.dark-mode .preview-card p,
body.dark-theme .preview-card p {
  color: #cbd5e0;
}

.preview-actions {
  display: flex;
  gap: 12px;
}

.preview-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn {
  background: #667eea;
  color: white;
}

.primary-btn:hover {
  background: #5a67d8;
}

.secondary-btn {
  background: #e2e8f0;
  color: #4a5568;
}

.preview-section.dark-mode .secondary-btn,
body.dark-theme .secondary-btn {
  background: #4a5568;
  color: #e2e8f0;
}

.secondary-btn:hover {
  background: #cbd5e0;
}

.preview-section.dark-mode .secondary-btn:hover,
body.dark-theme .secondary-btn:hover {
  background: #718096;
}

.preview-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  min-width: 100px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
}

body.dark-theme .stat-item,
.preview-section.dark-mode .stat-item {
  background: #4a5568;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 4px;
}

body.dark-theme .stat-value,
.preview-section.dark-mode .stat-value {
  color: #9f7aea;
}

.stat-label {
  font-size: 0.9rem;
  color: #718096;
}

body.dark-theme .stat-label,
.preview-section.dark-mode .stat-label {
  color: #cbd5e0;
}

@media (max-width: 768px) {
  .palette-generator {
    padding: 20px 15px;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-section {
    padding: 30px 15px;
  }

  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }

  .color-controls {
    min-width: auto;
  }

  .palette-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .palettes-grid {
    grid-template-columns: 1fr;
  }

  .preview-content {
    flex-direction: column;
  }

  .preview-card {
    min-width: auto;
  }

  .preview-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .color-item {
    height: 160px;
  }
}
.preview-card {
  --accent: #667eea;
}

.preview-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.preview-btn:hover {
  opacity: 0.9;
  background-color: var(--accent) !important;
}

.full-preview {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* HEADER */
.preview-header-bar {
  padding: 14px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ph-logo {
  font-size: 1.4rem;
  font-weight: 800;
}

.ph-nav {
  display: flex;
  gap: 20px;
}

.ph-link {
  text-decoration: none;
  font-weight: 600;
  opacity: 0.9;
}

.ph-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.ph-login-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

/* LAYOUT */
.preview-layout {
  display: flex;
  gap: 20px;
}

.ph-sidebar {
  width: 220px;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid;
}

.ph-side-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.ph-side-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ph-item {
  padding: 8px 0;
  cursor: pointer;
  opacity: 0.9;
}

.ph-item:hover {
  opacity: 1;
}

/* MAIN */
.ph-main {
  flex: 1;
}

.ph-title {
  margin-bottom: 16px;
}

.ph-card {
  border: 1px solid;
  padding: 20px;
  border-radius: 12px;
}

.ph-tags {
  display: flex;
  gap: 8px;
  margin: 12px 0;
}

.ph-tag {
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
}

.ph-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.ph-btn {
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

/* FOOTER */
.ph-footer {
  padding: 14px 24px;
  border-radius: 12px;
  text-align: center;
  font-weight: 600;
}

/* MOBILE */
@media (max-width: 850px) {
  .preview-layout {
    flex-direction: column;
  }

  .ph-sidebar {
    width: 100%;
  }
}

</style>