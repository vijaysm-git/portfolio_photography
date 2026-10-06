export const DEFAULT_ADMIN_SESSION_DURATION_HOURS = 12;

export function sessionLifetimeMs(hours: number): number {
  return hours * 60 * 60 * 1000;
}

export const DEFAULT_ADMIN_SESSION_LIFETIME_MS = sessionLifetimeMs(
  DEFAULT_ADMIN_SESSION_DURATION_HOURS,
);
