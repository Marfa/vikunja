import {describe, it, expect} from 'vitest'
import {snapToWeekday} from './snapToWeekday'

describe('snapToWeekday', () => {
	it('moves saturday to monday', () => {
		const sat = new Date(2026, 7, 8, 23, 59) // Aug 8 2026 local
		expect(sat.getDay()).toBe(6)
		const next = snapToWeekday(sat)!
		expect(next.getDay()).toBe(1)
		expect(next.getDate()).toBe(10)
	})

	it('moves sunday to monday', () => {
		const sun = new Date(2026, 7, 9, 12, 0)
		expect(sun.getDay()).toBe(0)
		expect(snapToWeekday(sun)!.getDay()).toBe(1)
	})

	it('leaves friday alone', () => {
		const fri = new Date(2026, 7, 7, 12, 0)
		expect(snapToWeekday(fri)).toEqual(fri)
	})
})
