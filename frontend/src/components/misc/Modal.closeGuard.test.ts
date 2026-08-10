import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest'
import {mount, flushPromises} from '@vue/test-utils'
import {defineComponent, h, nextTick} from 'vue'
import {createI18n} from 'vue-i18n'

vi.mock('@/components/misc/Icon', () => ({
	default: {name: 'Icon', props: ['icon'], template: '<span />'},
}))

// happy-dom's HTMLDialogElement may lack showModal; stub the imperative API.
beforeEach(() => {
	if (typeof HTMLDialogElement !== 'undefined') {
		HTMLDialogElement.prototype.showModal ??= function(this: HTMLDialogElement) {
			this.setAttribute('open', '')
		}
		HTMLDialogElement.prototype.show ??= function(this: HTMLDialogElement) {
			this.setAttribute('open', '')
		}
		HTMLDialogElement.prototype.close ??= function(this: HTMLDialogElement) {
			this.removeAttribute('open')
		}
	}
})

describe('Modal close guard', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	async function mountModal() {
		const Modal = (await import('./Modal.vue')).default
		const i18n = createI18n({
			legacy: false,
			locale: 'en',
			messages: {en: {misc: {closeDialog: 'Close', cancel: 'Cancel', doit: 'Do it'}}},
		})

		const Host = defineComponent({
			setup(_, {emit}) {
				return () => h(Modal, {
					enabled: true,
					onClose: () => emit('close'),
				}, {
					default: () => h('div', {class: 'body'}, 'content'),
				})
			},
		})

		const wrapper = mount(Host, {
			global: {
				plugins: [i18n],
				stubs: {teleport: true},
			},
		})
		await flushPromises()
		await nextTick()
		return wrapper
	}

	it('ignores backdrop close during the open guard window', async () => {
		vi.useFakeTimers()
		const wrapper = await mountModal()

		const backdrop = wrapper.find('.modal-container')
		await backdrop.trigger('mousedown')
		expect(wrapper.emitted('close')).toBeFalsy()

		vi.advanceTimersByTime(450)
		await backdrop.trigger('mousedown')
		expect(wrapper.emitted('close')).toBeTruthy()
	})

	it('still closes via the close button during the open guard window', async () => {
		vi.useFakeTimers()
		const wrapper = await mountModal()

		await wrapper.find('.close').trigger('click')
		expect(wrapper.emitted('close')).toBeTruthy()
	})
})
