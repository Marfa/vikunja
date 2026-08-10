import type {IProject} from '@/modelTypes/IProject'

/**
 * Project context to restore when leaving the task editor.
 * Modal/side-panel: never follow task.projectId after a move.
 */
export function resolveLeaveProjectContext(opts: {
	backdropView?: string | null
	originProject: IProject | null
	lastProject: IProject | null
	taskProject: IProject | null | undefined
}): IProject | null {
	if (opts.backdropView) {
		return opts.originProject ?? opts.lastProject
	}
	return opts.lastProject ?? opts.taskProject ?? null
}
