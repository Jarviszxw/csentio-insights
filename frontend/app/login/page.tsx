import { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Login - CSENTIŌ Insights",
  description: "Login to CSENTIŌ Insights management system",
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0d0d0d" }}>
      <AuthForm />
    </div>
  )
}
