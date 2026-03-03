import { createRouter, createWebHashHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import TasksView from '../views/TasksView.vue'
import CategoriesView from '../views/CategoriesView.vue'
import MonthlyView from '../views/MonthlyView.vue'

const routes = [
    {
        path: '/',
        name: 'Dashboard',
        component: DashboardView,
        meta: { title: 'Dashboard' },
    },
    {
        path: '/tasks',
        name: 'Tasks',
        component: TasksView,
        meta: { title: 'Tasks' },
    },
    {
        path: '/categories',
        name: 'Categories',
        component: CategoriesView,
        meta: { title: 'Categories' },
    },
    {
        path: '/monthly',
        name: 'Monthly',
        component: MonthlyView,
        meta: { title: 'Monthly' },
    },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.afterEach((to) => {
    document.title = `${to.meta.title ?? 'Ractime'} — Ractime`
})

export default router
