"use client";

import React, { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AlertTriangleIcon } from "@/components/ui/icons";
import type { AuthFormState } from "@/lib/validation";

const initialState: AuthFormState = {};

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signupAction, initialState);
  const errors = state?.errors ?? {};

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
            Create StockSense Account
          </h1>
          <p className="text-xs text-zinc-400 font-mono">
            Register operator identity to manage warehouse inventory
          </p>
        </div>

        {/* Signup Form Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur-sm">
          <form action={formAction} className="space-y-4">
            {/* Global Error Banner */}
            {errors.form && (
              <div className="rounded-md border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-300 font-mono flex items-center gap-2">
                <AlertTriangleIcon className="h-4 w-4 text-red-400 shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* Login ID */}
            <Field
              label="Login ID"
              htmlFor="loginId"
              error={errors.loginId}
              hint="6–12 characters (letters, numbers, _)"
            >
              <Input
                id="loginId"
                name="loginId"
                type="text"
                placeholder="e.g. operator_01"
                required
                minLength={6}
                maxLength={12}
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
              />
            </Field>

            {/* Email ID */}
            <Field
              label="Email ID"
              htmlFor="email"
              error={errors.email}
              hint="Valid email address for account validation"
            >
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="operator@stocksense.app"
                required
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
              />
            </Field>

            {/* Password */}
            <Field
              label="Password"
              htmlFor="password"
              error={errors.password}
              hint="Min 8 chars, A-Z, a-z, 0-9, special char"
            >
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
              />
            </Field>

            {/* Re-enter Password */}
            <Field
              label="Re-enter Password"
              htmlFor="reenterPassword"
              error={errors.confirmPassword}
            >
              <Input
                id="reenterPassword"
                name="reenterPassword"
                type="password"
                placeholder="••••••••"
                required
                className="bg-zinc-950 border-zinc-700 focus:border-amber-500 font-mono"
              />
            </Field>

            {/* Role Selection */}
            <Field label="System Role" htmlFor="role">
              <select
                id="role"
                name="role"
                defaultValue="inventory_manager"
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
              >
                <option value="inventory_manager">🛡️ Inventory Manager (Full control over Receipts & Deliveries)</option>
                <option value="warehouse_staff">📦 Warehouse Staff (Internal Transfers, Picking, Shelfing, Counting)</option>
              </select>
            </Field>

            {/* Password Criteria Checklist Box */}
            <div className="rounded-md border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-300">Password requirements:</p>
              <ul className="list-disc list-inside space-y-0.5 text-zinc-400">
                <li>Minimum 8 characters</li>
                <li>At least 1 uppercase & 1 lowercase letter</li>
                <li>At least 1 number & 1 special character (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              disabled={isPending}
              className="w-full h-10 text-sm font-semibold tracking-wide"
            >
              {isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </div>

        {/* Footer Login Prompt */}
        <div className="text-center font-mono text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 font-bold hover:underline">
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
