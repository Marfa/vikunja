import {describe, expect, it} from 'vitest'

import {SECONDS_A_DAY, SECONDS_A_MONTH, SECONDS_A_YEAR} from '@/constants/date'

import {periodToSeconds, secondsToPeriod} from './period'

describe('secondsToPeriod', () => {
	it('parses one year as years not months', () => {
		expect(secondsToPeriod(SECONDS_A_YEAR)).toEqual({unit: 'years', amount: 1})
	})

	it('parses six years as years even though divisible by 30 days', () => {
		expect(secondsToPeriod(6 * SECONDS_A_YEAR)).toEqual({unit: 'years', amount: 6})
		expect((6 * 365) % 30).toBe(0)
	})

	it('parses one month as months', () => {
		expect(secondsToPeriod(SECONDS_A_MONTH)).toEqual({unit: 'months', amount: 1})
	})
})

describe('periodToSeconds', () => {
	it('round-trips years', () => {
		expect(periodToSeconds(1, 'years')).toBe(365 * SECONDS_A_DAY)
		expect(secondsToPeriod(periodToSeconds(1, 'years')).unit).toBe('years')
	})

	it('round-trips months', () => {
		expect(periodToSeconds(1, 'months')).toBe(30 * SECONDS_A_DAY)
		expect(secondsToPeriod(periodToSeconds(2, 'months'))).toEqual({unit: 'months', amount: 2})
	})
})
