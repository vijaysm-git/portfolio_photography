import "express-session";

declare module "express-session" {
  interface SessionData {
    isAdmin?: boolean;
    adminAccountId?: string;
    adminEmail?: string;
  }
}
