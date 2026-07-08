import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from "next-auth/adapters";
import type { AdapterAccount } from "next-auth/adapters";
import { sql } from "./client";

export function NeonAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      const rows = await sql`
        INSERT INTO users (name, email, email_verified, image)
        VALUES (${user.name}, ${user.email}, ${user.emailVerified}, ${user.image})
        RETURNING *
      `;
      return toAdapterUser(rows[0]);
    },

    async getUser(id) {
      const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
      return rows[0] ? toAdapterUser(rows[0]) : null;
    },

    async getUserByEmail(email) {
      const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
      return rows[0] ? toAdapterUser(rows[0]) : null;
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const rows = await sql`
        SELECT u.* FROM users u
        JOIN accounts a ON a.user_id = u.id
        WHERE a.provider = ${provider} AND a.provider_account_id = ${providerAccountId}
      `;
      return rows[0] ? toAdapterUser(rows[0]) : null;
    },

    async updateUser(user) {
      const rows = await sql`
        UPDATE users SET
          name           = COALESCE(${user.name}, name),
          email          = COALESCE(${user.email}, email),
          email_verified = COALESCE(${user.emailVerified}, email_verified),
          image          = COALESCE(${user.image}, image),
          updated_at     = NOW()
        WHERE id = ${user.id}
        RETURNING *
      `;
      return toAdapterUser(rows[0]);
    },

    async deleteUser(userId) {
      await sql`DELETE FROM users WHERE id = ${userId}`;
    },

    async linkAccount(account: AdapterAccount) {
      await sql`
        INSERT INTO accounts (
          user_id, type, provider, provider_account_id,
          refresh_token, access_token, expires_at,
          token_type, scope, id_token, session_state
        ) VALUES (
          ${account.userId}, ${account.type}, ${account.provider},
          ${account.providerAccountId}, ${account.refresh_token ?? null},
          ${account.access_token ?? null}, ${account.expires_at ?? null},
          ${account.token_type ?? null}, ${account.scope ?? null},
          ${account.id_token ?? null}, ${account.session_state ?? null}
        )
      `;
    },

    async unlinkAccount({ provider, providerAccountId }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      await sql`
        DELETE FROM accounts
        WHERE provider = ${provider} AND provider_account_id = ${providerAccountId}
      `;
    },

    async createSession(session) {
      const rows = await sql`
        INSERT INTO sessions (session_token, user_id, expires)
        VALUES (${session.sessionToken}, ${session.userId}, ${session.expires})
        RETURNING *
      `;
      return toAdapterSession(rows[0]);
    },

    async getSessionAndUser(sessionToken) {
      const rows = await sql`
        SELECT s.*, u.id as u_id, u.name as u_name, u.email as u_email,
               u.email_verified as u_email_verified, u.image as u_image, u.role as u_role
        FROM sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.session_token = ${sessionToken} AND s.expires > NOW()
      `;
      if (!rows[0]) return null;
      const r = rows[0];
      return {
        session: toAdapterSession(r),
        user: {
          id: r.u_id,
          name: r.u_name,
          email: r.u_email,
          emailVerified: r.u_email_verified,
          image: r.u_image,
          role: r.u_role,
        } as AdapterUser & { role: string },
      };
    },

    async updateSession(session) {
      const rows = await sql`
        UPDATE sessions SET expires = ${session.expires}
        WHERE session_token = ${session.sessionToken}
        RETURNING *
      `;
      return rows[0] ? toAdapterSession(rows[0]) : null;
    },

    async deleteSession(sessionToken) {
      await sql`DELETE FROM sessions WHERE session_token = ${sessionToken}`;
    },

    async createVerificationToken(token) {
      const rows = await sql`
        INSERT INTO verification_tokens (identifier, token, expires)
        VALUES (${token.identifier}, ${token.token}, ${token.expires})
        RETURNING *
      `;
      return toVerificationToken(rows[0]);
    },

    async useVerificationToken({ identifier, token }) {
      const rows = await sql`
        DELETE FROM verification_tokens
        WHERE identifier = ${identifier} AND token = ${token}
        RETURNING *
      `;
      return rows[0] ? toVerificationToken(rows[0]) : null;
    },
  };
}

// --- Mappers ---
function toAdapterUser(r: Record<string, unknown>): AdapterUser {
  return {
    id: r.id as string,
    name: r.name as string | null,
    email: r.email as string,
    emailVerified: r.email_verified as Date | null,
    image: r.image as string | null,
    role: r.role as string,
  } as AdapterUser & { role: string };
}

function toAdapterSession(r: Record<string, unknown>): AdapterSession {
  return {
    sessionToken: r.session_token as string,
    userId: r.user_id as string,
    expires: r.expires as Date,
  };
}

function toVerificationToken(r: Record<string, unknown>): VerificationToken {
  return {
    identifier: r.identifier as string,
    token: r.token as string,
    expires: r.expires as Date,
  };
}
