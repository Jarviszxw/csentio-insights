import { Metadata } from "next"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Register - CSENTIŌ Insights",
  description: "Create Your Account",
}

export default function RegisterPage() {
  return (
    // Apply black background to the page container
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0d0d0d" }}>
      <RegisterForm />
    </div>
  )
} 