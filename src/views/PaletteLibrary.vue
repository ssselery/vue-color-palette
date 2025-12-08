<template>
  <div class="palette-library">
    <div class="library-header">
      <h1>📚 Библиотека палитр</h1>
      <p>Управляйте вашими сохранёнными цветовыми схемами</p>
    </div>

    <div class="library-controls">
      <SearchInput
          v-model="searchQuery"
          placeholder="Поиск по названию или тегам..."
          :show-filters="true"
          @search="performSearch"
          @clear="clearSearch"
          @update-filters="updateFilters"
      />

      <div class="actions-bar">
        <button @click="showCreateModal = true" class="btn btn-primary">
          <span class="btn-icon">+</span>
          Создать палитру
        </button>
        <button @click="importPalettes" class="btn btn-secondary">
          <span class="btn-icon">📥</span>
          Импорт
        </button>
        <button @click="exportPalettes" class="btn btn-secondary">
          <span class="btn-icon">📤</span>
          Экспорт
        </button>
      </div>
    </div>

    <div v-if="filteredPalettes.length === 0" class="empty-library">
      <div class="empty-illustration">
        <span class="empty-icon">🎨</span>
      </div>
      <h3>Палитры не найдены</h3>
      <p v-if="searchQuery || filters.onlyFavorites">
        Попробуйте изменить поисковый запрос или очистить фильтры
      </p>
      <p v-else>
        Создайте вашу первую палитру или импортируйте существующие
      </p>
      <button @click="showCreateModal = true" class="btn btn-primary">
        Создать первую палитру
      </button>
    </div>

    <div v-else class="library-grid">
      <PaletteCard
          v-for="palette in filteredPalettes"
          :key="palette.id"
          :name="palette.name"
          :colors="palette.colors"
          :description="palette.description"
          :date="palette.createdAt"
          :tags="palette.tags"
          :featured="palette.featured"
          @edit="editPalette(palette)"
          @copy="copyPalette(palette)"
          @toggle-favorite="toggleFavorite(palette)"
          @delete="deletePalette(palette)"
      >
        <template #actions>
          <div class="custom-actions">
            <button @click="usePalette(palette)" class="action-btn use-btn" title="Использовать">
              🚀
            </button>
            <button @click="sharePalette(palette)" class="action-btn share-btn" title="Поделиться">
              🔗
            </button>
            <button @click="editPalette(palette)" class="action-btn edit-btn" title="Редактировать">
              ✏️
            </button>
            <button
                @click="toggleFavorite(palette)"
                class="action-btn favorite-btn"
                :title="palette.featured ? 'Убрать из избранного' : 'В избранное'"
            >
              {{ palette.featured ? '★' : '☆' }}
            </button>
          </div>
        </template>
      </PaletteCard>
    </div>

    <!-- Модальное окно создания/редактирования палитры -->
    <div v-if="showCreateModal" class="modal-overlay" @click="showCreateModal = false">
      <div class="modal-content" @click.stop>
        <h3>{{ editingPalette ? 'Редактирование палитры' : 'Создание палитры' }}</h3>

        <div class="modal-form">
          <div class="form-group">
            <label>Название палитры *</label>
            <input v-model="newPalette.name" placeholder="Моя палитра" class="form-input" />
            <div v-if="nameError" class="error-message">{{ nameError }}</div>
          </div>

          <div class="form-group">
            <label>Описание (необязательно)</label>
            <textarea
                v-model="newPalette.description"
                placeholder="Описание палитры..."
                class="form-textarea"
                rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Теги (через запятую)</label>
            <input
                v-model="newPalette.tagsInput"
                placeholder="веб, интерфейс, тёмная тема"
                class="form-input"
            />
          </div>

          <div class="form-group">
            <label>Цвета палитры *</label>
            <div class="colors-info">
              <span class="colors-count">{{ newPalette.colors.length }} цветов</span>
              <span v-if="colorsError" class="error-message">{{ colorsError }}</span>
            </div>
            <div class="color-selection">
              <div
                  v-for="(color, index) in newPalette.colors"
                  :key="index"
                  class="selected-color"
                  :style="{ backgroundColor: color }"
                  @click="editColor(index)"
              >
                <span class="color-hex">{{ color }}</span>
                <button
                    @click.stop="removeColor(index)"
                    class="remove-color-btn"
                >
                  ✕
                </button>
              </div>
              <button @click="addColor" class="add-color-btn" title="Добавить цвет">
                +
              </button>
            </div>
            <div class="color-actions">
              <button @click="addRandomColor" class="btn-small btn-secondary">
                Случайный цвет
              </button>
              <button @click="shuffleColors" class="btn-small btn-secondary">
                Перемешать
              </button>
              <button @click="clearColors" class="btn-small btn-danger">
                Очистить
              </button>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="cancelEdit" class="btn btn-secondary">Отмена</button>
            <button @click="savePalette" class="btn btn-primary">
              {{ editingPalette ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно выбора цвета -->
    <div v-if="showColorPicker" class="modal-overlay" @click="showColorPicker = false">
      <div class="modal-content color-picker-modal" @click.stop>
        <h3>Выберите цвет</h3>
        <div class="color-picker-wrapper">
          <input
              v-model="selectedColor"
              type="color"
              class="color-input"
          />
          <input
              v-model="selectedColor"
              type="text"
              class="color-text-input"
              placeholder="#000000"
              maxlength="7"
          />
        </div>
        <div class="color-preview" :style="{ backgroundColor: selectedColor }">
          {{ selectedColor }}
        </div>
        <div class="modal-actions">
          <button @click="showColorPicker = false" class="btn btn-secondary">Отмена</button>
          <button @click="confirmColor" class="btn btn-primary">Выбрать</button>
        </div>
      </div>
    </div>

    <!-- Модальное окно импорта -->
    <div v-if="showImportModal" class="modal-overlay" @click="showImportModal = false">
      <div class="modal-content" @click.stop>
        <h3>Импорт палитр</h3>
        <div class="import-options">
          <div class="import-option" @click="importFromFile">
            <span class="import-icon">📁</span>
            <div>
              <h4>Из файла JSON</h4>
              <p>Выберите файл с палитрами в формате JSON</p>
            </div>
          </div>
          <div class="import-option" @click="importFromText">
            <span class="import-icon">📝</span>
            <div>
              <h4>Вставить JSON</h4>
              <p>Вставьте JSON текст с палитрами</p>
            </div>
          </div>
        </div>
        <div v-if="importError" class="error-message">{{ importError }}</div>
        <div v-if="importSuccess" class="success-message">
          Успешно импортировано {{ importedCount }} палитр
        </div>
        <div class="modal-actions">
          <button @click="showImportModal = false" class="btn btn-secondary">Закрыть</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { PaletteStore, initializePaletteStore } from '../utils/paletteStore'
import SearchInput from '../components/SearchInput.vue'
import PaletteCard from '../components/PaletteCard.vue'

export default {
  name: 'PaletteLibrary',

  components: {
    SearchInput,
    PaletteCard
  },

  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    const filters = ref({
      onlyFavorites: false,
      withTags: false,
      sortBy: 'date'
    })

    const palettes = ref([])
    const showCreateModal = ref(false)
    const showColorPicker = ref(false)
    const showImportModal = ref(false)
    const editingPalette = ref(null)
    const editingColorIndex = ref(null)
    const nameError = ref('')
    const colorsError = ref('')
    const importError = ref('')
    const importSuccess = ref(false)
    const importedCount = ref(0)

    const newPalette = ref({
      name: '',
      description: '',
      tagsInput: '',
      colors: ['#667eea', '#764ba2', '#f56565', '#48bb78', '#ed8936']
    })

    const selectedColor = ref('#667eea')

    // Загрузка палитр
    const loadPalettes = () => {
      palettes.value = PaletteStore.getAll()
    }

    // Отфильтрованные палитры
    const filteredPalettes = computed(() => {
      if (!palettes.value || !Array.isArray(palettes.value)) {
        return []
      }

      let filtered = [...palettes.value]

      // Поиск по названию и тегам
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(palette => {
          if (!palette) return false

          const nameMatch = palette.name &&
              palette.name.toLowerCase().includes(query)

          const tagsMatch = palette.tags &&
              Array.isArray(palette.tags) &&
              palette.tags.some(tag =>
                  tag && tag.toLowerCase().includes(query)
              )

          const descMatch = palette.description &&
              palette.description.toLowerCase().includes(query)

          return nameMatch || tagsMatch || descMatch
        })
      }

      // Фильтр по избранному
      if (filters.value.onlyFavorites) {
        filtered = filtered.filter(palette => palette && palette.featured)
      }

      // Фильтр по тегам
      if (filters.value.withTags) {
        filtered = filtered.filter(palette =>
            palette && palette.tags &&
            Array.isArray(palette.tags) &&
            palette.tags.length > 0
        )
      }

      // Сортировка
      filtered.sort((a, b) => {
        if (!a || !b) return 0

        switch (filters.value.sortBy) {
          case 'name':
            return (a.name || '').localeCompare(b.name || '')
          case 'colors':
            return (b.colors?.length || 0) - (a.colors?.length || 0)
          case 'date':
          default:
            const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0)
            const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0)
            return dateB - dateA
        }
      })

      return filtered
    })

    // Валидация
    const validatePalette = () => {
      nameError.value = ''
      colorsError.value = ''

      if (!newPalette.value.name.trim()) {
        nameError.value = 'Введите название палитры'
        return false
      }

      if (newPalette.value.colors.length === 0) {
        colorsError.value = 'Добавьте хотя бы один цвет'
        return false
      }

      // Проверяем уникальность названия при создании
      if (!editingPalette.value) {
        const exists = palettes.value.some(p =>
            p.name.toLowerCase() === newPalette.value.name.toLowerCase()
        )
        if (exists) {
          nameError.value = 'Палитра с таким названием уже существует'
          return false
        }
      }

      return true
    }

    // Методы
    const performSearch = () => {
      console.log('Поиск:', searchQuery.value)
    }

    const clearSearch = () => {
      searchQuery.value = ''
    }

    const updateFilters = (newFilters) => {
      filters.value = newFilters
    }

    const editPalette = (palette) => {
      editingPalette.value = palette
      newPalette.value = {
        name: palette.name,
        description: palette.description || '',
        tagsInput: palette.tags?.join(', ') || '',
        colors: [...palette.colors]
      }
      showCreateModal.value = true
    }

    const copyPalette = (palette) => {
      const paletteString = JSON.stringify(palette, null, 2)
      navigator.clipboard.writeText(paletteString)
          .then(() => {
            alert('Палитра скопирована в буфер!')
            // Создаем копию с новым ID
            const copy = {
              ...palette,
              id: Date.now(),
              name: `${palette.name} (копия)`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
            PaletteStore.add(copy)
            loadPalettes()
          })
          .catch(err => console.error('Ошибка копирования:', err))
    }

    const toggleFavorite = (palette) => {
      const updated = { ...palette, featured: !palette.featured }
      PaletteStore.update(palette.id, updated)
      loadPalettes()
    }

    const deletePalette = (palette) => {
      if (confirm(`Удалить палитру "${palette.name}"?`)) {
        PaletteStore.delete(palette.id)
        loadPalettes()
      }
    }

    const usePalette = (palette) => {
      // Сохраняем палитру для использования в генераторе
      PaletteStore.setCurrent(palette.colors.map(color => ({
        hex: color,
        rgb: hexToRgb(color),
        isLight: isLightColor(color)
      })))

      // Переходим на главную страницу
      router.push('/')
    }

    const sharePalette = (palette) => {
      const paletteData = {
        ...palette,
        source: 'Color Palette Generator'
      }

      const shareText = `🎨 Палитра: ${palette.name}\n`
      const colorsText = palette.colors.map(c => c).join('\n')
      const tagsText = palette.tags?.length ? `\nТеги: ${palette.tags.join(', ')}` : ''

      const text = `${shareText}${colorsText}${tagsText}\n\nСоздано в Color Palette Generator`

      navigator.clipboard.writeText(text)
          .then(() => alert('Палитра скопирована для sharing!'))
          .catch(err => console.error('Ошибка копирования:', err))
    }

    const addColor = () => {
      selectedColor.value = '#667eea'
      editingColorIndex.value = null
      showColorPicker.value = true
    }

    const editColor = (index) => {
      selectedColor.value = newPalette.value.colors[index]
      editingColorIndex.value = index
      showColorPicker.value = true
    }

    const removeColor = (index) => {
      newPalette.value.colors.splice(index, 1)
    }

    const addRandomColor = () => {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      newPalette.value.colors.push(randomColor)
    }

    const shuffleColors = () => {
      newPalette.value.colors = [...newPalette.value.colors].sort(() => Math.random() - 0.5)
    }

    const clearColors = () => {
      if (confirm('Очистить все цвета?')) {
        newPalette.value.colors = []
      }
    }

    const confirmColor = () => {
      if (!selectedColor.value.startsWith('#')) {
        selectedColor.value = '#' + selectedColor.value
      }

      if (editingColorIndex.value !== null) {
        newPalette.value.colors[editingColorIndex.value] = selectedColor.value
      } else {
        newPalette.value.colors.push(selectedColor.value)
      }

      showColorPicker.value = false
      editingColorIndex.value = null
    }

    const cancelEdit = () => {
      showCreateModal.value = false
      resetNewPalette()
    }

    const savePalette = () => {
      if (!validatePalette()) {
        return
      }

      const tags = newPalette.value.tagsInput
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0)

      const paletteData = {
        id: editingPalette.value?.id || Date.now(),
        name: newPalette.value.name.trim(),
        description: newPalette.value.description.trim(),
        colors: [...newPalette.value.colors],
        tags,
        featured: editingPalette.value?.featured || false,
        createdAt: editingPalette.value?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      if (editingPalette.value) {
        PaletteStore.update(editingPalette.value.id, paletteData)
      } else {
        PaletteStore.add(paletteData)
      }

      loadPalettes()
      showCreateModal.value = false
      resetNewPalette()
    }

    const resetNewPalette = () => {
      newPalette.value = {
        name: '',
        description: '',
        tagsInput: '',
        colors: ['#667eea', '#764ba2', '#f56565', '#48bb78', '#ed8936']
      }
      editingPalette.value = null
      nameError.value = ''
      colorsError.value = ''
    }

    const importPalettes = () => {
      showImportModal.value = true
      importError.value = ''
      importSuccess.value = false
    }

    const importFromFile = () => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'

      input.onchange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const result = PaletteStore.importFromJSON(e.target.result)
            if (result.success) {
              importedCount.value = result.count
              importSuccess.value = true
              importError.value = ''
              loadPalettes()

              // Автоматически закрываем через 2 секунды
              setTimeout(() => {
                showImportModal.value = false
                importSuccess.value = false
              }, 2000)
            } else {
              importError.value = `Ошибка импорта: ${result.error}`
            }
          } catch (error) {
            importError.value = `Ошибка чтения файла: ${error.message}`
          }
        }
        reader.readAsText(file)
      }

      input.click()
    }

    const importFromText = () => {
      const jsonText = prompt('Введите JSON текст с палитрами:')
      if (!jsonText) return

      const result = PaletteStore.importFromJSON(jsonText)
      if (result.success) {
        importedCount.value = result.count
        importSuccess.value = true
        importError.value = ''
        loadPalettes()

        setTimeout(() => {
          showImportModal.value = false
          importSuccess.value = false
        }, 2000)
      } else {
        importError.value = `Ошибка импорта: ${result.error}`
      }
    }

    const exportPalettes = () => {
      const data = PaletteStore.exportToJSON()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `palettes-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    // Вспомогательные функции
    const hexToRgb = (hex) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ?
          `rgb(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)})` :
          null
    }

    const isLightColor = (hex) => {
      const rgb = hexToRgb(hex)
      if (!rgb) return false
      const [r, g, b] = rgb.match(/\d+/g).map(Number)
      const brightness = (r * 299 + g * 587 + b * 114) / 1000
      return brightness > 128
    }

    // Инициализация
    onMounted(() => {
      initializePaletteStore()
      loadPalettes()
    })

    return {
      searchQuery,
      filters,
      filteredPalettes,
      showCreateModal,
      showColorPicker,
      showImportModal,
      editingPalette,
      newPalette,
      selectedColor,
      nameError,
      colorsError,
      importError,
      importSuccess,
      importedCount,
      performSearch,
      clearSearch,
      updateFilters,
      editPalette,
      copyPalette,
      toggleFavorite,
      deletePalette,
      usePalette,
      sharePalette,
      addColor,
      editColor,
      removeColor,
      addRandomColor,
      shuffleColors,
      clearColors,
      confirmColor,
      cancelEdit,
      savePalette,
      importPalettes,
      importFromFile,
      importFromText,
      exportPalettes
    }
  }
}
</script>

<style scoped>
.palette-library {
  max-width: 1400px;
  margin: 0 auto;
  padding: 30px 20px;
}

.library-header {
  text-align: center;
  margin-bottom: 40px;
}

.library-header h1 {
  font-size: 2.5rem;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.library-header p {
  color: #718096;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
}

.library-controls {
  margin-bottom: 40px;
}

.actions-bar {
  display: flex;
  gap: 16px;
  margin-top: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 14px 24px;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: #e2e8f0;
  color: #4a5568;
}

.btn-secondary:hover {
  background: #cbd5e0;
  transform: translateY(-3px);
}

.btn-danger {
  background: #fc8181;
  color: white;
}

.btn-danger:hover {
  background: #f56565;
  transform: translateY(-3px);
}

.btn-small {
  padding: 8px 16px;
  font-size: 0.9rem;
}

.btn-icon {
  font-size: 1.2rem;
}

.empty-library {
  text-align: center;
  padding: 60px 20px;
  background: linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%);
  border-radius: 20px;
  border: 2px dashed #cbd5e0;
}

.empty-illustration {
  margin-bottom: 24px;
}

.empty-icon {
  font-size: 4rem;
  opacity: 0.3;
}

.empty-library h3 {
  font-size: 1.5rem;
  color: #4a5568;
  margin-bottom: 12px;
  font-weight: 600;
}

.empty-library p {
  color: #a0aec0;
  font-size: 1rem;
  max-width: 400px;
  margin: 0 auto 24px;
}

.library-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.custom-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.use-btn {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.use-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.share-btn {
  background: rgba(159, 122, 234, 0.1);
  color: #9f7aea;
}

.share-btn:hover {
  background: rgba(159, 122, 234, 0.2);
}

.edit-btn {
  background: rgba(66, 153, 225, 0.1);
  color: #4299e1;
}

.edit-btn:hover {
  background: rgba(66, 153, 225, 0.2);
}

.favorite-btn {
  background: rgba(246, 224, 94, 0.1);
  color: #d69e2e;
}

.favorite-btn:hover {
  background: rgba(246, 224, 94, 0.2);
}

/* Модальные окна */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
}

.color-picker-modal {
  max-width: 400px;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content h3 {
  font-size: 1.5rem;
  color: #2d3748;
  margin-bottom: 24px;
  font-weight: 700;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #4a5568;
}

.error-message {
  color: #f56565;
  font-size: 0.9rem;
  margin-top: 4px;
}

.success-message {
  color: #48bb78;
  font-size: 0.9rem;
  margin-top: 8px;
  font-weight: 600;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.colors-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.colors-count {
  font-size: 0.9rem;
  color: #718096;
}

.color-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.selected-color {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.selected-color:hover {
  transform: scale(1.1);
}

.color-hex {
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
}

.remove-color-btn {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 20px;
  height: 20px;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s;
}

.selected-color:hover .remove-color-btn {
  opacity: 1;
}

.add-color-btn {
  width: 60px;
  height: 60px;
  background: #e2e8f0;
  border: 2px dashed #cbd5e0;
  border-radius: 8px;
  font-size: 1.5rem;
  color: #a0aec0;
  cursor: pointer;
  transition: all 0.2s;
}

.add-color-btn:hover {
  background: #cbd5e0;
  color: #718096;
}

.color-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.color-picker-wrapper {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.color-input {
  width: 60px;
  height: 60px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.color-text-input {
  flex: 1;
  padding: 14px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  font-size: 1rem;
  font-family: monospace;
}

.color-preview {
  width: 100%;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.import-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 24px 0;
}

.import-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.import-option:hover {
  border-color: #667eea;
  background: #f8fafc;
}

.import-icon {
  font-size: 2rem;
}

.import-option h4 {
  margin: 0 0 4px 0;
  color: #2d3748;
  font-size: 1.1rem;
}

.import-option p {
  margin: 0;
  color: #718096;
  font-size: 0.9rem;
}

.modal-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .library-grid {
    grid-template-columns: 1fr;
  }

  .actions-bar {
    flex-direction: column;
  }

  .btn {
    justify-content: center;
  }

  .import-options {
    flex-direction: column;
  }
}
</style>