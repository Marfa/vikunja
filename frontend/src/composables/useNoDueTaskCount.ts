import {ref} from 'vue'
import TaskService from '@/services/task'
import {noDueTaskFilterParams} from '@/helpers/noDueTasksFilter'
import {useAuthStore} from '@/stores/auth'

const noDueTaskCount = ref<number | null>(null)
let refreshPromise: Promise<void> | null = null

export async function refreshNoDueTaskCount(): Promise<void> {
	if (refreshPromise) {
		return refreshPromise
	}

	refreshPromise = (async () => {
		const authStore = useAuthStore()
		if (!authStore.authenticated) {
			noDueTaskCount.value = null
			return
		}

		const taskService = new TaskService()
		const params = {
			...noDueTaskFilterParams(authStore.settings.timezone),
			per_page: 1,
		}
		await taskService.getAll({}, params, 1)
		noDueTaskCount.value = taskService.totalPages
	})().finally(() => {
		refreshPromise = null
	})

	return refreshPromise
}

export function useNoDueTaskCount() {
	return {
		noDueTaskCount,
		refreshNoDueTaskCount,
	}
}
