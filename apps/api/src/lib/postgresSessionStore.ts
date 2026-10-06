import session, { type SessionData } from "express-session";
import { pool } from "@workspace/db";
import { logger } from "./logger";
import { DEFAULT_ADMIN_SESSION_LIFETIME_MS } from "./sessionLifetime";

const EXPIRED_SESSION_PRUNE_INTERVAL_MS = 15 * 60 * 1000;

type SessionCallback = (error?: Error | null) => void;

export class PostgresSessionStore extends session.Store {
  private lastPrunedAt = 0;

  get(
    sid: string,
    callback: (error: unknown, session?: SessionData | null) => void,
  ): void {
    void pool
      .query<{ sess: SessionData | string }>(
        "SELECT sess FROM sessions WHERE sid = $1 AND expire > NOW()",
        [sid],
      )
      .then(({ rows }) => {
        const stored = rows[0]?.sess;
        if (typeof stored === "string") {
          callback(null, JSON.parse(stored) as SessionData);
          return;
        }
        callback(null, stored ?? null);
      })
      .catch((error: unknown) => callback(error));
  }

  set(sid: string, sessionData: SessionData, callback?: SessionCallback): void {
    const expiresAt = this.getExpiration(sessionData);
    void pool
      .query(
        `INSERT INTO sessions (sid, sess, expire)
         VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (sid)
         DO UPDATE SET sess = EXCLUDED.sess, expire = EXCLUDED.expire`,
        [sid, JSON.stringify(sessionData), expiresAt],
      )
      .then(() => {
        this.pruneExpiredSessions();
        callback?.();
      })
      .catch((error: unknown) => this.handleWriteError(error, callback));
  }

  touch(
    sid: string,
    sessionData: SessionData,
    callback?: SessionCallback,
  ): void {
    void pool
      .query("UPDATE sessions SET expire = $2 WHERE sid = $1", [
        sid,
        this.getExpiration(sessionData),
      ])
      .then(() => {
        this.pruneExpiredSessions();
        callback?.();
      })
      .catch((error: unknown) => this.handleWriteError(error, callback));
  }

  destroy(sid: string, callback?: SessionCallback): void {
    void pool
      .query("DELETE FROM sessions WHERE sid = $1", [sid])
      .then(() => callback?.())
      .catch((error: unknown) => this.handleWriteError(error, callback));
  }

  private getExpiration(sessionData: SessionData): Date {
    return (
      sessionData.cookie.expires ??
      new Date(
        Date.now() +
          (sessionData.cookie.maxAge ?? DEFAULT_ADMIN_SESSION_LIFETIME_MS),
      )
    );
  }

  private pruneExpiredSessions(): void {
    const now = Date.now();
    if (now - this.lastPrunedAt < EXPIRED_SESSION_PRUNE_INTERVAL_MS) return;
    this.lastPrunedAt = now;
    void pool
      .query("DELETE FROM sessions WHERE expire <= NOW()")
      .catch((error: unknown) => {
        logger.warn({ err: error }, "Could not prune expired admin sessions");
      });
  }

  private handleWriteError(error: unknown, callback?: SessionCallback): void {
    if (callback) {
      callback(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    logger.error({ err: error }, "Could not persist admin session");
  }
}
