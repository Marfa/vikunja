import type {TaskFilterParams} from '@/services/taskCollection'
import type {ITask} from '@/modelTypes/ITask'

const unsetDateFilter = 'due_date > \'9999-12-31T23:59:59Z\' && start_date > \'9999-12-31T23:59:59Z\''

export function noDueTaskFilterParams(timezone = ''): TaskFilterParams {
	return {
		sort_by: ['priority', 'created', 'id'],
		order_by: ['desc', 'asc', 'desc'],
		// filter_include_nulls makes "> far future" match unset dates; set start_date excludes the task.
		filter: `done = false && ${unsetDateFilter}`,
		filter_include_nulls: true,
		filter_timezone: timezone,
		s: '',
	}
}

function hasDate(value: Date | null | undefined): boolean {
	return Boolean(value && +value > 0)
}

export function taskCountsAsNoDue(task: ITask): boolean {
	return !task.done && !hasDate(task.dueDate) && !hasDate(task.startDate)
}
