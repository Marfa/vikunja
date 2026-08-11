import {describe, it, expect, beforeEach, vi} from 'vitest'
import {defineComponent, h, nextTick} from 'vue'
import {mount, flushPromises} from '@vue/test-utils'
import {setActivePinia, createPinia} from 'pinia'
import {createI18n} from 'vue-i18n'
import {createRouter, createMemoryHistory, type Router} from 'vue-router'

const getAll = vi.fn(async () => [])
vi.mock('@/services/taskCollection', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@/services/taskCollection')>()
	return {
		...actual,
		default: class {
			loading = false
			totalPages = 1
			getAll = getAll
		},
	}
})

import {useTaskList, buildStoredQuery} from './useTaskList'
import {useViewFiltersStore} from '@/stores/viewFilters'

const i18n = createI18n({legacy: false, locale: 'en', messages: {en: {}}})

describe('buildStoredQuery', () => {
	it('includes sort when set', () => {
		expect(buildStoredQuery({sort: 'due_date:asc', filter: undefined, s: undefined, page: 1}))
			.toEqual({sort: 'due_date:asc'})
	})

	it('includes filter and search when set', () => {
		expect(buildStoredQuery({sort: undefined, filter: 'done = false', s: 'foo', page: 1}))
			.toEqual({filter: 'done = false', s: 'foo'})
	})

	it('omits page when it equals the default of 1', () => {
		expect(buildStoredQuery({sort: 'id:desc', filter: undefined, s: undefined, page: 1}))
			.toEqual({sort: 'id:desc'})
	})

	it('includes page when greater than 1', () => {
		expect(buildStoredQuery({sort: undefined, filter: undefined, s: undefined, page: 3}))
			.toEqual({page: '3'})
	})

	it('returns an empty object when nothing is set', () => {
		expect(buildStoredQuery({sort: undefined, filter: undefined, s: undefined, page: 1}))
			.toEqual({})
	})

	it('skips empty strings', () => {
		expect(buildStoredQuery({sort: '', filter: '', s: '', page: 1}))
			.toEqual({})
	})
})

// The second positional argument passed to TaskCollectionService.getAll carries
// the sort_by/order_by the backend uses to decide whether to rank by relevance.
function lastRequestParams(): Record<string, unknown> {
	return getAll.mock.calls.at(-1)?.[1] as Record<string, unknown>
}

async function mountTaskList(
	query: Record<string, string>,
	options: {
		path?: string
		viewId?: number
	} = {},
): Promise<Router> {
	const path = options.path ?? '/'
	const viewId = options.viewId ?? 1
	const router = createRouter({
		history: createMemoryHistory(),
		routes: [
			{path: '/', name: 'home', component: {render: () => null}},
			{path: '/projects/:projectId/:viewId', name: 'project.view', component: {render: () => null}},
			{path: '/tasks/:id', name: 'task.detail', component: {render: () => null}},
		],
	})
	await router.push({path, query})
	await router.isReady()

	const TestComponent = defineComponent({
		setup() {
			useTaskList(() => 1, () => viewId)
			return () => h('div')
		},
	})

	mount(TestComponent, {global: {plugins: [router, i18n]}})
	await flushPromises()
	await nextTick()
	return router
}

describe('useTaskList sort handling for relevance ranking', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		getAll.mockClear()
	})

	it('omits the sort while searching with the default sort so the backend ranks by relevance', async () => {
		await mountTaskList({s: 'find me'})

		const params = lastRequestParams()
		expect(params.s).toBe('find me')
		expect(params.sort_by).toEqual([])
		expect(params.order_by).toEqual([])
	})

	it('keeps an explicit user sort while searching so the user sort is respected', async () => {
		await mountTaskList({s: 'find me', sort: 'title:asc'})

		const params = lastRequestParams()
		expect(params.s).toBe('find me')
		expect(params.sort_by).toEqual(['title'])
		expect(params.order_by).toEqual(['asc'])
	})

	it('sends the default sort when not searching', async () => {
		await mountTaskList({})

		const params = lastRequestParams()
		expect(params.s).toBe('')
		expect(params.sort_by).not.toHaveLength(0)
		// id always sorts last so other sort columns take precedence.
		expect(params.sort_by).toEqual(['id'])
		expect(params.order_by).toEqual(['desc'])
	})
})

describe('useTaskList backdrop query while task modal is open', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		getAll.mockClear()
	})

	it('keeps the list sort and stored query when navigating to a task with backdropView', async () => {
		const viewId = 18
		const listPath = `/projects/1/${viewId}`
		const router = await mountTaskList(
			{sort: 'created:asc'},
			{path: listPath, viewId},
		)

		expect(lastRequestParams().sort_by).toEqual(['created'])
		expect(lastRequestParams().order_by).toEqual(['asc'])
		expect(useViewFiltersStore().getViewQuery(viewId)).toEqual({sort: 'created:asc'})

		const callsBeforeModal = getAll.mock.calls.length
		await router.push({
			path: '/tasks/42',
			state: {backdropView: `${listPath}?sort=created:asc`},
		})
		await flushPromises()
		await nextTick()

		expect(lastRequestParams().sort_by).toEqual(['created'])
		expect(lastRequestParams().order_by).toEqual(['asc'])
		expect(useViewFiltersStore().getViewQuery(viewId)).toEqual({sort: 'created:asc'})
		// Opening the modal must not trigger a reload with the default sort.
		expect(getAll.mock.calls.length).toBe(callsBeforeModal)
	})

	it('refetches the list without wiping when the task modal closes', async () => {
		const viewId = 18
		const listPath = `/projects/1/${viewId}`
		const router = await mountTaskList(
			{sort: 'created:asc'},
			{path: listPath, viewId},
		)

		await router.push({
			path: '/tasks/42',
			state: {backdropView: `${listPath}?sort=created:asc`},
		})
		await flushPromises()
		await nextTick()

		const callsWhileOpen = getAll.mock.calls.length
		await router.push({path: listPath, query: {sort: 'created:asc'}})
		await flushPromises()
		await nextTick()

		expect(getAll.mock.calls.length).toBeGreaterThan(callsWhileOpen)
		expect(lastRequestParams().sort_by).toEqual(['created'])
	})
})
