import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {groupTasksByDueDay, sortTasksWithinDay} from './todoistTaskGroups'
import type {ITask} from '@/modelTypes/ITask'

vi.mock('@/i18n', () => ({
	i18n: {
		global: {
			t: (key: string) => key,
			locale: {value: 'en'},
		},
	},
}))

vi.mock('@/helpers/time/formatDate', () => ({
	formatDate: (date: Date, f: string) => {
		if (f === 'MMM D') {
			return `${date.getMonth() + 1}/${date.getDate()}`
		}
		return 'weekday'
	},
}))

function taskWithDue(id: number, due: Date, extras: Partial<ITask> = {}): ITask {
	return {id, dueDate: due, ...extras} as ITask
}

function taskWithStart(id: number, start: Date, extras: Partial<ITask> = {}): ITask {
	return {id, dueDate: null, startDate: start, ...extras} as ITask
}

describe('groupTasksByDueDay', () => {
	beforeEach(() => {
		vi.useFakeTimers()
		vi.setSystemTime(new Date(2026, 7, 3, 14, 30, 0)) // Aug 3 2026 afternoon local
	})

	afterEach(() => {
		vi.useRealTimers()
	})

	it('puts Todoist UTC-EOD dues on the intended calendar day', () => {
		const due = new Date(Date.UTC(2026, 7, 3, 23, 59, 0, 0)) // Aug 4 02:59 in UTC+3
		const groups = groupTasksByDueDay([taskWithDue(1, due)], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].key).toBe('2026-08-03')
		expect(groups[0].tasks).toHaveLength(1)
	})

	it('sorts within a day by priority desc then created asc', () => {
		const due = new Date(2026, 7, 3, 12, 0, 0)
		const groups = groupTasksByDueDay([
			taskWithDue(1, due, {priority: 1, created: new Date('2026-01-01')}),
			taskWithDue(2, due, {priority: 5, created: new Date('2026-06-01')}),
			taskWithDue(3, due, {priority: 5, created: new Date('2026-02-01')}),
			taskWithDue(4, due, {priority: 3, created: new Date('2026-03-01')}),
		], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].tasks.map(t => t.id)).toEqual([3, 2, 4, 1])
	})

	it('places start-date-only tasks on that day, not No date', () => {
		const start = new Date(2026, 7, 29, 12, 0, 0)
		const groups = groupTasksByDueDay([taskWithStart(16701, start)], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].key).toBe('2026-08-29')
		expect(groups[0].tasks.map(t => t.id)).toEqual([16701])
	})

	it('prefers due date over start date when both are set', () => {
		const groups = groupTasksByDueDay([
			taskWithDue(1, new Date(2026, 7, 10, 12, 0, 0), {
				startDate: new Date(2026, 7, 5, 12, 0, 0),
			}),
		], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].key).toBe('2026-08-10')
	})

	it('does not mark past start-date-only tasks as overdue', () => {
		const groups = groupTasksByDueDay([
			taskWithStart(1, new Date(2026, 6, 20, 12, 0, 0)),
		], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].key).toBe('2026-08-03')
		expect(groups[0].tasks.map(t => t.id)).toEqual([1])
	})

	it('still marks past due dates as overdue', () => {
		const groups = groupTasksByDueDay([
			taskWithDue(1, new Date(2026, 6, 20, 12, 0, 0)),
		], {fillRange: null})

		expect(groups).toHaveLength(1)
		expect(groups[0].key).toBe('overdue')
	})
})

describe('sortTasksWithinDay', () => {
	it('orders priority desc, then created asc', () => {
		const sorted = sortTasksWithinDay([
			{id: 1, priority: 2, created: new Date('2026-03-01')} as ITask,
			{id: 2, priority: 4, created: new Date('2026-05-01')} as ITask,
			{id: 3, priority: 4, created: new Date('2026-01-01')} as ITask,
		])
		expect(sorted.map(t => t.id)).toEqual([3, 2, 1])
	})
})
