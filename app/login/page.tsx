"use client";

import React, { useActionState, use } from "react";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertTriangleIcon, CheckCircleIcon } from "@/components/ui/icons";
import type { AuthFormState } from "@/lib/validation";

const initialState: AuthFormState = {};

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedParams = use(searchParams);
  const [state, formAction, isPending] = useActionState(loginAction, initialState);
  const errors = state?.errors ?? {};

  const isResetSuccess = resolvedParams.reset === "success";

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

        {/* Demo Helper Banner 
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-300 font-mono space-y-1">
          <div className="flex items-center justify-between font-bold text-amber-200">
            <span>DEMO CREDENTIALS:</span>
            <span className="text-[10px] uppercase bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">Seeded</span>
          </div>
          <p>Login ID: <code className="text-white font-semibold">demo_user</code></p>
          <p>Password: <code className="text-white font-semibold">Demo@123</code></p>
        </div>
        */}

        {/* Reset Success Toast */}
        {isResetSuccess && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 font-mono flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Password updated successfully! Please log in with your new password.</span>
          </div>
        )}

        {/* Login Form Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-sm">
          <form action={formAction} className="space-y-4">
            {/* Global Error Banner */}
            {errors.form && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Login ID or Email */}
            <Field label="Login ID or Email" htmlFor="identifier" error={errors.identifier}>
              <Input
                id="identifier"
                name="identifier"
                type="text"
                placeholder="user or demo@stocksense.app"
                defaultValue=""
                required
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500"
              />
            </Field>

            {/* Password */}
            <Field label="Password" htmlFor="password" error={errors.password}>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                defaultValue="[PASSWORD]"
                required
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500"
              />
            </Field>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-mono text-amber-400 hover:text-amber-300 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full h-10 text-sm font-semibold tracking-wide"
            >
              {isPending ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
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
