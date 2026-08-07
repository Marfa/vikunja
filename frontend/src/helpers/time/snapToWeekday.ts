/**
 * Move Sat/Sun forward to Monday so weekday-repeat tasks don't land in weekend groups.
 */
export function snapToWeekday(date: Date | null | undefined): Date | null {
	if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) {
		return date ?? null
	}

	const day = date.getDay() // 0=Sun … 6=Sat
	if (day !== 0 && day !== 6) {
		return date
	}

	const next = new Date(date.getTime())
	next.setDate(next.getDate() + (day === 6 ? 2 : 1))
	return next
}
