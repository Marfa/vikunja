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

export type RepeatAfterUpdate = {
	repeatMode: IRepeatMode
	repeatAfter: IRepeatAfter
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

const showIntervalFields = computed(() => {
	const mode = Number(repeatMode.value)
	return mode !== TASK_REPEAT_MODES.REPEAT_MODE_MONTH && mode !== TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS
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
	},
	{
		immediate: true,
		deep: true,
	},
)

function coerceMode(mode: unknown): IRepeatMode {
	return Number(mode) as IRepeatMode
}

/** Emit a plain DTO — never the reactive task Proxy. */
function emitUpdate(mode: IRepeatMode, after: IRepeatAfter) {
	emit('update:modelValue', {
		repeatMode: coerceMode(mode),
		repeatAfter: {
			amount: Number(after.amount) || 0,
			type: after.type || 'days',
		},
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

	emitUpdate(mode, repeatAfter)
}

function handleModeChange(event: Event) {
	const select = event.target as HTMLSelectElement
	const mode = coerceMode(select.value)
	repeatMode.value = mode
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS) {
		repeatAfter.amount = 1
		repeatAfter.type = 'days'
		emitUpdate(mode, repeatAfter)
		return
	}
	if (mode === TASK_REPEAT_MODES.REPEAT_MODE_MONTH) {
		repeatAfter.amount = 0
		repeatAfter.type = 'days'
		emitUpdate(mode, repeatAfter)
		return
	}
	updateData()
}

function setRepeatAfter(amount: number, type: IRepeatAfter['type']) {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_DEFAULT
	repeatAfter.amount = amount
	repeatAfter.type = type
	emitUpdate(repeatMode.value, repeatAfter)
}

/** Same calendar day each month (short months clamp to last day). */
function setEveryMonth() {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_MONTH
	repeatAfter.amount = 0
	repeatAfter.type = 'days'
	emitUpdate(repeatMode.value, repeatAfter)
}

/** Every Mon–Fri. */
function setEveryWeekday() {
	repeatMode.value = TASK_REPEAT_MODES.REPEAT_MODE_WEEKDAYS
	repeatAfter.amount = 1
	repeatAfter.type = 'days'
	emitUpdate(repeatMode.value, repeatAfter)
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
</style>
