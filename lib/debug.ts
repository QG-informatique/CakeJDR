export const DEBUG = process.env.NEXT_PUBLIC_DEBUG === '1'

export function debug(...args: unknown[]) {
  if (DEBUG) {
    console.log('[debug]', ...args)
  }
}
