<template>
	<div class="todoist-sidebar-header">
		<span class="todoist-user-name">{{ userDisplayName }}</span>
	</div>
	<BaseButton
		class="todoist-add-task"
		@click="$emit('addTask')"
	>
		<span class="todoist-add-task__icon">
			<Icon icon="plus" />
		</span>
		{{ $t('navigation.addTask') }}
	</BaseButton>
	<menu class="menu-list other-menu-items">
		<li v-if="inboxProject">
			<RouterLink
				v-shortcut="'KeyG KeyI'"
				:to="{ name: 'project.index', params: { projectId: inboxProject.id } }"
			>
				<span class="menu-item-icon icon">
					<Icon icon="inbox" />
				</span>
				{{ $t('project.inboxTitle') }}
			</RouterLink>
		</li>
		<li>
			<RouterLink
				v-shortcut="'KeyG KeyO'"
				:to="{ name: 'home'}"
			>
				<span class="menu-item-icon icon">
					<Icon :icon="['far', 'sun']" />
				</span>
				{{ $t('navigation.today') }}
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
	</menu>
</template>

<script setup lang="ts">
import BaseButton from '@/components/base/BaseButton.vue'
import type {IProject} from '@/modelTypes/IProject'

defineProps<{
	userDisplayName: string
	inboxProject: IProject | null
}>()

defineEmits<{
	addTask: []
}>()
</script>

<style lang="scss" scoped>
.todoist-sidebar-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 1rem 0.75rem;
}

.todoist-user-name {
	font-weight: 700;
	font-size: 0.95rem;
	color: var(--text-strong);
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.todoist-add-task {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	margin: 0 0.75rem 0.75rem;
	padding: 0.45rem 0.75rem;
	border-radius: 8px;
	color: var(--primary);
	font-weight: 600;
	inline-size: calc(100% - 1.5rem);

	&:hover {
		background: rgba(0, 0, 0, 0.04);
	}
}

.todoist-add-task__icon {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	inline-size: 1.5rem;
	block-size: 1.5rem;
	border-radius: 50%;
	background: var(--primary);
	color: #ffffff;
	font-size: 0.75rem;
}
</style>
