const STORAGE_KEY = 'wreny.dashboard.onboarding.v1'

export type DashboardOnboardingState = {
  visitedAgent?: boolean
}

export function readDashboardOnboarding(): DashboardOnboardingState {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as DashboardOnboardingState
  } catch {
    return {}
  }
}

export function markDashboardAgentVisited(): void {
  if (typeof window === 'undefined') return
  try {
    const prev = readDashboardOnboarding()
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prev, visitedAgent: true } satisfies DashboardOnboardingState)
    )
    window.dispatchEvent(new Event('wreny-dashboard-onboarding'))
  } catch {
    // ignore quota / private mode
  }
}
