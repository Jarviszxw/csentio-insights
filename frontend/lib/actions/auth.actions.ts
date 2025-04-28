"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServerActionClient } from "@supabase/auth-helpers-nextjs"

export type FormState = {
  message: string;
  error?: boolean;
}

export async function loginAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  if (!email || !password) {
    return { message: "Please enter both email and password.", error: true }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error("Login Action Error:", error.message)
    // Provide more user-friendly messages
    if (error.message.includes("Invalid login credentials")) {
      return { message: "Invalid email or password.", error: true }
    } else if (error.message.includes("Email not confirmed")) {
       return { message: "Please confirm your email address first.", error: true}
    }
    return { message: "Login failed. Please try again later.", error: true }
  }

  // Revalidate the layout to ensure session is updated across the app
  // This might trigger the middleware on subsequent navigations
  revalidatePath('/', 'layout');

  // Instead of returning success message, redirect immediately if successful.
  // The middleware should handle redirecting away from /login anyway,
  // but redirecting here provides immediate feedback after successful action.
  // The middleware's check (`session && isAuthPage`) will still run on the redirected route.
   redirect('/dashboard'); // Redirect to dashboard on success

  // This part might not be reached due to redirect, but good practice
  // return { message: "Login successful!" };
}

// Add registerAction here later if needed

export async function logoutAction(): Promise<void> {
  const cookieStore = cookies()
  const supabase = createServerActionClient({ cookies: () => cookieStore })

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Logout Action Error:", error.message)
    // Optionally, redirect to an error page or handle differently
    // For simplicity, we'll still redirect to login
  }

  // Revalidate the root layout path to ensure session state is cleared
  revalidatePath('/', 'layout');

  // Redirect to login page after logout
  redirect("/login")
} 