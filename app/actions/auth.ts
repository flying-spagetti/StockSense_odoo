"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  getUserByLoginId,
  getUserByEmail,
  getUserByIdentifier,
  insertUser,
  updateUserPasswordByEmail,
} from "@/lib/db/queries";
import {
  parseLoginForm,
  parseSignupForm,
  parseResetPasswordForm,
  type AuthFormState,
} from "@/lib/validation";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = parseLoginForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  const { identifier, password } = result.data;
  const user = await getUserByIdentifier(identifier);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return {
      errors: {
        form: "Invalid login ID or password.",
      },
    };
  }

  await createSessionCookie({
    id: user.id,
    loginId: user.loginId,
    email: user.email,
  });

  redirect("/");
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = parseSignupForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  const { loginId, email, password } = result.data;

  // Check unique loginId
  const existingLogin = await getUserByLoginId(loginId);
  if (existingLogin) {
    return {
      errors: {
        loginId: "Login ID is already taken. Please choose another.",
      },
    };
  }

  // Check unique email
  const existingEmail = await getUserByEmail(email);
  if (existingEmail) {
    return {
      errors: {
        email: "Email address is already registered. Please log in.",
      },
    };
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const newUser = await insertUser({
    loginId,
    email,
    passwordHash,
  });

  await createSessionCookie({
    id: newUser.id,
    loginId: newUser.loginId,
    email: newUser.email,
  });

  redirect("/");
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const result = parseResetPasswordForm(formData);

  if ("errors" in result) {
    return { errors: result.errors };
  }

  const { email, newPassword } = result.data;
  const user = await getUserByEmail(email);

  if (!user) {
    return {
      errors: {
        email: "No user account exists with this email address.",
      },
    };
  }

  const newHash = bcrypt.hashSync(newPassword, 10);
  const updated = await updateUserPasswordByEmail(email, newHash);

  if (!updated) {
    return {
      errors: {
        form: "Failed to update password. Please try again.",
      },
    };
  }

  redirect("/login?reset=success");
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/login");
}
