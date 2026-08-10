<template>
	<RouterLink
		:to="{name: 'home'}"
		class="logo"
		:aria-label="$t('navigation.home')"
	>
		<Logo
			width="164"
			height="48"
		/>
	</RouterLink>
	<menu class="menu-list other-menu-items">
		<li>
			<RouterLink
				v-shortcut="'KeyG KeyO'"
				:to="{ name: 'home'}"
			>
				<span class="menu-item-icon icon">
					<Icon icon="calendar" />
				</span>
				{{ $t('navigation.overview') }}
			</RouterLink>
		</li>
		<li>
			<RouterLink
				v-shortcut="'KeyG KeyU'"
				:to="{ name: 'tasks.range'}"
			>
				<span class="menu-item-icon icon">
					<Icon :icon="['far', 'calendar-alt']" />
				</span>
				{{ $t('navigation.upcoming') }}
			</RouterLink>
		</li>
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
</template>

<script setup lang="ts">
import Logo from '@/components/home/Logo.vue'

defineProps<{
	timeTrackingEnabled: boolean
}>()
</script>

<style lang="scss" scoped>
.logo {
	display: block;

	padding-inline-start: 1rem;
	margin-inline-end: 1rem;
	margin-block-end: 1rem;

	@media screen and (min-width: $tablet) {
		display: none;
	}
}
</style>
