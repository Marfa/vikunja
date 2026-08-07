<template>
	<div class="control repeat-after-input">
		<div class="preset-list mbs-2">
			<XButton
				variant="secondary"
				class="is-small preset"
				@click="() => setRepeatAfter(1, 'days')"
			>
				{{ $t('task.repeat.everyDay') }}
			</XButton>
			<XButton
				variant="secondary"
				class="is-small preset"
				@click="setEveryWeekday"
			>
				{{ $t('task.repeat.everyWeekday') }}
			</XButton>
			<XButton
				variant="secondary"
				class="is-small preset"
				@click="() => setRepeatAfter(1, 'weeks')"
			>
				{{ $t('task.repeat.everyWeek') }}
			</XButton>
			<XButton
				variant="secondary"
				class="is-small preset"
				@click="() => setRepeatAfter(30, 'days')"
			>
				{{ $t('task.repeat.every30d') }}
			</XButton>
		</div>
		<div class="is-flex is-align-items-center mbe-2 mode-row">
			<label
				for="repeatMode"
				class="mode-label"
			>
				{{ $t('task.repeat.mode') }}:
			</label>
			<div class="control is-expanded">
				<div class="select is-fullwidth">
					<select
						id="repeatMode"
						:value="task.repeatMode"
						@change="handleModeChange"
					>
						<option :value="TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT">
							{{ $t('misc.default') }}
						</option>
						<option :value="TASK_REPEAT_MODES.REPEAT_MODE_MONTH">
							{{ $t('task.repeat.monthly') }}
						</option>
						<option :value="TASK_REPEAT_MODES.REPEAT_MODE_FROM_CURRENT_DATE">
							{{ $t('task.repeat.fromCurrentDate') }}
						</option>
						<option :value="TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS">
							{{ $t('task.repeat.weekdays') }}
						</option>
					</select>
				</div>
			</div>
		</div>
		<div
			v-if="showIntervalFields"
			class="is-flex interval-row"
		>
			<p class="pis-4">
				{{ $t('task.repeat.each') }}
			</p>
			<div class="field has-addons is-fullwidth">
				<div class="control">
					<input
						v-model.number="repeatAfter.amount"
						:disabled="disabled || undefined"
						class="input"
						:placeholder="$t('task.repeat.specifyAmount')"
						type="number"
						min="0"
						@change="updateData"
					>
				</div>
				<div class="control">
					<div class="select">
						<select
							v-model="repeatAfter.type"
							:disabled="disabled || undefined"
							@change="updateData"
						>
							<option value="hours">
								{{ $t('task.repeat.hours') }}
							</option>
							<option value="days">
								{{ $t('task.repeat.days') }}
							</option>
							<option value="weeks">
								{{ $t('task.repeat.weeks') }}
							</option>
						</select>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import {ref, reactive, watch, computed} from 'vue'
import {useI18n} from 'vue-i18n'

import {error} from '@/message'

import {TASK_REPEAT_MODES, type IRepeatMode} from '@/types/IRepeatMode'
import type {IRepeatAfter} from '@/types/IRepeatAfter'
import type {ITask} from '@/modelTypes/ITask'
import TaskModel from '@/models/task'

const props = withDefaults(defineProps<{
	modelValue: ITask | undefined,
	disabled?: boolean
}>(), {
	disabled: false,
})

const emit = defineEmits<{
	'update:modelValue': [value: ITask | undefined],
}>()

const {t} = useI18n({useScope: 'global'})

const task = ref<ITask>(new TaskModel())
const repeatAfter = reactive({
	amount: 0,
	type: 'days' as IRepeatAfter['type'],
})

const showIntervalFields = computed(() => {
	const mode = Number(task.value.repeatMode)
	return mode !== TASK_REPEAT_MODES.REPEAT_MODE_MONTH && mode !== TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS
})

watch(
	() => props.modelValue,
	(value: ITask) => {
		task.value = value
		if (typeof value.repeatAfter !== 'undefined') {
			Object.assign(repeatAfter, value.repeatAfter)
		}
	},
	{
		immediate: true,
		deep: true,
	},
)

function coerceMode(mode: unknown): IRepeatMode {
	return Number(mode) as IRepeatMode
}

function updateData() {
	if (!task.value) {
		return
	}

	task.value.repeatMode = coerceMode(task.value.repeatMode)
	const mode = task.value.repeatMode

	if (
		(mode === TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT && repeatAfter.amount === 0) ||
		(mode === TASK_REPEAT_MODES.REPEAT_MODE_FROM_CURRENT_DATE && repeatAfter.amount === 0)
	) {
		return
	}

	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT && repeatAfter.amount < 0) {
		error({message: t('task.repeat.invalidAmount')})
		return
	}

	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS && (!repeatAfter.amount || repeatAfter.amount < 1)) {
		repeatAfter.amount = 1
		repeatAfter.type = 'days'
	}

	Object.assign(task.value.repeatAfter, repeatAfter)
	emit('update:modelValue', task.value)
}

function handleModeChange(event: Event) {
	const select = event.target as HTMLSelectElement
	const mode = coerceMode(select.value)
	task.value.repeatMode = mode
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS) {
		const nextAfter = {amount: 1, type: 'days' as IRepeatAfter['type']}
		Object.assign(repeatAfter, nextAfter)
		task.value.repeatAfter = {...nextAfter}
		emit('update:modelValue', task.value)
		return
	}
	updateData()
}

function setRepeatAfter(amount: number, type: IRepeatAfter['type']) {
	task.value.repeatMode = TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT
	Object.assign(repeatAfter, {amount, type})
	updateData()
}

/** Every Mon–Fri. */
function setEveryWeekday() {
	const nextAfter = {amount: 1, type: 'days' as IRepeatAfter['type']}
	Object.assign(repeatAfter, nextAfter)
	task.value.repeatMode = TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS
	task.value.repeatAfter = {...nextAfter}
	emit('update:modelValue', task.value)
}
</script>

<style lang="scss" scoped>
p {
	padding-block-start: 6px;
}

.input {
	min-inline-size: 2rem;
}

.preset-list {
	display: flex;
	flex-direction: column;
	gap: 0.35rem;
}

.preset {
	inline-size: 100%;
	justify-content: center;
	border: 1px solid var(--border) !important;
	box-shadow: none !important;
	text-transform: none;
	font-weight: 600;
}

.mode-row {
	gap: 0.5rem;
}

.mode-label {
	white-space: nowrap;
	flex-shrink: 0;
}

.interval-row {
	align-items: center;
}

.select.is-fullwidth,
.select.is-fullwidth select {
	inline-size: 100%;
}
</style>
