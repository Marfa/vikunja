/**
 * Parse a task title that is a single markdown link: [label](https://…).
 * Bare text and titles with extra content are returned unchanged (href null).
 */
export function parseTaskTitleMarkdownLink(title: string): {label: string, href: string | null} {
	const trimmed = title.trim()
	const match = /^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/.exec(trimmed)
	if (!match) {
		return {label: title, href: null}
	}
	return {label: match[1], href: match[2]}
}
