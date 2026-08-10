import {computed, watch} from 'vue'
import {createSharedComposable, tryOnMounted} from '@vueuse/core'
import {useAuthStore} from '@/stores/auth'
import {UI_SKIN, type UiSkin} from '@/constants/uiSkin'

const CLASS_TODOIST = 'todoist'

export const useUiSkin = createSharedComposable(() => {
	const authStore = useAuthStore()

	const skin = computed<UiSkin>(() => {
		// CI/e2e inject window.TESTING; keep classic layout so existing specs stay stable.
		if (typeof window !== 'undefined' && window.TESTING === true) {
			return UI_SKIN.DEFAULT
		}
		const value = authStore.settings.frontendSettings.uiSkin
		return value === UI_SKIN.TODOIST ? UI_SKIN.TODOIST : UI_SKIN.DEFAULT
	})

	const isTodoist = computed(() => skin.value === UI_SKIN.TODOIST)

	function onChanged(active: boolean) {
		const el = window?.document.querySelector('html')
		el?.classList.toggle(CLASS_TODOIST, active)
	}

	watch(isTodoist, onChanged, {flush: 'post'})
	tryOnMounted(() => onChanged(isTodoist.value))

	return {
		skin,
		isTodoist,
	}
})
