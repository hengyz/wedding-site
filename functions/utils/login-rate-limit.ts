const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

export async function isLoginRateLimited(
  db: D1Database,
  ip: string
): Promise<boolean> {
  const row = await db.prepare(
    `SELECT COUNT(*) as c FROM login_attempts
     WHERE ip = ? AND success = 0
       AND created_at > datetime('now', '-${WINDOW_MINUTES} minutes')`
  )
    .bind(ip)
    .first<{ c: number }>();

  return (row?.c ?? 0) >= MAX_ATTEMPTS;
}

export async function recordLoginAttempt(
  db: D1Database,
  ip: string,
  success: boolean
): Promise<void> {
  await db.prepare(
    'INSERT INTO login_attempts (ip, success) VALUES (?, ?)'
  )
    .bind(ip, success ? 1 : 0)
    .run();
}
