import { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Register - CSENTIŌ Insights",
  description: "Create an account for CSENTIŌ Insights",
}

export default function RegisterPage() {
  return (
    // Apply black background to the page container
    <div className="min-h-screen w-full bg-black">
      <RegisterForm />
    </div>
  )
} 