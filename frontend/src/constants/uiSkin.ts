export const UI_SKIN = {
	DEFAULT: 'default',
	TODOIST: 'todoist',
} as const

export type UiSkin = typeof UI_SKIN[keyof typeof UI_SKIN]

export const UI_SKIN_VALUES = Object.values(UI_SKIN)
