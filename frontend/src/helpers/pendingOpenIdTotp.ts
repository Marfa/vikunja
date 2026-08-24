const keyPrefix = 'openid_pending_totp_'

export function pendingTotpKey(provider: string): string {
	return keyPrefix + provider
}

export function stashPendingTotp(provider: string, passcode: string): void {
	sessionStorage.setItem(pendingTotpKey(provider), passcode)
}

export function takePendingTotp(provider: string): string | undefined {
	const key = pendingTotpKey(provider)
	const value = sessionStorage.getItem(key) ?? undefined
	sessionStorage.removeItem(key)
	return value
}

export function clearPendingTotp(provider: string): void {
	sessionStorage.removeItem(pendingTotpKey(provider))
}
