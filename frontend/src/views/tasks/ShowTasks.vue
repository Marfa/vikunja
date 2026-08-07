<template>
	<div
		v-cy="'showTasks'"
		class="is-max-width-desktop has-text-start"
		:class="{'todoist-upcoming': useTodoistList}"
	>
		<h2
			v-if="!hideTitle"
			class="mbe-2 title"
		>
			{{ pageTitle }}
		</h2>

		<UpcomingWeekStrip
			v-if="useTodoistUpcoming"
			:selected="selectedStripDay"
			@select="scrollToDay"
		/>

		<Message
			v-if="filteredLabels.length > 0"
			class="label-filter-info mbe-2"
		>
			<i18n-t
				keypath="task.show.filterByLabel"
				tag="span"
				class="filter-label-text"
			>
				<template #label>
					<XLabel
						v-for="label in filteredLabels"
						:key="label.id"
						:label="label"
					/>
				</template>
			</i18n-t>
			<BaseButton
				v-tooltip="$t('task.show.clearLabelFilter')"
				class="clear-filter-button"
				:aria-label="$t('task.show.clearLabelFilter')"
				@click="clearLabelFilter"
			>
				<Icon icon="times" />
			</BaseButton>
		</Message>
		<Message
			v-if="savedFilterIgnored"
			class="mbe-2"
		>
			{{ $t('task.show.savedFilterIgnored') }}
		</Message>
		<p
			v-if="!showAll && !useTodoistList"
			class="show-tasks-options"
		>
			<DatepickerWithRange @update:modelValue="setDate">
				<template #trigger="{toggle}">
					<XButton
						variant="primary"
						:shadow="false"
						class="mbe-2"
						@click.prevent.stop="toggle()"
					>
						{{ $t('task.show.select') }}
					</XButton>
				</template>
			</DatepickerWithRange>
			<FancyCheckbox
				:model-value="showNulls"
				class="mie-2"
				@update:modelValue="setShowNulls"
			>
				{{ $t('task.show.noDates') }}
			</FancyCheckbox>
			<FancyCheckbox
				:model-value="showOverdue"
				@update:modelValue="setShowOverdue"
			>
				{{ $t('task.show.overdue') }}
			</FancyCheckbox>
		</p>
		<template v-if="!loading && (!tasks || tasks.length === 0) && showNothingToDo && !useTodoistList">
			<h3 class="has-text-centered mbs-6">
				{{ $t('task.show.noTasks') }}
			</h3>
			<LlamaCool class="llama-cool" />
		</template>

		<template v-if="useTodoistList">
			<TodoistTaskDayGroups
				:groups="taskGroups"
				:all-tasks="tasks"
				@taskUpdated="updateTasks"
				@tasksAdded="onTasksAdded"
			/>
			<div
				v-if="loading"
				class="spinner is-loading"
			/>
		</template>

		<template v-else>
			<Card
				v-if="hasTasks"
				:padding="false"
				class="has-overflow"
				:has-content="false"
				:loading="loading"
			>
				<ul class="p-2 tasks">
					<li
						v-for="task in tasks"
						:key="task.id"
					>
						<SingleTaskInProject
							:show-project="true"
							:the-task="task"
							:can-mark-as-done="(projectStore.projects[task.projectId]?.maxPermission ?? 0) > PERMISSIONS.READ"
							@taskUpdated="updateTasks"
						/>
					</li>
				</ul>
			</Card>
			<div
				v-else
				:class="{ 'is-loading': loading}"
				class="spinner"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
import {computed, ref, watch, watchEffect} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useI18n} from 'vue-i18n'
import dayjs from 'dayjs'

import {formatDate} from '@/helpers/time/formatDate'
import {setTitle} from '@/helpers/setTitle'
import {groupTasksByDueDay} from '@/helpers/todoistTaskGroups'

import BaseButton from '@/components/base/BaseButton.vue'
import Icon from '@/components/misc/Icon'
import Message from '@/components/misc/Message.vue'
import FancyCheckbox from '@/components/input/FancyCheckbox.vue'
import SingleTaskInProject from '@/components/tasks/partials/SingleTaskInProject.vue'
import DatepickerWithRange from '@/components/date/DatepickerWithRange.vue'
import XLabel from '@/components/tasks/partials/Label.vue'
import TodoistTaskDayGroups from '@/components/tasks/TodoistTaskDayGroups.vue'
import UpcomingWeekStrip from '@/components/tasks/UpcomingWeekStrip.vue'
import {DATE_RANGES} from '@/components/date/dateRanges'
import LlamaCool from '@/assets/llama-cool.svg?component'
import type {ITask} from '@/modelTypes/ITask'
import {useAuthStore} from '@/stores/auth'
import {useTaskStore} from '@/stores/tasks'
import {useProjectStore} from '@/stores/projects'
import {useLabelStore} from '@/stores/labels'
import type {TaskFilterParams} from '@/services/taskCollection'
import TaskCollectionService from '@/services/taskCollection'
import {PERMISSIONS} from '@/constants/permissions'
import {useUiSkin} from '@/composables/useUiSkin'

const props = withDefaults(defineProps<{
	dateFrom?: Date | string,
	dateTo?: Date | string,
	showNulls?: boolean,
	showOverdue?: boolean,
	labelIds?: string[],
	hideTitle?: boolean,
}>(), {
	showNulls: false,
	showOverdue: false,
	dateFrom: undefined,
	dateTo: undefined,
	labelIds: undefined,
	hideTitle: false,
})

const emit = defineEmits<{
	'tasksLoaded': true,
	'clearLabelFilter': void,
}>()

const authStore = useAuthStore()
const taskStore = useTaskStore()
const projectStore = useProjectStore()
const labelStore = useLabelStore()
const {isTodoist} = useUiSkin()

const route = useRoute()
const router = useRouter()
const {t} = useI18n({useScope: 'global'})

const tasks = ref<ITask[]>([])
const showNothingToDo = ref<boolean>(false)
const taskCollectionService = ref(new TaskCollectionService())
const selectedStripDay = ref<Date>(new Date())

setTimeout(() => showNothingToDo.value = true, 100)

const showAll = computed(() => typeof props.dateFrom === 'undefined' || typeof props.dateTo === 'undefined')
const useTodoistList = computed(() => isTodoist.value)
const useTodoistUpcoming = computed(() => isTodoist.value && !showAll.value)

const filteredLabels = computed(() => {
	if (!props.labelIds || props.labelIds.length === 0) {
		return []
	}
	return props.labelIds
		.map(id => labelStore.getLabelById(Number(id)))
		.filter(label => label !== null && label !== undefined)
})

const savedFilterIgnored = computed(() => {
	return filteredLabels.value.length > 0
		&& filterIdUsedOnOverview.value
		&& typeof projectStore.projects[filterIdUsedOnOverview.value] !== 'undefined'
})

const pageTitle = computed(() => {
	if (useTodoistUpcoming.value) {
		return t('navigation.upcoming')
	}
	if (useTodoistList.value && showAll.value) {
		return t('navigation.today')
	}

	const predefinedRange = Object.entries(DATE_RANGES)
		.find(([, value]) => props.dateFrom === value[0] && props.dateTo === value[1])
		?.[0]
	if (typeof predefinedRange !== 'undefined') {
		return t(`input.datepickerRange.ranges.${predefinedRange}`)
	}

	return showAll.value
		? t('task.show.titleCurrent')
		: t('task.show.fromuntil', {
			from: formatDate(props.dateFrom, 'LL'),
			until: formatDate(props.dateTo, 'LL'),
		})
})
const hasTasks = computed(() => Boolean(tasks.value?.length))
const userAuthenticated = computed(() => authStore.authenticated)
const loading = computed(() => taskStore.isLoading || taskCollectionService.value.loading)
const filterIdUsedOnOverview = computed(() => authStore.settings?.frontendSettings?.filterIdUsedOnOverview)

const taskGroups = computed(() => {
	if (!useTodoistList.value) {
		return []
	}
	return groupTasksByDueDay(tasks.value, {
		fillRange: showAll.value
			? null
			: {from: props.dateFrom!, to: props.dateTo!},
		includeNoDate: showAll.value || props.showNulls,
	})
})

interface dateStrings {
	dateFrom: string,
	dateTo: string,
}

function setDate(dates: dateStrings) {
	router.push({
		name: route.name as string,
		query: {
			from: dates.dateFrom ?? props.dateFrom,
			to: dates.dateTo ?? props.dateTo,
			showOverdue: props.showOverdue ? 'true' : 'false',
			showNulls: props.showNulls ? 'true' : 'false',
		},
	})
}

function setShowOverdue(show: boolean) {
	router.push({
		name: route.name as string,
		query: {
			...route.query,
			showOverdue: show ? 'true' : 'false',
		},
	})
}

function setShowNulls(show: boolean) {
	router.push({
		name: route.name as string,
		query: {
			...route.query,
			showNulls: show ? 'true' : 'false',
		},
	})
}

function clearLabelFilter() {
	emit('clearLabelFilter')
}

function scrollToDay(date: Date) {
	selectedStripDay.value = date
	const key = dayjs(date).format('YYYY-MM-DD')
	const el = document.getElementById(`todoist-day-${key}`)
	el?.scrollIntoView({behavior: 'smooth', block: 'start'})
}

async function onTasksAdded() {
	await loadPendingTasks(props.dateFrom as Date|string, props.dateTo as Date|string, filterIdUsedOnOverview.value)
}

async function loadPendingTasks(from: Date|string, to: Date|string, filterId: number | null | undefined) {
	if (!userAuthenticated.value) {
		return
	}

	const params: TaskFilterParams = {
		sort_by: ['due_date', 'id'],
		order_by: ['asc', 'desc'],
		filter: 'done = false',
		filter_include_nulls: props.showNulls || showAll.value,
		s: '',
		expand: ['comment_count', 'is_unread'],
	}

	if (!showAll.value) {
		params.filter += ` && due_date < '${to instanceof Date ? to.toISOString() : to}'`

		// Todoist skin hides "show overdue"; always include past-due like Todoist Upcoming.
		if (!props.showOverdue && !useTodoistUpcoming.value) {
			params.filter += ` && due_date >= '${from instanceof Date ? from.toISOString() : from}'`
		}
	}

	if (props.labelIds && props.labelIds.length > 0) {
		const labelFilter = `labels in ${props.labelIds.join(', ')}`
		params.filter += params.filter ? ` && ${labelFilter}` : labelFilter
	}

	let projectId = null
	if (showAll.value && filterId && typeof projectStore.projects[filterId] !== 'undefined'
		&& (!props.labelIds || props.labelIds.length === 0)) {
		projectId = filterId
	}

	tasks.value = await taskStore.loadTasks(params, projectId)
	emit('tasksLoaded', true)
}

function updateTasks(updatedTask: ITask) {
	for (let t = 0; t < tasks.value.length; t++) {
		if (tasks.value[t].id === updatedTask.id) {
			tasks.value[t] = updatedTask
			if (updatedTask.done) {
				tasks.value.splice(t, 1)
				tasks.value.push(updatedTask)
			}
			break
		}
	}
}

watch(
	[
		() => props.dateFrom,
		() => props.dateTo,
		() => props.showOverdue,
		() => props.showNulls,
		filterIdUsedOnOverview,
		useTodoistUpcoming,
	],
	() => loadPendingTasks(props.dateFrom as Date|string, props.dateTo as Date|string, filterIdUsedOnOverview.value),
	{immediate: true},
)
watchEffect(() => setTitle(pageTitle.value))
</script>

<style lang="scss" scoped>
.tasks {
	list-style: none;
	margin: 0;
}

.show-tasks-options {
	display: flex;
	flex-direction: column;
}

.llama-cool {
	margin: 3rem auto 0;
	display: block;
}

.label-filter-info {
	margin-block-end: 1rem;
	
	.clear-filter-button {
		margin-inline-start: auto;
		padding: 0.25rem 0.5rem;
		
		&:hover {
			color: var(--danger);
		}
	}

	:deep(.message.info) {
		inline-size: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
}

.todoist-upcoming {
	.title {
		font-size: 1.75rem;
		font-weight: 700;
		margin-block-end: 1rem;
	}
}
</style>
