import type {TaskFilterParams} from '@/services/taskCollection'
import type {ITask} from '@/modelTypes/ITask'

export function noDueTaskFilterParams(timezone = ''): TaskFilterParams {
	return {
		sort_by: ['priority', 'created', 'id'],
		order_by: ['desc', 'asc', 'desc'],
		filter: 'done = false && due_date > \'9999-12-31T23:59:59Z\'',
		filter_include_nulls: true,
		filter_timezone: timezone,
		s: '',
	}
}

export function taskCountsAsNoDue(task: ITask): boolean {
	return !task.done && (!task.dueDate || +task.dueDate <= 0)
}
