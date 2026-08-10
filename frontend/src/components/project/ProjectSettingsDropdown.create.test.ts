import {describe, it, expect, vi, beforeEach} from 'vitest'
import {mount, flushPromises} from '@vue/test-utils'
import {createRouter, createMemoryHistory} from 'vue-router'
import {createPinia, setActivePinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import ProjectSettingsDropdown from './ProjectSettingsDropdown.vue'
import ProjectModel from '@/models/project'
import {PERMISSIONS} from '@/constants/permissions'

vi.mock('@/components/misc/Subscription.vue', () => ({
	default: {name: 'Subscription', template: '<div class="subscription-stub" />'},
}))

vi.mock('@/components/misc/Icon', () => ({
	default: {name: 'Icon', props: ['icon'], template: '<span class="icon-stub" />'},
}))

describe('ProjectSettingsDropdown create project', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
	})

	it('navigates to createFromParent when Create project is clicked', async () => {
		const router = createRouter({
			history: createMemoryHistory(),
			routes: [
				{path: '/', name: 'home', component: {template: '<div />'}},
				{path: '/projects/:projectId/:viewId', name: 'project.view', component: {template: '<div />'}},
				{
					path: '/projects/:parentProjectId/new',
					name: 'project.createFromParent',
					component: {template: '<div id="created" />'},
					props: route => ({parentProjectId: Number(route.params.parentProjectId)}),
				},
				{path: '/projects/:projectId/settings/edit', name: 'project.settings.edit', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/views', name: 'project.settings.views', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/share', name: 'project.settings.share', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/duplicate', name: 'project.settings.duplicate', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/archive', name: 'project.settings.archive', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/webhooks', name: 'project.settings.webhooks', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/delete', name: 'project.settings.delete', component: {template: '<div />'}},
				{path: '/projects/:projectId/settings/background', name: 'project.settings.background', component: {template: '<div />'}},
			],
		})
		await router.push('/projects/42/1')
		await router.isReady()

		const i18n = createI18n({
			legacy: false,
			locale: 'en',
			messages: {
				en: {
					menu: {
						edit: 'Edit',
						views: 'Views',
						setBackground: 'Background',
						share: 'Share',
						duplicate: 'Duplicate',
						archive: 'Archive',
						createProject: 'Create project',
						delete: 'Delete',
						cantArchiveIsDefault: '',
						cantDeleteIsDefault: '',
					},
					project: {
						openSettingsMenu: 'Open',
						webhooks: {title: 'Webhooks'},
					},
					misc: {delete: 'Delete'},
				},
			},
		})

		const project = new ProjectModel({
			id: 42,
			title: 'Test',
			maxPermission: PERMISSIONS.ADMIN,
		})

		const wrapper = mount(ProjectSettingsDropdown, {
			props: {project, forceAllActions: true},
			global: {
				plugins: [router, i18n, createPinia()],
				stubs: {
					teleport: true,
				},
			},
		})

		// open dropdown
		await wrapper.find('.dropdown-trigger').trigger('click')
		await flushPromises()

		const createLink = wrapper.findAll('a').find(a => a.text().includes('Create project'))
		expect(createLink, 'Create project should be a link').toBeTruthy()
		expect(createLink!.attributes('href')).toBe('/projects/42/new')

		await createLink!.trigger('click')
		await flushPromises()
		await router.isReady()

		expect(router.currentRoute.value.name).toBe('project.createFromParent')
		expect(router.currentRoute.value.fullPath).toBe('/projects/42/new')
	})
})
