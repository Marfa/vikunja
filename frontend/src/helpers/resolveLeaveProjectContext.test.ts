import {describe, expect, it} from 'vitest'

import {resolveLeaveProjectContext} from './resolveLeaveProjectContext'
import type {IProject} from '@/modelTypes/IProject'

function project(id: number): IProject {
	return {id} as IProject
}

describe('resolveLeaveProjectContext', () => {
	it('keeps origin project when modal backdrop is set after a move', () => {
		const result = resolveLeaveProjectContext({
			backdropView: '/projects/1/10',
			originProject: project(1),
			lastProject: null,
			taskProject: project(2),
		})
		expect(result?.id).toBe(1)
	})

	it('falls back to history last project in modal mode when origin missing', () => {
		const result = resolveLeaveProjectContext({
			backdropView: '/projects/1/10',
			originProject: null,
			lastProject: project(1),
			taskProject: project(2),
		})
		expect(result?.id).toBe(1)
	})

	it('never uses task project while modal backdrop is present', () => {
		const result = resolveLeaveProjectContext({
			backdropView: '/projects/1/10',
			originProject: null,
			lastProject: null,
			taskProject: project(2),
		})
		expect(result).toBeNull()
	})

	it('uses task project on full-page detail without backdrop', () => {
		const result = resolveLeaveProjectContext({
			backdropView: null,
			originProject: null,
			lastProject: null,
			taskProject: project(2),
		})
		expect(result?.id).toBe(2)
	})
})
