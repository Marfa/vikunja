import {computed, defineAsyncComponent, h, shallowRef, type VNode, watchEffect} from 'vue'
import {useRoute, useRouter, type RouteLocationNormalizedGeneric} from 'vue-router'
import {useBaseStore} from '@/stores/base'

export function useRouteWithModal() {
	const router = useRouter()
	const route = useRoute()
	const backdropView = computed(() => route.fullPath ? router.options.history.state?.backdropView : undefined)
	const baseStore = useBaseStore()

	const routeWithModal = computed(() => {
		return backdropView.value
			? router.resolve(backdropView.value) as RouteLocationNormalizedGeneric
			: route
	})

	const currentModal = shallowRef<VNode>()
	watchEffect(() => {
		if (!backdropView.value) {
			currentModal.value = undefined
			return
		}

		// this is adapted from vue-router
		// https://github.com/vuejs/vue-router-next/blob/798cab0d1e21f9b4d45a2bd12b840d2c7415f38a/src/RouterView.ts#L125
		const routePropsOption = route.matched[0]?.props.default
		let routeProps = undefined
		if (routePropsOption) {
			if (routePropsOption === true) {
				routeProps = route.params
			} else {
				if (typeof routePropsOption === 'function') {
					routeProps = routePropsOption(route)
				} else {
					routeProps = routePropsOption
				}
			}
		}

		if (typeof routeProps === 'undefined') {
			currentModal.value = undefined
			return
		}

		routeProps.backdropView = backdropView.value

		let component = route.matched[0]?.components?.default

		if (typeof component === 'function') {
			component = defineAsyncComponent(component)
		}

		if (!component) {
			currentModal.value = undefined
			return
		}
		currentModal.value = h(component, routeProps)
	})

	const historyState = computed(() => route.fullPath ? router.options.history.state : undefined)

	function closeModal() {
		// Prefer the list/project the user opened the task from. Do not follow
		// a task that was moved to another project — stay in the original context.
		if (historyState.value?.back) {
			router.back()
			return
		}

		const backdropRoute = historyState.value?.backdropView && router.resolve(historyState.value.backdropView)
		if (backdropRoute && backdropRoute.params?.projectId !== '0') {
			router.push(backdropRoute)
			return
		}

		if (baseStore.currentProject && baseStore.currentProject.id !== 0) {
			router.push({
				name: 'project.index',
				params: { projectId: baseStore.currentProject.id },
			})
		} else {
			router.push({ name: 'home' })
		}
	}

	return {routeWithModal, currentModal, closeModal}
}
