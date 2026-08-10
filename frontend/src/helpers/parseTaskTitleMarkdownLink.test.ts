import {describe, it, expect} from 'vitest'
import {parseTaskTitleMarkdownLink} from './parseTaskTitleMarkdownLink'

describe('parseTaskTitleMarkdownLink', () => {
	it('parses a single markdown link title', () => {
		expect(parseTaskTitleMarkdownLink('[RetroPie](https://retropie.org.uk/)'))
			.toEqual({label: 'RetroPie', href: 'https://retropie.org.uk/'})
	})

	it('keeps plain titles unchanged', () => {
		expect(parseTaskTitleMarkdownLink('Buy milk'))
			.toEqual({label: 'Buy milk', href: null})
	})

	it('does not parse partial or nested markdown', () => {
		expect(parseTaskTitleMarkdownLink('see [x](https://a.com) and more').href).toBeNull()
		expect(parseTaskTitleMarkdownLink('[x](ftp://a.com)').href).toBeNull()
	})
})
