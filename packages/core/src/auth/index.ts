import "../../sst-env.d.ts";
import { betterAuth, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, openAPI, bearer, customSession, emailOTP } from "better-auth/plugins";
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

const socialProviders = {
  ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : {}),
  ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET
    ? {
        linkedin: {
          clientId: process.env.LINKEDIN_CLIENT_ID,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
        },
      }
    : {}),
} satisfies NonNullable<BetterAuthOptions["socialProviders"]>;

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
  socialProviders,
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
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const subject = type === "sign-in" ? "Sign In OTP" :
          type === "email-verification" ? "Verify Your Email" :
            "Reset Your Password";

        console.log(email, otp, type, subject);
      },
      otpLength: 6,
      expiresIn: 600, // 10 minutes
      sendVerificationOnSignUp: true
    }),
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
    customSession(async ({ user, session }) => ({ user, session }), authOptions),
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
export type User = Session["user"];
export type SessionData = Session["session"];
