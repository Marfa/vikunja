import dayjs from 'dayjs'
import type {ITask} from '@/modelTypes/ITask'
import {formatDate} from '@/helpers/time/formatDate'
import {resolveDateOnlyDue} from '@/helpers/time/resolveDateOnlyDue'
import {i18n} from '@/i18n'

export interface TodoistDayGroup {
	key: string
	domId: string
	label: string
	dueDate: Date | null
	tasks: ITask[]
}

function createdTime(task: ITask): number {
	const created = task.created
	if (!created) {
		return 0
	}
	const t = +created
	return Number.isFinite(t) ? t : 0
}

/** Within a day: priority desc, then created asc. */
export function sortTasksWithinDay(tasks: ITask[]): ITask[] {
	return [...tasks].sort((a, b) => {
		const byPriority = (b.priority ?? 0) - (a.priority ?? 0)
		if (byPriority !== 0) {
			return byPriority
		}
		return createdTime(a) - createdTime(b)
	})
}

function dayLabel(date: dayjs.Dayjs): string {
	const t = i18n.global.t
	const today = dayjs().startOf('day')
	const target = date.startOf('day')
	const datePart = formatDate(target.toDate(), 'MMM D')
	const weekday = formatDate(target.toDate(), 'dddd')

	if (target.isSame(today, 'day')) {
		return `${datePart} · ${t('navigation.today')} · ${weekday}`
	}
	if (target.isSame(today.add(1, 'day'), 'day')) {
		return `${datePart} · ${t('input.datepicker.tomorrow')} · ${weekday}`
	}
	return `${datePart} · ${weekday}`
}

/** Due date wins; else start date. Only a past due counts as overdue. */
export function taskGroupingDate(task: ITask): {date: Date, isDue: boolean} | null {
	if (task.dueDate && +task.dueDate > 0) {
		const due = resolveDateOnlyDue(task.dueDate)
		if (!isNaN(+due)) {
			return {date: due, isDue: true}
		}
	}
	if (task.startDate && +task.startDate > 0) {
		const start = task.startDate instanceof Date ? task.startDate : new Date(task.startDate)
		if (!isNaN(+start)) {
			return {date: start, isDue: false}
		}
	}
	return null
}

/**
 * Group tasks by due date for Todoist-like lists.
 * When fillRange is set, empty days in [from, to) are included (Upcoming).
 * When fillRange is null, only days that have tasks (+ overdue / no-date).
 */
export function groupTasksByDueDay(
	tasks: ITask[],
	options: {
		fillRange?: {from: Date | string, to: Date | string} | null,
		includeNoDate?: boolean,
	} = {},
): TodoistDayGroup[] {
	const t = i18n.global.t
	const today = dayjs().startOf('day')
	const byDay = new Map<string, ITask[]>()
	const noDate: ITask[] = []
	const overdue: ITask[] = []

	for (const task of tasks) {
		const grouping = taskGroupingDate(task)
		if (!grouping) {
			noDate.push(task)
			continue
		}
		const day = dayjs(grouping.date)
		if (!day.isValid()) {
			noDate.push(task)
			continue
		}
		if (grouping.isDue && day.isBefore(today, 'day')) {
			overdue.push(task)
			continue
		}
		// Start-only tasks that already began belong on today, not overdue / vanished past days.
		const place = !grouping.isDue && day.isBefore(today, 'day') ? today : day
		const key = place.format('YYYY-MM-DD')
		const list = byDay.get(key) ?? []
		list.push(task)
		byDay.set(key, list)
	}

	const groups: TodoistDayGroup[] = []

	if (overdue.length > 0) {
		groups.push({
			key: 'overdue',
			domId: 'todoist-day-overdue',
			label: t('task.show.overdueGroup'),
			dueDate: null,
			tasks: sortTasksWithinDay(overdue),
		})
	}

	if (options.fillRange) {
		const fromParsed = dayjs(options.fillRange.from)
		const toParsed = dayjs(options.fillRange.to)
		const from = (fromParsed.isValid() ? fromParsed : today).startOf('day')
		const to = (toParsed.isValid() ? toParsed : today.add(7, 'day')).startOf('day')
		let cursor = from.isBefore(today, 'day') ? today : from
		while (cursor.isBefore(to, 'day')) {
			const key = cursor.format('YYYY-MM-DD')
			groups.push({
				key,
				domId: `todoist-day-${key}`,
				label: dayLabel(cursor),
				dueDate: cursor.toDate(),
				tasks: sortTasksWithinDay(byDay.get(key) ?? []),
			})
			cursor = cursor.add(1, 'day')
		}
	} else {
		const keys = [...byDay.keys()].sort()
		for (const key of keys) {
			const d = dayjs(key)
			groups.push({
				key,
				domId: `todoist-day-${key}`,
				label: dayLabel(d),
				dueDate: d.toDate(),
				tasks: sortTasksWithinDay(byDay.get(key) ?? []),
			})
		}
	}

	if (options.includeNoDate !== false && noDate.length > 0) {
		groups.push({
			key: 'nodate',
			domId: 'todoist-day-nodate',
			label: t('task.show.noDateGroup'),
			dueDate: null,
			tasks: sortTasksWithinDay(noDate),
		})
	}

	return groups
}
