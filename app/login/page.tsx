"use client";

import React, { useActionState, use, useState, useTransition } from "react";
import Link from "next/link";
import { loginAction, requestOtpAction, verifyOtpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertTriangleIcon, CheckCircleIcon, KeyIcon, LockIcon } from "@/components/ui/icons";
import type { AuthFormState } from "@/lib/validation";

const initialState: AuthFormState = {};

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = use(searchParams);
  const [authMode, setAuthMode] = useState<"password" | "otp">("password");
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const errors = state?.errors ?? {};

  // OTP State
  const [otpIdentifier, setOtpIdentifier] = useState("demo@stocksense.app");
  const [otpCode, setOtpCode] = useState("");
  const [otpRole, setOtpRole] = useState<"inventory_manager" | "warehouse_staff">("inventory_manager");
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isOtpPending, startOtpTransition] = useTransition();

  const isResetSuccess = resolvedParams.reset === "success";

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpIdentifier) {
      setOtpError("Please enter your login ID or email address.");
      return;
    }
    setOtpError(null);
    setOtpMessage(null);

    startOtpTransition(async () => {
      const res = await requestOtpAction(otpIdentifier);
      if (res.success) {
        setOtpSent(true);
        if (res.code) {
          setGeneratedOtp(res.code);
        }
        setOtpMessage(res.message);
      } else {
        setOtpError("Failed to send OTP. Please try again.");
      }
    });
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP code.");
      return;
    }
    setOtpError(null);

    startOtpTransition(async () => {
      const res = await verifyOtpAction(otpIdentifier, otpCode, otpRole);
      if (!res.success) {
        setOtpError(res.message);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col justify-center items-center bg-zinc-950 px-4 py-12">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xl tracking-tighter shadow-lg">
            SS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Sign in to StockSense
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Industrial Stock Computation Engine v2.0
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => setAuthMode("password")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition ${
              authMode === "password"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <LockIcon className="h-3.5 w-3.5" />
            <span>Password Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => setAuthMode("otp")}
            className={`flex items-center justify-center gap-2 py-2 rounded-lg font-bold transition ${
              authMode === "otp"
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <KeyIcon className="h-3.5 w-3.5" />
            <span>OTP Code Sign In</span>
          </button>
        </div>

        {/* Reset Success Toast */}
        {isResetSuccess && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Password updated successfully! Please log in with your new password.</span>
          </div>
        )}

        {/* Card Content */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-sm">
          {authMode === "password" ? (
            /* Password Login Form */
            <form action={formAction} className="space-y-4">
              {errors.form && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              <Field label="Login ID or Email" htmlFor="identifier" error={errors.identifier}>
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  placeholder="demo_user or demo@stocksense.app"
                  defaultValue="demo_user"
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              <Field label="Password" htmlFor="password" error={errors.password}>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  defaultValue="Demo@123"
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-zinc-500">Default password: <code className="text-amber-400">Demo@123</code></span>
                <Link
                  href="/forgot-password"
                  className="text-amber-400 hover:text-amber-300 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                disabled={isPending}
                className="w-full h-10 text-sm font-semibold tracking-wide"
              >
                {isPending ? "Authenticating..." : "Sign In with Password"}
              </Button>
            </form>
          ) : (
            /* OTP Code Login Form */
            <div className="space-y-4">
              {otpError && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              {otpMessage && (
                <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{otpMessage}</span>
                </div>
              )}

              {/* Demo Mode Live OTP Helper Banner */}
              {generatedOtp && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 font-mono space-y-2">
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                      SIMULATED DEMO OTP:
                    </span>
                    <span className="text-[10px] uppercase bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">Active</span>
                  </div>
                  <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded border border-zinc-800">
                    <code className="text-xl font-bold tracking-widest text-amber-400">{generatedOtp}</code>
                    <button
                      type="button"
                      onClick={() => setOtpCode(generatedOtp)}
                      className="px-2.5 py-1 bg-amber-500 text-zinc-950 text-[11px] font-bold rounded hover:bg-amber-400 transition"
                    >
                      Auto-fill OTP
                    </button>
                  </div>
                </div>
              )}

              {/* Role Selection Option */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 font-mono">
                  Select User Role for Login:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <button
                    type="button"
                    onClick={() => setOtpRole("inventory_manager")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      otpRole === "inventory_manager"
                        ? "bg-amber-500/10 border-amber-500 text-amber-300 font-bold"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-bold text-white">🛡️ Inventory Manager</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Manage Receipts & Deliveries</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOtpRole("warehouse_staff")}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      otpRole === "warehouse_staff"
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-300 font-bold"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    <div className="font-bold text-white">📦 Warehouse Staff</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Perform Transfers & Counting</div>
                  </button>
                </div>
              </div>

              {!otpSent ? (
                /* Step 1: Request OTP Form */
                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <Field label="Email or Login ID" htmlFor="otpIdentifier">
                    <Input
                      id="otpIdentifier"
                      type="text"
                      placeholder="demo@stocksense.app or demo_user"
                      value={otpIdentifier}
                      onChange={(e) => setOtpIdentifier(e.target.value)}
                      required
                      className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                    />
                  </Field>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isOtpPending}
                    className="w-full h-10 text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                  >
                    <KeyIcon className="h-4 w-4" />
                    <span>{isOtpPending ? "Sending OTP..." : "Send 6-Digit OTP Code"}</span>
                  </Button>
                </form>
              ) : (
                /* Step 2: Verify OTP Form */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Field label="Enter 6-Digit Verification Code" htmlFor="otpCode">
                    <Input
                      id="otpCode"
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                      className="bg-zinc-950 border-zinc-700 focus:border-amber-500 text-center text-lg font-mono tracking-widest"
                    />
                  </Field>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setGeneratedOtp(null);
                        setOtpCode("");
                      }}
                      className="text-zinc-400 hover:text-white underline"
                    >
                      Change email / Resend OTP
                    </button>
                    <span className="text-zinc-500">Valid for 10 minutes</span>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isOtpPending}
                    className="w-full h-10 text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    <span>{isOtpPending ? "Verifying..." : "Verify OTP & Sign In"}</span>
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer Signup Prompt */}
        <div className="text-center font-mono text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-amber-400 hover:text-amber-300 font-bold hover:underline">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}
