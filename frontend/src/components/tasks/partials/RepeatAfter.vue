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
				@click="setEveryMonth"
			>
				{{ $t('task.repeat.everyMonth') }}
			</XButton>
			<XButton
				variant="secondary"
				class="is-small preset"
				@click="() => setMonthDays([10, 25])"
			>
				{{ $t('task.repeat.every10And20') }}
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
						:value="String(repeatMode)"
						@change="handleModeChange"
					>
						<option :value="String(TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT)">
							{{ $t('misc.default') }}
						</option>
						<option :value="String(TASK_REPEAT_MODES.REPEAT_MODE_MONTH)">
							{{ $t('task.repeat.monthly') }}
						</option>
						<option :value="String(TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS)">
							{{ $t('task.repeat.monthDays') }}
						</option>
						<option :value="String(TASK_REPEAT_MODES.REPEAT_MODE_FROM_CURRENT_DATE)">
							{{ $t('task.repeat.fromCurrentDate') }}
						</option>
						<option :value="String(TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS)">
							{{ $t('task.repeat.weekdays') }}
						</option>
					</select>
				</div>
			</div>
		</div>
		<div
			v-if="showMonthDayPicker"
			class="month-days mbe-2"
		>
			<p class="month-days-hint">
				{{ $t('task.repeat.monthDaysHint') }}
			</p>
			<div class="month-days-grid">
				<button
					v-for="day in 31"
					:key="day"
					type="button"
					class="month-day"
					:class="{'is-selected': selectedMonthDays.includes(day)}"
					:disabled="disabled || undefined"
					@click="toggleMonthDay(day)"
				>
					{{ day }}
				</button>
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
							<option value="years">
								{{ $t('task.repeat.years') }}
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

export type RepeatAfterUpdate = {
	repeatMode: IRepeatMode
	repeatAfter: IRepeatAfter
	repeatMonthDays: number[]
}

const props = withDefaults(defineProps<{
	modelValue: ITask | undefined,
	disabled?: boolean
}>(), {
	disabled: false,
})

const emit = defineEmits<{
	'update:modelValue': [value: RepeatAfterUpdate],
}>()

const {t} = useI18n({useScope: 'global'})

const repeatMode = ref<IRepeatMode>(TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT)
const repeatAfter = reactive<IRepeatAfter>({
	amount: 0,
	type: 'days',
})
const selectedMonthDays = ref<number[]>([])

const showIntervalFields = computed(() => {
	const mode = Number(repeatMode.value)
	return mode !== TASK_REPEAT_MODES.REPEAT_MODE_MONTH &&
		mode !== TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS &&
		mode !== TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS
})

const showMonthDayPicker = computed(() => {
	return Number(repeatMode.value) === TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS
})

watch(
	() => props.modelValue,
	(value: ITask | undefined) => {
		if (!value) {
			return
		}
		repeatMode.value = Number(value.repeatMode) as IRepeatMode
		if (typeof value.repeatAfter === 'object' && value.repeatAfter !== null) {
			Object.assign(repeatAfter, {
				amount: Number(value.repeatAfter.amount) || 0,
				type: value.repeatAfter.type || 'days',
			})
		}
		selectedMonthDays.value = Array.isArray(value.repeatMonthDays)
			? [...value.repeatMonthDays].map(Number).filter(d => d >= 1 && d <= 31).sort((a, b) => a - b)
			: []
	},
	{
		immediate: true,
		deep: true,
	},
)

function coerceMode(mode: unknown): IRepeatMode {
	return Number(mode) as IRepeatMode
}

function emitUpdate(mode: IRepeatMode, after: IRepeatAfter, days: number[]) {
	emit('update:modelValue', {
		repeatMode: coerceMode(mode),
		repeatAfter: {
			amount: Number(after.amount) || 0,
			type: after.type || 'days',
		},
		repeatMonthDays: [...days].sort((a, b) => a - b),
	})
}

function updateData() {
	const mode = coerceMode(repeatMode.value)

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

	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS && selectedMonthDays.value.length === 0) {
		error({message: t('task.repeat.invalidMonthDays')})
		return
	}

	emitUpdate(mode, repeatAfter, selectedMonthDays.value)
}

function handleModeChange(event: Event) {
	const select = event.target as HTMLSelectElement
	const mode = coerceMode(select.value)
	repeatMode.value = mode
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS) {
		repeatAfter.amount = 1
		repeatAfter.type = 'days'
		selectedMonthDays.value = []
		emitUpdate(mode, repeatAfter, selectedMonthDays.value)
		return
	}
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_MONTH) {
		repeatAfter.amount = 0
		repeatAfter.type = 'days'
		selectedMonthDays.value = []
		emitUpdate(mode, repeatAfter, selectedMonthDays.value)
		return
	}
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS) {
		repeatAfter.amount = 0
		repeatAfter.type = 'days'
		if (selectedMonthDays.value.length === 0) {
			selectedMonthDays.value = [10, 25]
		}
		emitUpdate(mode, repeatAfter, selectedMonthDays.value)
		return
	}
	selectedMonthDays.value = []
	updateData()
}

function setRepeatAfter(amount: number, type: IRepeatAfter['type']) {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT
	repeatAfter.amount = amount
	repeatAfter.type = type
	selectedMonthDays.value = []
	emitUpdate(repeatMode.value, repeatAfter, selectedMonthDays.value)
}

function setEveryMonth() {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_MONTH
	repeatAfter.amount = 0
	repeatAfter.type = 'days'
	selectedMonthDays.value = []
	emitUpdate(repeatMode.value, repeatAfter, selectedMonthDays.value)
}

function setMonthDays(days: number[]) {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS
	repeatAfter.amount = 0
	repeatAfter.type = 'days'
	selectedMonthDays.value = [...days].sort((a, b) => a - b)
	emitUpdate(repeatMode.value, repeatAfter, selectedMonthDays.value)
}

function toggleMonthDay(day: number) {
	const idx = selectedMonthDays.value.indexOf(day)
	if (idx >= 0) {
		selectedMonthDays.value = selectedMonthDays.value.filter(d => d !== day)
	} else {
		selectedMonthDays.value = [...selectedMonthDays.value, day].sort((a, b) => a - b)
	}
	if (selectedMonthDays.value.length === 0) {
		return
	}
	emitUpdate(TASK_REPEAT_MODES.REPEAT_MODE_MONTH_DAYS, repeatAfter, selectedMonthDays.value)
}

function setEveryWeekday() {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS
	repeatAfter.amount = 1
	repeatAfter.type = 'days'
	selectedMonthDays.value = []
	emitUpdate(repeatMode.value, repeatAfter, selectedMonthDays.value)
}
</script>

<style lang="scss" scoped>
p {
	padding-block-start: 0;
	margin: 0;
}

.input {
	min-inline-size: 3.5rem;
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
	flex-direction: column;
	align-items: stretch;
	gap: 0.35rem;
}

.mode-label {
	white-space: normal;
	flex-shrink: 0;
}

.interval-row {
	flex-wrap: wrap;
	align-items: center;
	gap: 0.5rem;

	.pis-4 {
		padding-inline-start: 0;
	}

	.field.has-addons {
		flex: 1 1 12rem;
		min-inline-size: 12rem;
		margin-block-end: 0;
	}
}

.select.is-fullwidth,
.select.is-fullwidth select {
	inline-size: 100%;
}

.month-days-hint {
	margin-block-end: 0.35rem;
	font-size: 0.85rem;
	color: var(--grey-500, #7a7a7a);
}

.month-days-grid {
	display: grid;
	grid-template-columns: repeat(7, minmax(0, 1fr));
	gap: 0.25rem;
}

.month-day {
	appearance: none;
	border: 1px solid var(--border);
	border-radius: 4px;
	background: transparent;
	color: inherit;
	font: inherit;
	font-weight: 600;
	padding-block: 0.35rem;
	cursor: pointer;

	&.is-selected {
		background: var(--primary, #1973ff);
		border-color: var(--primary, #1973ff);
		color: var(--white, #ffffff);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
}
</style>
