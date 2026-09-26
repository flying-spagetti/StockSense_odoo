"use client";

import React, { useActionState, useState } from "react";
import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertTriangleIcon, CheckCircleIcon, ArrowRightIcon } from "@/components/ui/icons";
import type { AuthFormState } from "@/lib/validation";

const initialState: AuthFormState = {};

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [emailValue, setEmailValue] = useState("");
  const [state, formAction, isPending] = useActionState(forgotPasswordAction, initialState);
  const errors = state?.errors ?? {};

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValue.trim()) return;
    setStep(2);
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
            Reset Your Password
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            {step === 1
              ? "Step 1: Enter your registered email address"
              : "Step 2 & 3: Enter Demo OTP and set new password"}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-sm">
          {step === 1 ? (
            /* STEP 1: Enter Email */
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <Field
                label="Registered Email ID"
                htmlFor="emailStep1"
                hint="Enter the email associated with your StockSense account"
              >
                <Input
                  id="emailStep1"
                  type="email"
                  placeholder="demo@stocksense.app"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              <Button
                type="submit"
                variant="primary"
                className="w-full h-10 text-sm font-semibold tracking-wide flex items-center justify-center gap-2"
              >
                <span>Continue to OTP Verification</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            /* STEP 2 & 3: Demo OTP Notice + Reset Form */
            <form action={formAction} className="space-y-4">
              {/* Step 2 Demo OTP Banner */}
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-300 font-mono space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-200">
                  <CheckCircleIcon className="h-4 w-4 text-amber-400 shrink-0" />
                  <span>DEMO OTP NOTICE</span>
                </div>
                <p className="text-sm font-bold text-white tracking-widest pt-1">
                  Demo OTP: <span className="bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">123456</span>
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  No external email/SMS is sent for this MVP demo. Use <code className="text-white">123456</code> below.
                </p>
              </div>

              {/* Form Error Banner */}
              {errors.form && (
                <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
                  <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
                  <span>{errors.form}</span>
                </div>
              )}

              {/* Email Address */}
              <Field label="Email Address" htmlFor="email" error={errors.email}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="demo@stocksense.app"
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              {/* OTP Input */}
              <Field
                label="Enter 6-Digit OTP"
                htmlFor="otp"
                error={errors.otp}
                hint="Enter Demo OTP: 123456"
              >
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  defaultValue="123456"
                  placeholder="123456"
                  required
                  maxLength={6}
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono tracking-widest text-center text-lg font-bold"
                />
              </Field>

              {/* New Password */}
              <Field
                label="New Password"
                htmlFor="newPassword"
                error={errors.newPassword}
                hint="Min 8 chars, A-Z, a-z, 0-9, special char"
              >
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              {/* Confirm New Password */}
              <Field
                label="Re-enter New Password"
                htmlFor="confirmPassword"
                error={errors.confirmPassword}
              >
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
                />
              </Field>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  ← Back
                </button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isPending}
                  className="w-2/3 h-10 text-sm font-semibold tracking-wide"
                >
                  {isPending ? "Updating Password..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Login Link */}
        <div className="text-center font-mono text-xs text-zinc-400">
          Remember your password?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
