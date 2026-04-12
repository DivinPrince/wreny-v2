import {
  getBetterAuthCallErrorMessage,
  getThrownAuthErrorMessage,
  signInWithGoogle,
  signInWithLinkedIn,
  signUpWithEmail,
  verifyOTP,
} from "#/lib/auth-client";
import { Button } from "#/components/ui/button";
import { Icons } from "#/components/ui/icons";
import { Input } from "#/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "#/components/ui/input-otp";
import { Label } from "#/components/ui/label";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Get plan details if a plan slug is provided
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUpWithEmail(email, password, name);
      const errMsg = getBetterAuthCallErrorMessage(result);
      if (errMsg) {
        setError(errMsg);
        return;
      }
      setOtpSent(true);
    } catch (error: unknown) {
      console.error("Sign up error:", error);
      setError(getThrownAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyOTP(email, otp);
      const errMsg = getBetterAuthCallErrorMessage(result);
      if (errMsg) {
        setError(errMsg);
        return;
      }
      window.location.href = "/";
    } catch (error: unknown) {
      console.error("OTP verification error:", error);
      setError(getThrownAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithGoogle();
      const errMsg = getBetterAuthCallErrorMessage(result);
      if (errMsg) {
        setError(errMsg);
      }
    } catch (error: unknown) {
      console.error("Google sign in error:", error);
      setError(getThrownAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signInWithLinkedIn();
      const errMsg = getBetterAuthCallErrorMessage(result);
      if (errMsg) {
        setError(errMsg);
      }
    } catch (error: unknown) {
      console.error("LinkedIn sign in error:", error);
      setError(getThrownAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-linear-to-b from-muted to-background flex min-h-screen px-4 py-16 md:py-32">
      <div className="m-auto h-fit w-[460px]">
        <div className="p-6">
          <div>
            <Link to="/dashboard" aria-label="go home">
              <Icons.Logo />
            </Link>
            <h1 className="mt-6 text-balance text-xl font-semibold">
                <span className="text-muted-foreground">Welcome to Wreny!</span>{" "}
              Create an Account to Get Started
            </h1>
          </div>

          {otpSent ? (
            <form onSubmit={handleVerifyOTP}>
              <div className="mt-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                Verification code sent! Please check your email and enter the
                code below to verify your account.
              </div>

              {error && (
                <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="block text-sm">
                    Verification Code
                  </Label>
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  className="w-full"
                  size="default"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleEmailSubmit}>
              {error && (
                <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="mt-6 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="w-full space-x-4 h-10"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4"
                    viewBox="0 0 256 262"
                  >
                    <path
                      fill="#4285f4"
                      d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                    ></path>
                    <path
                      fill="#34a853"
                      d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                    ></path>
                    <path
                      fill="#fbbc05"
                      d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                    ></path>
                    <path
                      fill="#eb4335"
                      d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                    ></path>
                  </svg>
                  <span>Continue with Google</span>
                </Button>
                {/* <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="w-full space-x-4 h-10"
                  onClick={handleFacebookSignIn}
                  disabled={isLoading}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4"
                    viewBox="0 0 256 256">
                    <path
                      fill="#1877f2"
                      d="M256 128C256 57.308 198.692 0 128 0S0 57.308 0 128c0 63.888 46.808 116.843 108 126.445V165H75.5v-37H108V99.8c0-32.08 19.11-49.8 48.348-49.8C170.352 50 185 52.5 185 52.5V84h-16.14C152.959 84 148 93.867 148 103.99V128h35.5l-5.675 37H148v89.445c61.192-9.602 108-62.556 108-126.445"></path>
                    <path
                      fill="#fff"
                      d="m177.825 165l5.675-37H148v-24.01C148 93.866 152.959 84 168.86 84H185V52.5S170.352 50 156.347 50C127.11 50 108 67.72 108 99.8V128H75.5v37H108v89.445A129 129 0 0 0 128 256a129 129 0 0 0 20-1.555V165z"></path>
                  </svg>
                  <span>Continue with Facebook</span>
                </Button> */}
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  className="w-full space-x-4 h-10"
                  onClick={handleLinkedInSignIn}
                  disabled={isLoading}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="size-4"
                    viewBox="0 0 256 256"
                  >
                    <path
                      fill="#0A66C2"
                      d="M218.123 218.127h-37.931v-59.403c0-14.165-.253-32.4-19.728-32.4-19.756 0-22.779 15.434-22.779 31.369v60.43h-37.93V95.967h36.413v16.694h.51a39.907 39.907 0 0 1 35.928-19.733c38.445 0 45.533 25.288 45.533 58.186l-.016 67.013ZM56.955 79.27c-12.157.002-22.014-9.852-22.016-22.009-.002-12.157 9.851-22.014 22.008-22.016 12.157-.002 22.014 9.851 22.016 22.008A22.013 22.013 0 0 1 56.955 79.27m18.966 138.858H37.95V95.967h37.97v122.16ZM237.033.018H18.89C8.58-.098.125 8.161-.001 18.471v219.053c.122 10.315 8.576 18.582 18.89 18.474h218.144c10.336.128 18.823-8.139 18.966-18.474V18.454c-.147-10.33-8.635-18.588-18.966-18.453"
                    ></path>
                  </svg>
                  <span>Continue with LinkedIn</span>
                </Button>
              </div>

              <div className="my-6 flex items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="px-4 text-sm text-muted-foreground">Or</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="block text-sm">
                    Email
                  </Label>
                  <Input
                    type="email"
                    required
                    name="email"
                    id="email"
                    placeholder="Your email"
                    className="ring-foreground/15 border-transparent ring-1 h-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="block text-sm">
                    Name
                  </Label>
                  <Input
                    type="text"
                    required
                    name="name"
                    id="name"
                    placeholder="Your name"
                    className="ring-foreground/15 border-transparent ring-1 h-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="block text-sm">
                    Password
                  </Label>
                  <Input
                    type="password"
                    required
                    name="password"
                    id="password"
                    placeholder="Your password"
                    className="ring-foreground/15 border-transparent ring-1 h-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  className="w-full"
                  size="default"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Sign Up"}
                </Button>
              </div>
            </form>
          )}
        </div>
        <div className="px-6">
          <p className="text-muted-foreground text-sm">
            Already have an account ?
            <Button asChild variant="link" className="px-2">
              <Link to="/signin" aria-label="go to sign in">Sign In</Link>
            </Button>
          </p>
        </div>
      </div>
    </section>
  );
}
