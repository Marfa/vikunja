/**
 * Todoist date-only dues are often stored as UTC end-of-day (23:59Z) or UTC midnight.
 * In UTC+ zones those land on the next local morning — remap to the intended calendar
 * day's local end-of-day so grouping/display match Todoist.
 */
export function resolveDateOnlyDue(date: Date | string): Date {
	const d = date instanceof Date ? date : new Date(date)
	if (isNaN(+d)) {
		return d
	}

	const utcH = d.getUTCHours()
	const utcM = d.getUTCMinutes()
	const utcS = d.getUTCSeconds()

	// Vikunja Todoist migrator: YYYY-MM-DDT23:59:00Z
	if (utcH === 23 && utcM === 59) {
		return localEndOfUtcDay(d)
	}

	// UTC midnight shown as early morning east of UTC (e.g. 03:00 MSK).
	// getTimezoneOffset() is negative for UTC+.
	if (
		utcH === 0 &&
		utcM === 0 &&
		utcS === 0 &&
		d.getUTCMilliseconds() === 0 &&
		d.getTimezoneOffset() < 0 &&
		d.getHours() < 6
	) {
		const prev = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - 1, 23, 59, 0, 0))
		return new Date(prev.getUTCFullYear(), prev.getUTCMonth(), prev.getUTCDate(), 23, 59, 0, 0)
	}

	return d
}

function localEndOfUtcDay(d: Date): Date {
	return new Date(
		d.getUTCFullYear(),
		d.getUTCMonth(),
		d.getUTCDate(),
		23,
		59,
		0,
		0,
	)
}
