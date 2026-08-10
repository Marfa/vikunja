import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest'
import {createPinia, setActivePinia} from 'pinia'
import {UI_SKIN} from '@/constants/uiSkin'
import {useAuthStore} from '@/stores/auth'

vi.mock('@vueuse/core', async () => {
	const actual = await vi.importActual<typeof import('@vueuse/core')>('@vueuse/core')
	return {
		...actual,
		createSharedComposable: <T>(fn: () => T) => fn,
	}
})

describe('useUiSkin', () => {
	beforeEach(() => {
		setActivePinia(createPinia())
		delete window.TESTING
	})

	afterEach(() => {
		delete window.TESTING
		vi.resetModules()
	})

	it('forces classic skin when window.TESTING is set', async () => {
		window.TESTING = true
		const authStore = useAuthStore()
		authStore.settings.frontendSettings.uiSkin = UI_SKIN.TODOIST

		const {useUiSkin} = await import('./useUiSkin')
		const {skin, isTodoist} = useUiSkin()

		expect(skin.value).toBe(UI_SKIN.DEFAULT)
		expect(isTodoist.value).toBe(false)
	})

	it('uses saved todoist skin outside tests', async () => {
		const authStore = useAuthStore()
		authStore.settings.frontendSettings.uiSkin = UI_SKIN.TODOIST

		const {useUiSkin} = await import('./useUiSkin')
		const {skin, isTodoist} = useUiSkin()

		expect(skin.value).toBe(UI_SKIN.TODOIST)
		expect(isTodoist.value).toBe(true)
	})
})
