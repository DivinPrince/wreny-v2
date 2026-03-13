import "../../sst-env.d.ts";
import { Resource } from "sst";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, bearer, customSession } from "better-auth/plugins";
import { AddressService } from "../address";
import { db } from "../drizzle";
import { dash } from "@better-auth/infra";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
  isEmailConfigured,
} from "../email";
import { ac, adminRole, userRole } from "./permissions";
import {
  userTable,
  sessionTable,
  accountTable,
  verificationTable,
  jwksTable,
} from "../user/user.sql";
import { createID } from "../util/id";

const authOptions = {
  basePath: "/api/auth",
  trustedOrigins: [process.env.FRONTEND_URL || ""],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
      jwks: jwksTable,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: isEmailConfigured,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: isEmailConfigured,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    database: {
      generateId: (options: { model?: string } | undefined) => {
        const model = options?.model;
        if (model === "jwks") return createID("jwt");
        if (model && ["user", "session", "account", "verification"].includes(model)) {
          return createID(model as Parameters<typeof createID>[0]);
        }
        return createID("user");
      },
    },
    crossSubDomainCookies: {
      enabled: false,
    },
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      partitioned: process.env.NODE_ENV === "production",
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: "string" as const,
        required: false,
      },
    },
  },
  plugins: [
    bearer(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
      },
    }),
    openAPI({
      disableDefaultReference: true,
    }),
    dash(),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...authOptions,
  plugins: [
    ...(authOptions.plugins ?? []),
    customSession(async ({ user, session }) => {
      const addresses = await AddressService.listByUser(user.id);
      return {
        user: { ...user, addresses },
        session,
      };
    }, authOptions),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
export type SessionData = Session["session"];
