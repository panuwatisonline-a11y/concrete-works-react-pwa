/** OAuth / magic-link callback still in the URL — avoid full-page reload until session is stored. */
export function isAuthCallbackUrl(): boolean {
  if (typeof window === 'undefined') return false
  const { hash, search } = window.location
  if (
    hash.includes('access_token=') ||
    hash.includes('refresh_token=') ||
    hash.includes('error=') ||
    hash.includes('error_description=')
  ) {
    return true
  }
  return search.includes('code=')
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
