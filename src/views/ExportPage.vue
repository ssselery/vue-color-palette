<template>
  <div class="export-page">
    <div class="page-header">
      <h1>📤 Экспорт палитр</h1>
      <p>Конвертируйте ваши палитры в различные форматы для использования в проектах</p>
    </div>

    <div class="export-container">
      <div class="export-sidebar">
        <h3>Выбор палитры</h3>
        <div class="palette-selector">
          <div
              v-for="palette in palettes"
              :key="palette.id"
              class="palette-option"
              :class="{ active: selectedPalette?.id === palette.id }"
              @click="selectPalette(palette)"
          >
            <div class="option-colors">
              <div
                  v-for="(color, index) in palette.colors.slice(0, 5)"
                  :key="index"
                  class="option-color"
                  :style="{ backgroundColor: color }"
              ></div>
            </div>
            <div class="option-name">{{ palette.name }}</div>
          </div>
        </div>

        <div class="quick-actions">
          <button @click="clearSelection" class="btn btn-secondary">
            🗑️ Очистить выбор
          </button>
        </div>
      </div>

      <div class="export-main">
        <div v-if="!selectedPalette" class="no-selection">
          <div class="no-selection-illustration">
            <span class="illustration-icon">🎨</span>
          </div>
          <h3>Выберите палитру для экспорта</h3>
          <p>Выберите палитру из списка слева, чтобы увидеть варианты экспорта</p>
        </div>

        <div v-else class="export-options">
          <div class="selected-palette">
            <h3>Выбранная палитра: {{ selectedPalette.name }}</h3>
            <div class="palette-preview">
              <div
                  v-for="(color, index) in selectedPalette.colors"
                  :key="index"
                  class="preview-color"
                  :style="{ backgroundColor: color }"
                  :title="color"
              >
                <span class="color-label">{{ color }}</span>
              </div>
            </div>
          </div>

          <div class="format-options">
            <h4>Форматы экспорта</h4>
            <div class="format-grid">
              <div
                  v-for="format in exportFormats"
                  :key="format.id"
                  class="format-card"
                  :class="{ active: selectedFormat === format.id }"
                  @click="selectFormat(format.id)"
              >
                <div class="format-icon">{{ format.icon }}</div>
                <div class="format-info">
                  <h5>{{ format.name }}</h5>
                  <p>{{ format.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="export-preview">
            <h4>Предпросмотр</h4>
            <div class="preview-container">
              <pre class="code-preview">{{ previewCode }}</pre>
            </div>

            <div class="export-actions">
              <button @click="copyCode" class="btn btn-primary">
                📋 Скопировать код
              </button>
              <button @click="downloadCode" class="btn btn-success">
                ⬇️ Скачать файл
              </button>
              <button @click="sharePalette" class="btn btn-info">
                🔗 Поделиться
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'ExportPage',

  setup() {
    const palettes = ref([])
    const selectedPalette = ref(null)
    const selectedFormat = ref('css')

    const exportFormats = ref([
      { id: 'css', name: 'CSS Variables', icon: '🎨', description: 'CSS кастомные свойства' },
      { id: 'scss', name: 'SCSS Variables', icon: '⚡', description: 'SCSS переменные' },
      { id: 'tailwind', name: 'Tailwind Config', icon: '🌊', description: 'Конфиг для Tailwind CSS' },
      { id: 'json', name: 'JSON', icon: '📄', description: 'Стандартный JSON формат' },
      { id: 'swift', name: 'Swift UI', icon: '📱', description: 'Цвета для iOS приложений' },
      { id: 'android', name: 'Android XML', icon: '🤖', description: 'Ресурсы для Android' }
    ])

    // Загрузка палитр
    const loadPalettes = () => {
      const library = localStorage.getItem('paletteLibrary')
      if (library) {
        try {
          palettes.value = JSON.parse(library)
          if (palettes.value.length > 0 && !selectedPalette.value) {
            selectedPalette.value = palettes.value[0]
          }
        } catch (e) {
          console.error('Ошибка загрузки палитр:', e)
        }
      }
    }

    // Вычисляемый код для предпросмотра
    const previewCode = computed(() => {
      if (!selectedPalette.value) return '// Выберите палитру для экспорта'

      const colors = selectedPalette.value.colors
      const paletteName = selectedPalette.value.name.replace(/\s+/g, '-').toLowerCase()

      switch (selectedFormat.value) {
        case 'css':
          return `/* CSS Variables for ${selectedPalette.value.name} */
:root {
${colors.map((color, i) => `  --${paletteName}-${i + 1}: ${color};`).join('\n')}
}

/* Usage example */
.element {
  background-color: var(--${paletteName}-1);
  color: var(--${paletteName}-5);
}`

        case 'scss':
          return `// SCSS Variables for ${selectedPalette.value.name}
${colors.map((color, i) => `$${paletteName}-${i + 1}: ${color};`).join('\n')}

// Usage example
.element {
  background-color: $${paletteName}-1;
  color: $${paletteName}-5;
}`

        case 'tailwind':
          return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        '${paletteName}': {
${colors.map((color, i) => `          ${i + 1}: '${color}',`).join('\n')}
        }
      }
    }
  }
}

// Usage example
// class="bg-${paletteName}-1 text-${paletteName}-5"`

        case 'json':
          return JSON.stringify({
            name: selectedPalette.value.name,
            description: selectedPalette.value.description,
            colors: selectedPalette.value.colors,
            tags: selectedPalette.value.tags
          }, null, 2)

        case 'swift':
          return `// Swift UI Colors for ${selectedPalette.value.name}
import SwiftUI

extension Color {
${colors.map((color, i) => `  static let ${paletteName}${i + 1} = Color(hex: "${color}")`).join('\n')}
}

// Usage example
// Text("Hello").foregroundColor(.${paletteName}1)`

        case 'android':
          return `<!-- colors.xml for ${selectedPalette.value.name} -->
<resources>
${colors.map((color, i) => `  <color name="${paletteName}_${i + 1}">${color}</color>`).join('\n')}
</resources>

<!-- Usage example -->
<!-- android:background="@color/${paletteName}_1" -->`

        default:
          return '// Неизвестный формат'
      }
    })

    // Методы
    const selectPalette = (palette) => {
      selectedPalette.value = palette
    }

    const selectFormat = (format) => {
      selectedFormat.value = format
    }

    const copyCode = async () => {
      try {
        await navigator.clipboard.writeText(previewCode.value)
        alert('Код скопирован в буфер обмена!')
      } catch (err) {
        console.error('Ошибка копирования:', err)
      }
    }

    const downloadCode = () => {
      const blob = new Blob([previewCode.value], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedPalette.value.name.replace(/\s+/g, '-')}.${getFileExtension()}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    const sharePalette = () => {
      const url = `${window.location.origin}/palette/${selectedPalette.value.id}`
      navigator.clipboard.writeText(url)
          .then(() => alert('Ссылка скопирована в буфер!'))
          .catch(err => console.error('Ошибка копирования:', err))
    }

    const importPalette = () => {
      // В реальном приложении здесь была бы загрузка файла
      alert('Функция импорта будет реализована позже')
    }

    const clearSelection = () => {
      selectedPalette.value = null
    }

    const getFileExtension = () => {
      switch (selectedFormat.value) {
        case 'css': return 'css'
        case 'scss': return 'scss'
        case 'tailwind': return 'js'
        case 'json': return 'json'
        case 'swift': return 'swift'
        case 'android': return 'xml'
        default: return 'txt'
      }
    }

    // Инициализация
    onMounted(() => {
      loadPalettes()
    })

    return {
      palettes,
      selectedPalette,
      selectedFormat,
      exportFormats,
      previewCode,
      selectPalette,
      selectFormat,
      copyCode,
      downloadCode,
      sharePalette,
      importPalette,
      clearSelection
    }
  }
}
</script>

<style scoped>
.export-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-header p {
  color: #718096;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}

.export-container {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 30px;
  min-height: 600px;
}

@media (max-width: 1024px) {
  .export-container {
    grid-template-columns: 1fr;
  }
}

.export-sidebar {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.export-sidebar h3 {
  font-size: 1.3rem;
  color: #2d3748;
  margin-bottom: 20px;
  font-weight: 700;
}

.palette-selector {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 24px;
}

.palette-option {
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.palette-option:hover {
  border-color: #cbd5e0;
  transform: translateX(4px);
}

.palette-option.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.option-colors {
  display: flex;
  height: 20px;
  margin-bottom: 8px;
  border-radius: 4px;
  overflow: hidden;
}

.option-color {
  flex: 1;
}

.option-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-2px);
}

.export-main {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(226, 232, 240, 0.6);
}

.no-selection {
  text-align: center;
  padding: 60px 20px;
}

.no-selection-illustration {
  margin-bottom: 24px;
}

.illustration-icon {
  font-size: 4rem;
  opacity: 0.3;
}

.no-selection h3 {
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 12px;
  font-weight: 600;
}

.no-selection p {
  color: #a0aec0;
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto;
}

.selected-palette {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
}

.selected-palette h3 {
  font-size: 1.4rem;
  color: #2d3748;
  margin-bottom: 16px;
  font-weight: 700;
}

.palette-preview {
  display: flex;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.preview-color {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-color:hover .color-label {
  opacity: 1;
}

.color-label {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-family: 'Fira Code', monospace;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.format-options {
  margin-bottom: 30px;
}

.format-options h4 {
  font-size: 1.2rem;
  color: #2d3748;
  margin-bottom: 20px;
  font-weight: 600;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.format-card {
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 16px;
}

.format-card:hover {
  border-color: #cbd5e0;
  transform: translateY(-4px);
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
}

.format-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.format-icon {
  font-size: 2rem;
}

.format-info h5 {
  font-size: 1rem;
  color: #2d3748;
  margin-bottom: 4px;
  font-weight: 600;
}

.format-info p {
  font-size: 0.85rem;
  color: #718096;
  line-height: 1.4;
}

.export-preview h4 {
  font-size: 1.2rem;
  color: #2d3748;
  margin-bottom: 16px;
  font-weight: 600;
}

.preview-container {
  background: #1a202c;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  overflow: auto;
}

.code-preview {
  color: #e2e8f0;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.export-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-success {
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
}

.btn-success:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(72, 187, 120, 0.3);
}

.btn-info {
  background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
  color: white;
}

.btn-info:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(66, 153, 225, 0.3);
}
</style>