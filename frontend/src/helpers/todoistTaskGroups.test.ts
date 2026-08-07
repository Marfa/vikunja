import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {groupTasksByDueDay} from './todoistTaskGroups'
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

function taskWithDue(id: number, due: Date): ITask {
	return {id, dueDate: due} as ITask
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
})
