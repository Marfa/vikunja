import {describe, it, expect, beforeEach} from 'vitest'
import {defineComponent, h, nextTick} from 'vue'
import {mount, flushPromises} from '@vue/test-utils'
import {createRouter, createMemoryHistory, RouterView} from 'vue-router'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import {useRouteWithModal} from './useRouteWithModal'

const NewProjectStub = defineComponent({
	name: 'NewProjectStub',
	props: {parentProjectId: {type: Number, required: false}},
	setup(props) {
		return () => h('div', {class: 'new-project', 'data-parent': String(props.parentProjectId ?? '')}, 'New project form')
	},
})

const ProjectViewStub = defineComponent({
	name: 'ProjectViewStub',
	setup() {
		return () => h('div', {class: 'project-view'}, 'Project view')
	},
})

describe('createFromParent via useRouteWithModal', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('shows NewProject in main view when opening createFromParent without backdropView', async () => {
		const router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{path: '/', name: 'home', component: {template: '<div />'}},
				{path: '/projects/:projectId/:viewId', name: 'project.view', component: ProjectViewStub},
				{
					path: '/projects/:parentProjectId/new',
					name: 'project.createFromParent',
					component: NewProjectStub,
					props: route => ({parentProjectId: Number(route.params.parentProjectId)}),
					meta: {showAsModal: true},
				},
			],
		})

		const i18n = createI18n({legacy: false, locale: 'en', messages: {en: {}}})

		let api: ReturnType<typeof useRouteWithModal>
		const Host = defineComponent({
			setup() {
				api = useRouteWithModal()
				return () => h('div', [
					h(RouterView, {route: api.routeWithModal.value}, {
						default: ({Component}: {Component: unknown}) => Component ? h(Component as object) : null,
					}),
					api.currentModal.value ? h('div', {class: 'side-modal'}, [api.currentModal.value]) : null,
				])
			},
		})

		await router.push('/projects/5/10')
		await router.isReady()

		const wrapper = mount(Host, {global: {plugins: [router, i18n, createPinia()]}})
		await flushPromises()
		expect(wrapper.find('.project-view').exists()).toBe(true)

		await router.push({name: 'project.createFromParent', params: {parentProjectId: 5}})
		await flushPromises()
		await nextTick()

		expect(router.currentRoute.value.name).toBe('project.createFromParent')
		expect(wrapper.find('.new-project').exists()).toBe(true)
		expect(wrapper.find('.new-project').attributes('data-parent')).toBe('5')
		expect(wrapper.find('.side-modal').exists()).toBe(false)
	})

	it('shows NewProject as side modal when backdropView is set', async () => {
		const router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{path: '/', name: 'home', component: {template: '<div />'}},
				{path: '/projects/:projectId/:viewId', name: 'project.view', component: ProjectViewStub},
				{
					path: '/projects/:parentProjectId/new',
					name: 'project.createFromParent',
					component: NewProjectStub,
					props: route => ({parentProjectId: Number(route.params.parentProjectId)}),
					meta: {showAsModal: true},
				},
			],
		})

		const i18n = createI18n({legacy: false, locale: 'en', messages: {en: {}}})

		let api: ReturnType<typeof useRouteWithModal>
		const Host = defineComponent({
			setup() {
				api = useRouteWithModal()
				return () => h('div', [
					h(RouterView, {route: api.routeWithModal.value}, {
						default: ({Component}: {Component: unknown}) => Component ? h(Component as object) : null,
					}),
					api.currentModal.value ? h('div', {class: 'side-modal'}, [api.currentModal.value]) : null,
				])
			},
		})

		await router.push('/projects/5/10')
		await router.isReady()

		const wrapper = mount(Host, {global: {plugins: [router, i18n, createPinia()]}})
		await flushPromises()

		const backdropView = router.currentRoute.value.fullPath
		await router.push({
			name: 'project.createFromParent',
			params: {parentProjectId: 5},
			state: {backdropView},
		})
		await flushPromises()
		await nextTick()

		expect(wrapper.find('.project-view').exists()).toBe(true)
		expect(wrapper.find('.side-modal .new-project').exists()).toBe(true)
		expect(wrapper.find('.side-modal .new-project').attributes('data-parent')).toBe('5')
	})
})
