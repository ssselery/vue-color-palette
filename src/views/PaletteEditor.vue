<template>
  <div class="palette-editor">
    <!-- HEADER -->
    <div class="editor-header">
      <h1>✏️ Редактор палитры</h1>
      <p style="color: #fff">Создавайте и редактируйте идеальные цветовые схемы</p>
    </div>

    <div class="editor-container">
      <!-- LEFT SIDEBAR -->
      <div class="editor-sidebar">
        <h3>Инструменты</h3>

        <!-- PALETTE TYPES -->
        <div class="tool-section">
          <h4>Тип палитры</h4>
          <div class="palette-types">
            <button
                v-for="type in paletteTypes"
                :key="type.id"
                class="type-btn"
                :class="{ active: selectedType.id === type.id }"
                @click="selectPaletteType(type)"
            >
              {{ type.icon }} {{ type.name }}
            </button>
          </div>
        </div>

        <!-- SETTINGS -->
        <div class="tool-section">
          <h4>Настройки</h4>

          <label class="checkbox-option">
            <input type="checkbox" v-model="settings.harmony">
            Автогармония
          </label>

          <label class="checkbox-option">
            <input type="checkbox" v-model="settings.contrast">
            Контраст текста
          </label>

          <div class="range-group">
            <label>Насыщенность</label>
            <input type="range" v-model="settings.saturation" min="0" max="100">
            <span>{{ settings.saturation }}%</span>
          </div>

          <div class="range-group">
            <label>Яркость</label>
            <input type="range" v-model="settings.lightness" min="0" max="100">
            <span>{{ settings.lightness }}%</span>
          </div>
        </div>
      </div>

      <!-- MAIN AREA -->
      <div class="editor-main">

        <!-- PALETTE GRID -->
        <div class="color-canvas">
          <div
              v-for="(color, index) in paletteColors"
              :key="index"
              class="canvas-color"
              :style="{ backgroundColor: color }"
              @click="openColorPicker(index)"
          >
            <div class="color-info">
              <span class="color-hex">{{ color }}</span>

              <div class="color-actions">
                <button @click.stop="toggleLock(index)" class="canvas-action-btn">
                  {{ lockedColors[index] ? '🔒' : '🔓' }}
                </button>

                <button @click.stop="removeColor(index)" class="canvas-action-btn">
                  🗑️
                </button>
              </div>
            </div>
          </div>

          <button class="add-canvas-color" @click="addColor">+</button>
        </div>

        <!-- PALETTE ACTIONS -->
        <div class="editor-actions">
          <button @click="generatePalette" class="btn btn-primary">🎲 Сгенерировать</button>
          <button @click="savePalette" class="btn btn-success">💾 Сохранить</button>
          <button @click="resetPalette" class="btn btn-secondary">🔄 Сбросить</button>
          <button @click="exportPalette" class="btn btn-info">📤 Экспорт</button>
        </div>

        <!-- PREVIEW -->
        <div class="palette-preview">
          <h3>Предпросмотр</h3>
          <div class="preview-elements">
            <div
                class="preview-element"
                v-for="(color, index) in paletteColors.slice(0, 5)"
                :key="index"
            >
              <div class="element-color" :style="{ backgroundColor: color }"></div>
              <span class="element-label">Цвет {{ index + 1 }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL COLOR PICKER -->
    <div v-if="activeColorIndex !== null" class="color-modal">
      <div class="modal-content">
        <ColorPicker
            v-model="paletteColors[activeColorIndex]"
            label="Изменить цвет"
            @confirm="closeColorPicker"
            @cancel="closeColorPicker"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { ref, watch } from 'vue'
import ColorPicker from '../components/ColorPicker.vue'
import { PaletteStore } from '../utils/paletteStore'

export default {
  name: 'PaletteEditor',
  components: { ColorPicker },

  setup() {
    const baseColor = ref('#667eea')
    const paletteColors = ref([
      '#667eea', '#764ba2', '#f56565', '#48bb78', '#ed8936'
    ])
    const lockedColors = ref([false, false, false, false, false])

    const selectedType = ref({
      id: 'analogous',
      name: 'Аналогичная',
      icon: '🎨'
    })

    const paletteTypes = [
      { id: 'analogous', name: 'Аналогичная', icon: '🎨' },
      { id: 'monochromatic', name: 'Монохромная', icon: '⚫' },
      { id: 'triadic', name: 'Триадная', icon: '🔺' },
      { id: 'complementary', name: 'Комплементарная', icon: '🔄' },
      { id: 'random', name: 'Случайная', icon: '🎲' }
    ]

    const settings = ref({
      harmony: true,
      contrast: true,
      saturation: 60,
      lightness: 50
    })

    const activeColorIndex = ref(null)

    /* ========================
       COLOR GENERATORS
    =========================== */

    const randomHex = () =>
        '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')

    const hexToHsl = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)

      let h, s
      let l = (max + min) / 2

      if (max === min) {
        h = s = 0
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

      const toHex = x => {
        const hex = Math.round(x * 255).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }

      return `#${toHex(r)}${toHex(g)}${toHex(b)}`
    }

    const shiftHue = (hex, deg) => {
      const hsl = hexToHsl(hex)
      let h = (hsl.h + deg) % 360
      if (h < 0) h += 360
      return hslToHex(h, hsl.s, hsl.l)
    }

    const lightenColor = (hex, amount) => {
      const hsl = hexToHsl(hex)
      return hslToHex(hsl.h, hsl.s, Math.min(100, hsl.l + amount))
    }

    const darkenColor = (hex, amount) => {
      const hsl = hexToHsl(hex)
      return hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l - amount))
    }

    const adjustSaturation = (hex, slider) => {
      const hsl = hexToHsl(hex)
      const mult = slider / 50
      return hslToHex(hsl.h, Math.min(100, Math.round(hsl.s * mult)), hsl.l)
    }

    const adjustLightness = (hex, slider) => {
      const hsl = hexToHsl(hex)
      const delta = slider - 50
      return hslToHex(hsl.h, hsl.s, Math.max(0, Math.min(100, hsl.l + delta)))
    }

    /* ========================
       PROCESS COLOR
    =========================== */

    const processColor = (hex) => {
      let c = hex

      if (settings.value.harmony) {
        c = adjustSaturation(c, settings.value.saturation)
        c = adjustLightness(c, settings.value.lightness)
      }

      if (settings.value.contrast) {
        const hsl = hexToHsl(c)
        c = hsl.l > 60 ? darkenColor(c, 20) : lightenColor(c, 20)
      }

      return c
    }

    /* ========================
       GENERATION
    =========================== */

    const generatePalette = () => {
      const base = baseColor.value
      const result = []

      const TYPE = selectedType.value.id

      const types = {
        analogous() {
          ;[0, 30, 60, 90, 120].forEach(deg =>
              result.push(shiftHue(base, deg))
          )
        },
        monochromatic() {
          result.push(
              lightenColor(base, 20),
              lightenColor(base, 40),
              base,
              darkenColor(base, 20),
              darkenColor(base, 40)
          )
        },
        complementary() {
          result.push(
              base,
              shiftHue(base, 180),
              shiftHue(base, 90),
              shiftHue(base, -90),
              lightenColor(base, 20)
          )
        },
        triadic() {
          result.push(
              base,
              shiftHue(base, 120),
              shiftHue(base, 240),
              shiftHue(base, 60),
              shiftHue(base, 180)
          )
        },
        random() {
          for (let i = 0; i < 5; i++) result.push(randomHex())
        }
      }

      types[TYPE]()

      paletteColors.value = result.map((c, i) =>
          lockedColors.value[i] ? paletteColors.value[i] : processColor(c)
      )
    }

    /* AUTO REGENERATE */
    watch(settings, generatePalette, { deep: true })

    /* ========================
       IMPORTANT!!!
       selectPaletteType FIXED
    =========================== */

    const selectPaletteType = (type) => {
      selectedType.value = type
      generatePalette()
    }

    /* ========================
       COLOR PICKER
    =========================== */

    const openColorPicker = index => activeColorIndex.value = index
    const closeColorPicker = () => activeColorIndex.value = null

    /* ========================
       OTHER
    =========================== */

    const addColor = () => {
      paletteColors.value.push(randomHex())
      lockedColors.value.push(false)
    }

    const removeColor = index => {
      paletteColors.value.splice(index, 1)
      lockedColors.value.splice(index, 1)
    }

    const toggleLock = index => {
      lockedColors.value[index] = !lockedColors.value[index]
    }

    const resetPalette = () => {
      baseColor.value = '#667eea'
      paletteColors.value = ['#667eea','#764ba2','#f56565','#48bb78','#ed8936']
      lockedColors.value = [false,false,false,false,false]
      selectedType.value = paletteTypes[0]
    }

    const savePalette = () => {
      PaletteStore.add({
        id: Date.now(),
        name: `Палитра ${new Date().toLocaleDateString()}`,
        colors: paletteColors.value,
        type: selectedType.value.name
      })
      alert('Палитра сохранена!')
    }

    const exportPalette = () => {
      const data = JSON.stringify({
        baseColor: baseColor.value,
        type: selectedType.value.name,
        colors: paletteColors.value
      }, null, 2)

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = 'palette.json'
      a.click()
      URL.revokeObjectURL(url)
    }

    /* INIT */
    generatePalette()

    return {
      baseColor,
      paletteColors,
      lockedColors,
      selectedType,
      paletteTypes,
      settings,
      activeColorIndex,

      selectPaletteType,  // ← ВАЖНО — ФУНКЦИЯ ВОЗВРАЩАЕТСЯ
      generatePalette,
      addColor,
      removeColor,
      toggleLock,
      resetPalette,
      savePalette,
      exportPalette,

      openColorPicker,
      closeColorPicker
    }
  }

}
</script>
<style scoped>

/* чуть больше отступа у заголовков */
.editor-sidebar h3,
.tool-section h4,
.range-group label,
.checkbox-option,
.editor-header p {
  padding-left: 6px;
}

/* ————————————————————————————— */
/* LAYOUT */
/* ————————————————————————————— */

.palette-editor {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
  color: #000; /* БАЗОВЫЙ ЧЁРНЫЙ ТЕКСТ */
}

.editor-header {
  text-align: center;
  margin-bottom: 40px;
}

.editor-header h1 {
  font-size: 2.4rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.editor-header p {
  opacity: 0.7;
}

/* GRID */
.editor-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
}

@media (max-width: 1000px) {
  .editor-container {
    grid-template-columns: 1fr;
  }
}

/* ————————————————————————————— */
/* SIDEBAR */
/* ————————————————————————————— */

.editor-sidebar {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  color: inherit;
}

.tool-section {
  margin-bottom: 32px;
}

.palette-types {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.type-btn {
  padding: 12px 16px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 600;
  color: #4a5568;
  transition: 0.2s;
}

.type-btn:hover {
  background: #edf2f7;
}

.type-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
}

/* CHECKBOXES */
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.range-group {
  margin-bottom: 20px;
}

/* ————————————————————————————— */
/* MAIN CANVAS */
/* ————————————————————————————— */

.editor-main {
  background: #ffffff;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  color: inherit;
}

.color-canvas {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.canvas-color {
  height: 200px;
  border-radius: 12px;
  position: relative;
  cursor: pointer;
  overflow: hidden;
  transition: 0.2s;
}

.canvas-color:hover {
  transform: translateY(-4px);
}

.color-info {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: rgba(0,0,0,0.6);
  padding: 12px;
  color: white;
  opacity: 0;
  transform: translateY(100%);
  transition: 0.2s;
}

.canvas-color:hover .color-info {
  opacity: 1;
  transform: translateY(0);
}

.color-actions {
  display: flex;
  gap: 10px;
}

/* кнопки внутри карточки */
.canvas-action-btn {
  flex: 1;
  background: rgba(255,255,255,0.2);
  border: none;
  color: white;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
}

/* ADD COLOR BUTTON */

.add-canvas-color {
  height: 200px;
  border: 3px dashed #cbd5e0;
  border-radius: 12px;
  background: #f7fafc;
  font-size: 3rem;
  color: #a0aec0;
  cursor: pointer;
  transition: 0.2s;
}

.add-canvas-color:hover {
  background: #edf2f7;
}

/* ————————————————————————————— */
/* ACTION BUTTONS */
/* ————————————————————————————— */

.editor-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.btn-secondary {
  background: #e2e8f0;
}

.btn-info {
  background: linear-gradient(135deg, #4299e1, #3182ce);
  color: white;
}

/* ————————————————————————————— */
/* PREVIEW */
/* ————————————————————————————— */

.palette-preview {
  background: #f7fafc;
  padding: 16px;
  border-radius: 12px;
  color: inherit;
}

.preview-elements {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.element-color {
  width: 60px;
  height: 60px;
  border-radius: 10px;
}

/* ————————————————————————————— */
/* MODAL */
/* ————————————————————————————— */

.color-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 16px;
}

.range-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.range-group label {
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: -2px;
}

.range-group input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 4px;
  background: #d1d5db;
  outline: none;
  transition: background-color 0.2s ease;
}

/* Ползунок */
.range-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  height: 18px;
  width: 18px;
  border-radius: 50%;
  background: #4f46e5; /* фиолетовый */
  cursor: pointer;
  transition: transform 0.15s ease;
}

.range-group input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.15);
}

.range-group span {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: -4px;
}

/* Тёмная тема */
body.dark-theme .palette-editor .range-group label,
body.dark-theme .palette-editor .range-group span {
  color: #ffffff !important;
}

body.dark-theme .palette-editor .range-group input[type="range"] {
  background: #374151 !important;
}

body.dark-theme .palette-editor .range-group input[type="range"]::-webkit-slider-thumb {
  background: #818cf8 !important; /* светлее, лучше видно */
}

</style>
<style>
/* ========= DARK THEME FIXED ========= */
/* текст ЧЁРНЫЙ */
/* фон — мягкий серо-синий, читаемый */
/*body.dark-theme .palette-editor h1,
body.dark-theme .palette-editor h2,
body.dark-theme .palette-editor h3,
body.dark-theme .palette-editor h4,
body.dark-theme .palette-editor .element-label {
  color: #000 !important;
}
*/

/* БЛОКИ */
body.dark-theme .palette-editor .editor-sidebar,
body.dark-theme .palette-editor .editor-main,
body.dark-theme .palette-editor .palette-preview {
  background: #e3e8f0 !important;
  border-color: #c3ccd8 !important;
}

/* Кнопки выбора палитры */
body.dark-theme .palette-editor .type-btn {
  background: #d4dae5 !important;
  border-color: #b7c0cc !important;
  color: #000 !important;
}

/* active — оставляем красивую подсветку */
body.dark-theme .palette-editor .type-btn.active {
  background: linear-gradient(135deg, #8b5cf6, #6366f1) !important;
  color: white !important;
}

/* Инфо в карточке цвета остаётся белой для контраста */
body.dark-theme .palette-editor .color-info {
  color: #fff !important;
}

/* Чекбокс */
body.dark-theme .palette-editor input[type="checkbox"] {
  accent-color: #6d4dcf !important;
}

/* ДЕЛАЕМ ТОЛЬКО ЭТОТ ПАРАГРАФ БЕЛЫМ */

body.dark-theme .palette-editor .editor-header p {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

body.dark-theme :deep(.palette-editor .editor-header p) {
  color: #fff !important;
  -webkit-text-fill-color: #fff !important;
}

</style>
