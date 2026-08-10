import {describe, it, expect, beforeEach, vi} from 'vitest'
import {defineComponent, h, nextTick} from 'vue'
import {mount, flushPromises} from '@vue/test-utils'
import {setActivePinia, createPinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import {createRouter, createMemoryHistory} from 'vue-router'

import {useRouteWithModal} from './useRouteWithModal'
import {useBaseStore} from '@/stores/base'
import ProjectModel from '@/models/project'

const i18n = createI18n({legacy: false, locale: 'en', messages: {en: {}}})

describe('useRouteWithModal closeModal', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	async function mountWithRouter() {
		const router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{path: '/', name: 'home', component: {render: () => null}},
				{
					path: '/projects/:projectId/:viewId',
					name: 'project.view',
					component: {render: () => null},
				},
				{
					path: '/projects/:projectId',
					name: 'project.index',
					component: {render: () => null},
				},
				{
					path: '/tasks/:id',
					name: 'task.detail',
					component: {render: () => null},
					props: route => ({taskId: Number(route.params.id)}),
				},
			],
		})

		let closeModal!: () => void
		const TestComponent = defineComponent({
			setup() {
				;({closeModal} = useRouteWithModal())
				return () => h('div')
			},
		})

		mount(TestComponent, {global: {plugins: [router, i18n]}})
		await router.isReady()
		return {router, closeModal: () => closeModal()}
	}

	it('returns to the backdrop project after closing, not the project the task was moved to', async () => {
		const {router, closeModal} = await mountWithRouter()
		const baseStore = useBaseStore()

		await router.push({name: 'project.view', params: {projectId: '1', viewId: '10'}, query: {sort: 'created:asc'}})
		const backdropView = router.currentRoute.value.fullPath

		await router.push({
			name: 'task.detail',
			params: {id: '42'},
			state: {backdropView},
		})

		// Simulate the old move behavior that switched the highlighted project.
		baseStore.setCurrentProject(new ProjectModel({id: 2, title: 'Other'}))

		closeModal()
		await flushPromises()
		await nextTick()

		expect(router.currentRoute.value.name).toBe('project.view')
		expect(router.currentRoute.value.params.projectId).toBe('1')
		expect(router.currentRoute.value.params.viewId).toBe('10')
		expect(router.currentRoute.value.query.sort).toBe('created:asc')
	})

	it('falls back to backdropView when history has no back entry', async () => {
		const {router, closeModal} = await mountWithRouter()
		const baseStore = useBaseStore()

		const backdropView = '/projects/1/10?sort=created:asc'
		await router.push({
			name: 'task.detail',
			params: {id: '42'},
			state: {backdropView},
		})

		// Memory history keeps `back` on the first entry as null-ish; force the
		// closeModal path that resolves backdropView directly.
		const history = router.options.history
		const state = {...(history.state as Record<string, unknown>), back: null, backdropView}
		history.replace(router.currentRoute.value.fullPath, state)

		baseStore.setCurrentProject(new ProjectModel({id: 99, title: 'Moved to'}))

		const backSpy = vi.spyOn(router, 'back')
		closeModal()
		await flushPromises()
		await nextTick()

		expect(backSpy).not.toHaveBeenCalled()
		expect(router.currentRoute.value.name).toBe('project.view')
		expect(router.currentRoute.value.params.projectId).toBe('1')
		expect(router.currentRoute.value.query.sort).toBe('created:asc')
	})
})
