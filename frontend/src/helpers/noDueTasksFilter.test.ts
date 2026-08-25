import {describe, it, expect} from 'vitest'
import {noDueTaskFilterParams, taskCountsAsNoDue} from './noDueTasksFilter'
import type {ITask} from '@/modelTypes/ITask'

describe('noDueTaskFilterParams', () => {
	it('matches the no-due sidebar filter shape', () => {
		expect(noDueTaskFilterParams('Europe/Moscow')).toEqual({
			sort_by: ['priority', 'created', 'id'],
			order_by: ['desc', 'asc', 'desc'],
			filter: 'done = false && due_date > \'9999-12-31T23:59:59Z\'',
			filter_include_nulls: true,
			filter_timezone: 'Europe/Moscow',
			s: '',
		})
	})
})

describe('taskCountsAsNoDue', () => {
	it('counts only open tasks without a due date', () => {
		expect(taskCountsAsNoDue({done: false, dueDate: null} as ITask)).toBe(true)
		expect(taskCountsAsNoDue({done: false, dueDate: new Date(0)} as ITask)).toBe(true)
		expect(taskCountsAsNoDue({done: true, dueDate: null} as ITask)).toBe(false)
		expect(taskCountsAsNoDue({done: false, dueDate: new Date('2026-08-21')} as ITask)).toBe(false)
	})
})
