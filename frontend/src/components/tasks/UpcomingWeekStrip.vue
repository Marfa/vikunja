<template>
	<div class="upcoming-week-strip">
		<div class="upcoming-week-strip__month">
			{{ monthLabel }}
		</div>
		<div
			class="upcoming-week-strip__days"
			role="list"
		>
			<button
				v-for="day in days"
				:key="day.key"
				type="button"
				class="upcoming-week-strip__day"
				:class="{
					'is-today': day.isToday,
					'is-selected': day.key === selectedKey,
				}"
				role="listitem"
				@click="emit('select', day.date)"
			>
				<span class="upcoming-week-strip__weekday">{{ day.weekday }}</span>
				<span class="upcoming-week-strip__date">{{ day.dayOfMonth }}</span>
			</button>
		</div>
	</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import dayjs from 'dayjs'
import {formatDate} from '@/helpers/time/formatDate'
import {useAuthStore} from '@/stores/auth'

const props = defineProps<{
	selected?: Date | string | null,
}>()

const emit = defineEmits<{
	select: [date: Date],
}>()

const authStore = useAuthStore()

const weekStart = computed(() => authStore.settings.weekStart ?? 1)

const anchor = computed(() => {
	const base = props.selected ? dayjs(props.selected) : dayjs()
	return base.isValid() ? base : dayjs()
})

const monthLabel = computed(() => formatDate(anchor.value.toDate(), 'MMMM YYYY'))

const selectedKey = computed(() => {
	if (!props.selected) {
		return dayjs().format('YYYY-MM-DD')
	}
	const d = dayjs(props.selected)
	return d.isValid() ? d.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD')
})

const days = computed(() => {
	const dow = anchor.value.day() // 0 Sun … 6 Sat
	const diff = (dow - weekStart.value + 7) % 7
	const weekBegin = anchor.value.startOf('day').subtract(diff, 'day')

	const todayKey = dayjs().format('YYYY-MM-DD')
	return Array.from({length: 7}, (_, i) => {
		const date = weekBegin.add(i, 'day')
		const key = date.format('YYYY-MM-DD')
		return {
			key,
			date: date.toDate(),
			weekday: formatDate(date.toDate(), 'dd'),
			dayOfMonth: date.date(),
			isToday: key === todayKey,
		}
	})
})
</script>

<style lang="scss" scoped>
.upcoming-week-strip {
	margin-block-end: 1.5rem;
}

.upcoming-week-strip__month {
	font-size: 0.9rem;
	font-weight: 600;
	color: var(--text-muted);
	margin-block-end: 0.75rem;
}

.upcoming-week-strip__days {
	display: flex;
	gap: 0.25rem;
	align-items: center;
}

.upcoming-week-strip__day {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0.35rem;
	flex: 1;
	max-width: 3.5rem;
	padding: 0.35rem 0.25rem;
	border: none;
	background: transparent;
	cursor: pointer;
	border-radius: 999px;
	color: var(--text);
}

.upcoming-week-strip__weekday {
	font-size: 0.7rem;
	text-transform: lowercase;
	color: var(--text-muted);
}

.upcoming-week-strip__date {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 2rem;
	height: 2rem;
	border-radius: 50%;
	font-weight: 600;
	font-size: 0.95rem;
}

.upcoming-week-strip__day.is-today .upcoming-week-strip__date,
.upcoming-week-strip__day.is-selected .upcoming-week-strip__date {
	background: var(--text-strong);
	color: #fff;
}

.upcoming-week-strip__day:hover .upcoming-week-strip__date {
	background: rgba(0, 0, 0, 0.08);
}

.upcoming-week-strip__day.is-today:hover .upcoming-week-strip__date,
.upcoming-week-strip__day.is-selected:hover .upcoming-week-strip__date {
	background: var(--text-strong);
}
</style>
