import {
	SECONDS_A_DAY,
	SECONDS_A_HOUR,
	SECONDS_A_MONTH,
	SECONDS_A_WEEK,
	SECONDS_A_YEAR,
} from '@/constants/date'
import { REPEAT_TYPES, type IRepeatAfter } from '@/types/IRepeatAfter'
import { nativeEnum, number, object, preprocess } from 'zod'

/**
 * Parses `repeatAfterSeconds` into a usable js object.
 * Year before month: 6×365d is divisible by 30d and must stay "years".
 */
export function parseRepeatAfter(repeatAfterSeconds: number): IRepeatAfter {
	let repeatAfter: IRepeatAfter = {type: 'hours', amount: repeatAfterSeconds / SECONDS_A_HOUR}

	if (repeatAfterSeconds % SECONDS_A_DAY === 0) {
		if (repeatAfterSeconds % SECONDS_A_YEAR === 0) {
			repeatAfter = {type: 'years', amount: repeatAfterSeconds / SECONDS_A_YEAR}
		} else if (repeatAfterSeconds % SECONDS_A_MONTH === 0) {
			repeatAfter = {type: 'months', amount: repeatAfterSeconds / SECONDS_A_MONTH}
		} else if (repeatAfterSeconds % SECONDS_A_WEEK === 0) {
			repeatAfter = {type: 'weeks', amount: repeatAfterSeconds / SECONDS_A_WEEK}
		} else {
			repeatAfter = {type: 'days', amount: repeatAfterSeconds / SECONDS_A_DAY}
		}
	}
	return repeatAfter
}

export const RepeatsSchema = preprocess(
	(repeats: unknown) => {
		// Parses the "repeat after x seconds" from the task into a usable js object inside the task.
	
		if (typeof repeats !== 'number') {
			return repeats
		}
	
		return parseRepeatAfter(repeats)
	},
	object({
		type: nativeEnum(REPEAT_TYPES),
		amount: number().int(),
	}),
)
