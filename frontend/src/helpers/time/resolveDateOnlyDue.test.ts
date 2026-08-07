import {describe, it, expect, vi, afterEach} from 'vitest'
import {resolveDateOnlyDue} from './resolveDateOnlyDue'

describe('resolveDateOnlyDue', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('remaps Todoist UTC end-of-day to local calendar day', () => {
		// 2026-08-03T23:59:00Z — date-only "Aug 3" from Todoist migration
		const stored = new Date(Date.UTC(2026, 7, 3, 23, 59, 0, 0))
		const resolved = resolveDateOnlyDue(stored)

		expect(resolved.getFullYear()).toBe(2026)
		expect(resolved.getMonth()).toBe(7)
		expect(resolved.getDate()).toBe(3)
		expect(resolved.getHours()).toBe(23)
		expect(resolved.getMinutes()).toBe(59)
	})

	it('remaps UTC midnight early-morning shift east of UTC', () => {
		const stored = new Date(Date.UTC(2026, 7, 4, 0, 0, 0, 0))
		vi.spyOn(stored, 'getTimezoneOffset').mockReturnValue(-180)
		vi.spyOn(stored, 'getHours').mockReturnValue(3)

		const resolved = resolveDateOnlyDue(stored)

		expect(resolved.getFullYear()).toBe(2026)
		expect(resolved.getMonth()).toBe(7)
		expect(resolved.getDate()).toBe(3)
		expect(resolved.getHours()).toBe(23)
		expect(resolved.getMinutes()).toBe(59)
	})

	it('leaves real datetimes unchanged', () => {
		const due = new Date(2026, 7, 3, 15, 0, 0, 0)
		expect(resolveDateOnlyDue(due)).toBe(due)
	})

	it('leaves non-59-minute UTC evening times unchanged', () => {
		const due = new Date(Date.UTC(2026, 7, 3, 23, 0, 0, 0))
		expect(resolveDateOnlyDue(due)).toBe(due)
	})
})
