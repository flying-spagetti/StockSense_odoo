"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import {
  getUserByLoginId,
  getUserByEmail,
  getUserByIdentifier,
  insertUser,
  updateUserPasswordByEmail,
  createOtpCode,
  verifyOtpCode,
  updateUserRole,
} from "@/lib/db/queries";
import {
  parseLoginForm,
  parseSignupForm,
  parseResetPasswordForm,
  type AuthFormState,
} from "@/lib/validation";
import { createSessionCookie, destroySessionCookie, getSession } from "@/lib/session";

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
    role: user.role,
  });

  redirect("/");
}

export async function requestOtpAction(emailOrLoginId: string): Promise<{
  success: boolean;
  message: string;
  code?: string;
}> {
  const user = await getUserByIdentifier(emailOrLoginId);
  const emailToUse = user ? user.email : (emailOrLoginId.includes("@") ? emailOrLoginId : `${emailOrLoginId}@stocksense.app`);

  const code = await createOtpCode(emailToUse);

  return {
    success: true,
    message: `OTP sent to ${emailToUse}. Code generated successfully!`,
    code,
  };
}

export async function verifyOtpAction(
  emailOrLoginId: string,
  otpCode: string,
  selectedRole?: "inventory_manager" | "warehouse_staff",
): Promise<{ success: boolean; message: string }> {
  let user = await getUserByIdentifier(emailOrLoginId);
  const emailToUse = user ? user.email : (emailOrLoginId.includes("@") ? emailOrLoginId : `${emailOrLoginId}@stocksense.app`);

  const isValid = await verifyOtpCode(emailToUse, otpCode);
  if (!isValid) {
    return { success: false, message: "Invalid or expired OTP verification code." };
  }

  if (!user) {
    // Create new user automatically via OTP login
    const loginId = emailOrLoginId.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
    const passwordHash = bcrypt.hashSync("OtpUser@123", 10);
    user = await insertUser({
      loginId,
      email: emailToUse,
      passwordHash,
      role: selectedRole || "inventory_manager",
    });
  } else if (selectedRole && user.role !== selectedRole) {
    await updateUserRole(user.id, selectedRole);
    user.role = selectedRole;
  }

  await createSessionCookie({
    id: user.id,
    loginId: user.loginId,
    email: user.email,
    role: user.role,
  });

  redirect("/");
}

export async function switchRoleAction(
  newRole: "inventory_manager" | "warehouse_staff",
): Promise<void> {
  const session = await getSession();
  if (session) {
    await updateUserRole(session.userId, newRole);
    await createSessionCookie({
      id: session.userId,
      loginId: session.loginId,
      email: session.email,
      role: newRole,
    });
  }
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
  const roleRaw = formData.get("role") as string;
  const role = roleRaw === "warehouse_staff" ? "warehouse_staff" : "inventory_manager";

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
    role,
  });

  await createSessionCookie({
    id: newUser.id,
    loginId: newUser.loginId,
    email: newUser.email,
    role: newUser.role,
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

