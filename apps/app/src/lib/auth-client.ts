import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

const authBaseURL = import.meta.env.VITE_API_URL;

function getCallbackURL(callbackPath = "/") {
  if (typeof window === "undefined") {
    return callbackPath;
  }

  return new URL(callbackPath, window.location.origin).toString();
}

export const client = createAuthClient({
  baseURL: authBaseURL,
  plugins: [emailOTPClient()],
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = client;

// Email and password authentication
export const signInWithEmail = async (email: string, password: string, callbackURL = "/") => {
  return await client.signIn.email({
    email,
    password,
    callbackURL: getCallbackURL(callbackURL),
  });
};

export const signUpWithEmail = async (email: string, password: string, name?: string, callbackURL = "/") => {
  return await client.signUp.email({
    email,
    password,
    name: name || "You",
    callbackURL: getCallbackURL(callbackURL),
  });
};

// Email verification
export const sendVerificationEmail = async (email: string, callbackURL = "/") => {
  return await client.sendVerificationEmail({
    email,
    callbackURL: getCallbackURL(callbackURL),
  });
};

// Email OTP functions
export const sendOTP = async (email: string, type: "sign-in" | "email-verification" | "forget-password" = "sign-in") => {
  return await client.emailOtp.sendVerificationOtp({
    email,
    type,
  });
};

export const verifyOTP = async (email: string, otp: string) => {
  return await client.signIn.emailOtp({
    email,
    otp,
  });
};

export const verifyEmailWithOTP = async (email: string, otp: string) => {
  return await client.emailOtp.verifyEmail({
    email,
    otp,
  });
};

// Social authentication
export const signInWithGoogle = async (callbackURL = "/") => {
  return await client.signIn.social({
    provider: "google",
    callbackURL: getCallbackURL(callbackURL),
  });
};

export const signInWithFacebook = async (callbackURL = "/") => {
  return await client.signIn.social({
    provider: "facebook",
    callbackURL: getCallbackURL(callbackURL),
  });
};

export const signInWithLinkedIn = async (callbackURL = "/") => {
  return await client.signIn.social({
    provider: "linkedin",
    callbackURL: getCallbackURL(callbackURL),
  });
};