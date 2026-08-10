<template>
	<div class="todoist-task-groups">
		<section
			v-for="group in groups"
			:id="group.domId"
			:key="group.key"
			class="todoist-day-group"
		>
			<h3 class="todoist-day-group__title">
				{{ group.label }}
			</h3>
			<ul class="tasks todoist-tasks">
				<li
					v-for="task in group.tasks"
					:key="task.id"
				>
					<SingleTaskInProject
						:show-project="true"
						:the-task="task"
						:can-mark-as-done="canMarkDone(task)"
						:all-tasks="allTasks"
						@taskUpdated="emit('taskUpdated', $event)"
						@taskDeleted="emit('taskDeleted', $event)"
					/>
				</li>
			</ul>
			<div
				v-if="showAdd"
				class="todoist-day-group__add"
			>
				<BaseButton
					v-if="!openAdd[group.key]"
					class="todoist-add-link"
					@click="openAdd[group.key] = true"
				>
					+ {{ $t('navigation.addTask') }}
				</BaseButton>
				<AddTask
					v-else
					:default-due-date="group.dueDate"
					:compact="true"
					@tasksAdded="emit('tasksAdded', $event)"
				/>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import {reactive} from 'vue'
import type {ITask} from '@/modelTypes/ITask'
import type {TodoistDayGroup} from '@/helpers/todoistTaskGroups'
import SingleTaskInProject from '@/components/tasks/partials/SingleTaskInProject.vue'
import AddTask from '@/components/tasks/AddTask.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import {useProjectStore} from '@/stores/projects'
import {PERMISSIONS} from '@/constants/permissions'

withDefaults(defineProps<{
	groups: TodoistDayGroup[],
	allTasks?: ITask[],
	showAdd?: boolean,
}>(), {
	allTasks: () => [],
	showAdd: true,
})

const emit = defineEmits<{
	taskUpdated: [task: ITask],
	taskDeleted: [task: ITask],
	tasksAdded: [tasks: ITask[]],
}>()

const projectStore = useProjectStore()
const openAdd = reactive<Record<string, boolean>>({})

function canMarkDone(task: ITask) {
	return (projectStore.projects[task.projectId]?.maxPermission ?? 0) > PERMISSIONS.READ
}
</script>

<style lang="scss" scoped>
.todoist-day-group {
	margin-block-end: 1.75rem;
}

.todoist-day-group__title {
	font-size: 0.95rem;
	font-weight: 700;
	margin: 0 0 0.5rem;
	color: var(--text-muted);
}

.todoist-tasks {
	list-style: none;
	margin: 0;
	padding: 0;
}

.todoist-day-group__add {
	margin-block-start: 0.25rem;
	padding-inline-start: 0.25rem;
}

.todoist-add-link {
	color: var(--text-muted);
	font-size: 0.9rem;
	padding: 0.35rem 0;

	&:hover {
		color: var(--primary);
	}
}
</style>
