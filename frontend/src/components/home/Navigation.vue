<template>
	<aside
		:class="{
			'is-active': baseStore.menuActive,
			'is-resizing': isResizing,
			'is-todoist-skin': isTodoist,
		}"
		class="menu-container"
		:style="{'--sidebar-width': sidebarWidth}"
	>
		<nav
			class="menu top-menu"
			:aria-label="$t('navigation.main')"
		>
			<NavigationTodoistTop
				v-if="isTodoist"
				:user-display-name="authStore.userDisplayName"
				:inbox-project="inboxProject"
				@add-task="openQuickActions"
			/>
			<NavigationDefaultTop
				v-else
				:time-tracking-enabled="timeTrackingEnabled"
			/>
		</nav>

		<Loading
			v-if="projectStore.isLoading"
			variant="small"
		/>
		<template v-else>
			<nav
				v-if="favoriteProjects.length"
				class="menu"
				:aria-label="$t('project.pseudo.favorites.title')"
			>
				<ProjectsNavigation
					:model-value="favoriteProjects"
					:can-edit-order="false"
					:can-collapse="false"
				/>
			</nav>
			
			<nav
				v-if="savedFilterProjects.length"
				class="menu"
				:aria-label="$t('navigation.savedFilters')"
			>
				<ProjectsNavigation
					:model-value="savedFilterProjects"
					:can-edit-order="false"
					:can-collapse="false"
				/>
			</nav>

			<nav
				class="menu"
				:aria-label="isTodoist ? $t('navigation.myProjects') : $t('project.projects')"
			>
				<p
					v-if="isTodoist"
					class="todoist-projects-label"
				>
					{{ $t('navigation.myProjects') }}
				</p>
				<ProjectsNavigation
					:model-value="projectsForNav"
					:can-edit-order="true"
					:can-collapse="true"
				/>
			</nav>

			<nav
				v-if="isTodoist"
				class="menu todoist-secondary-nav"
				:aria-label="$t('navigation.main')"
			>
				<menu class="menu-list other-menu-items">
					<li>
						<RouterLink
							v-shortcut="'KeyG KeyP'"
							:to="{ name: 'projects.index'}"
						>
							<span class="menu-item-icon icon">
								<Icon icon="layer-group" />
							</span>
							{{ $t('project.projects') }}
						</RouterLink>
					</li>
					<li>
						<RouterLink
							v-shortcut="'KeyG KeyA'"
							:to="{ name: 'labels.index'}"
						>
							<span class="menu-item-icon icon">
								<Icon icon="tags" />
							</span>
							{{ $t('label.title') }}
						</RouterLink>
					</li>
					<li>
						<RouterLink
							v-shortcut="'KeyG KeyM'"
							:to="{ name: 'teams.index'}"
						>
							<span class="menu-item-icon icon">
								<Icon icon="users" />
							</span>
							{{ $t('team.title') }}
						</RouterLink>
					</li>
					<li v-if="timeTrackingEnabled">
						<RouterLink :to="{ name: 'time-tracking'}">
							<span class="menu-item-icon icon">
								<Icon :icon="['far', 'clock']" />
							</span>
							{{ $t('timeTracking.title') }}
						</RouterLink>
					</li>
				</menu>
			</nav>
		</template>

		<PoweredByLink
			v-if="!isTodoist"
			class="mbs-auto"
			utm-medium="navigation"
		/>

		<div
			v-if="!isMobile"
			class="resize-handle"
			@mousedown="startResize"
			@touchstart="startResize"
		/>
	</aside>
</template>

<script setup lang="ts">
import {computed} from 'vue'

import PoweredByLink from '@/components/home/PoweredByLink.vue'
import Loading from '@/components/misc/Loading.vue'
import {createAsyncComponent} from '@/helpers/createAsyncComponent'

import {useBaseStore} from '@/stores/base'
import {useProjectStore} from '@/stores/projects'
import {useConfigStore} from '@/stores/config'
import {useAuthStore} from '@/stores/auth'
import {PRO_FEATURE} from '@/constants/proFeatures'
import ProjectsNavigation from '@/components/home/ProjectsNavigation.vue'
import type {IProject} from '@/modelTypes/IProject'
import {useSidebarResize} from '@/composables/useSidebarResize'
import {useUiSkin} from '@/composables/useUiSkin'

// Skin-specific menus live in separate chunks so Todoist instances
// do not download the default nav (and vice versa) until a skin switch.
const NavigationTodoistTop = createAsyncComponent(() => import('@/components/home/NavigationTodoistTop.vue'))
const NavigationDefaultTop = createAsyncComponent(() => import('@/components/home/NavigationDefaultTop.vue'))

const baseStore = useBaseStore()
const projectStore = useProjectStore()
const configStore = useConfigStore()
const authStore = useAuthStore()
const {isTodoist} = useUiSkin()

const timeTrackingEnabled = computed(() => configStore.isProFeatureEnabled(PRO_FEATURE.TIME_TRACKING))

const {sidebarWidth, isResizing, startResize, isMobile} = useSidebarResize()

const projects = computed(() => projectStore.notArchivedRootProjects as IProject[])
const favoriteProjects = computed(() => projectStore.favoriteProjects as IProject[])
const savedFilterProjects = computed(() => projectStore.savedFilterProjects as IProject[])

const inboxProject = computed(() => {
	const defaultId = authStore.settings.defaultProjectId
	if (defaultId && projectStore.projects[defaultId]) {
		return projectStore.projects[defaultId]
	}
	return projects.value.find(p => p.title === 'Inbox') ?? null
})

const projectsForNav = computed(() => {
	if (!isTodoist.value || !inboxProject.value) {
		return projects.value
	}
	return projects.value.filter(p => p.id !== inboxProject.value?.id)
})

function openQuickActions() {
	baseStore.setQuickActionsActive(true)
}
</script>

<style lang="scss" scoped>
.menu-container {
	--sidebar-width: #{$navbar-width};

	display: flex;
	flex-direction: column;
	background: var(--site-background);
	color: $vikunja-nav-color;
	padding: 1rem 0;
	transition: transform $transition-duration ease-in;
	position: fixed;
	inset-block-start: $navbar-height;
	inset-block-end: 0;
	inset-inline-start: 0;
	transform: translateX(-100%);
	inline-size: var(--sidebar-width);
	overflow-y: auto;

	[dir="rtl"] & {
		transform: translateX(100%);
	}

	@media screen and (max-width: $tablet) {
		inset-block-start: 0;
		inline-size: 70vw;
		z-index: 20;
	}

	&.is-active {
		transform: translateX(0);
		transition: transform $transition-duration ease-out;
	}

	&.is-resizing {
		transition: none;
	}
}

.resize-handle {
	position: absolute;
	inset-block-start: 0;
	inset-block-end: 0;
	inset-inline-end: 0;
	inline-size: 4px;
	cursor: ew-resize;
	background: transparent;
	transition: background-color $transition-duration ease;
	touch-action: none;

	&:hover,
	&:active {
		background-color: var(--primary);
	}
}

.top-menu :deep(.menu-list) {
	li {
		font-weight: 600;
		font-family: $vikunja-font;
	}

	.list-menu-link,
	li > a {
		padding-inline-start: 2rem;
		display: inline-block;

		.icon {
			padding-block-end: .25rem;
		}
	}
}

.menu + .menu {
	padding-block-start: math.div($navbar-padding, 2);
}

.todoist-projects-label {
	margin: 0.5rem 1rem 0.25rem;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.02em;
	color: var(--text-muted);
}

.todoist-secondary-nav {
	margin-block-start: auto;
	padding-block-start: 1rem;
	opacity: 0.85;
}
</style>
