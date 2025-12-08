import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import PaletteLibrary from '../views/PaletteLibrary.vue'
import PaletteDetail from '../views/PaletteDetail.vue'
import PaletteEditor from '../views/PaletteEditor.vue'
import ExportPage from '../views/ExportPage.vue'
import NotFound from '../views/NotFound.vue'

const routes = [
	// Главная страница (генератор)
	{
		path: '/',
		name: 'Home',
		component: HomePage
	},
	// Библиотека палитр
	{
		path: '/library',
		name: 'Library',
		component: PaletteLibrary
	},
	// Редактор палитр
	{
		path: '/editor',
		name: 'Editor',
		component: PaletteEditor
	},
	// Экспорт палитр
	{
		path: '/export',
		name: 'Export',
		component: ExportPage
	},
	// Детальная страница палитры
	{
		path: '/palette/:id',
		name: 'PaletteDetail',
		component: PaletteDetail,
		props: true
	},
	// Страница 404
	{
		path: '/:pathMatch(.*)*',
		name: 'NotFound',
		component: NotFound
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

export default router