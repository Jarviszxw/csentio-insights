"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

import supabase from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Basic email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // --- Explicit Validation using Sonner Toasts --- 
    if (!formData.email.trim()) {
      toast.error("Email address is required.");
      return;
    }
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!formData.password) {
      toast.error("Password is required.");
      return;
    }
    if (formData.password.length < 6) { // Example: Enforce minimum password length
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    if (!formData.confirmPassword) {
      toast.error("Please confirm your password.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match. Please re-enter.");
      return;
    }
    // --- End Validation ---

    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // Optional: Add email redirect URL if you have email confirmation enabled
          // emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(`Signup failed: ${error.message}`) 
        throw error
      }

      // Check if user object exists and requires confirmation
      if (data.user && data.user.identities && data.user.identities.length === 0) {
          toast.info("Signup successful! Please check your email to verify your account."); // More specific message
          router.push("/login") // Redirect to login even if verification needed
      } else if (data.user) {
          toast.success("Signup successful! Redirecting to login...")
          // Redirect to login page after successful signup
          router.push("/login")
      } else {
           toast.warning("Signup attempted, but no user data returned. Please try again.");
      }

    } catch (error) {
      console.error("Signup error:", error)
      // Avoid duplicate toast if already handled
      if (!(error instanceof Error && error.message.includes("Signup failed"))) {
           toast.error("An unexpected error occurred during signup.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("w-full lg:grid lg:min-h-screen lg:grid-cols-2", className)} {...props}>
      {/* Left Column: Form */}
      <div className="flex flex-col justify-center p-6 sm:p-12">
         {/* Logo Header - Top-left, Larger, Fixed Size to prevent shift */}
         <div className="absolute top-1 left-8 z-10"> {/* Adjusted top/left */} 
            {/* Explicit width/height attrs + Tailwind size class */}
            <Image 
                src="/WW-1.png" 
                alt="CSENTIŌ Logo" 
                width={240} // Increased width attribute
                height={96} // Increased height attribute (maintaining aspect ratio)
                className="h-24 w-auto" // Tailwind class to control rendered size
                priority // Prioritize loading this critical element
             /> 
         </div>

        {/* Form Centering Container */}
        <div className="mx-auto grid w-full max-w-[380px] gap-8 pt-24 lg:pt-0"> {/* Adjusted padding/gap */} 
          <div className="grid gap-2 text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white text-center">
              Create Your Account
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
               <div className="grid gap-2">
                 <Label htmlFor="email" className="text-neutral-300">Email</Label> 
                 <Input
                   id="email"
                   name="email"
                   type="email"
                   placeholder="hello@csentio.com"
                   autoComplete="email"
                   value={formData.email}
                   onChange={handleChange}
                   className="h-11 bg-black border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                 />
               </div>
               <div className="grid gap-2 relative">
                 <Label htmlFor="password" className="text-neutral-300">Password</Label> 
                 <Input
                   id="password"
                   name="password"
                   type={showPassword ? "text" : "password"}
                   placeholder="Create a password (min. 6 characters)"
                   autoComplete="new-password"
                   value={formData.password}
                   onChange={handleChange}
                   className="h-11 pr-10 bg-black border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                 />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[2.45rem] transform -translate-y-1/2 h-5 w-5 text-neutral-400 hover:text-neutral-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                 </button>
               </div>
                <div className="grid gap-2 relative">
                 <Label htmlFor="confirmPassword" className="text-neutral-300">Confirm Password</Label> 
                 <Input
                   id="confirmPassword"
                   name="confirmPassword"
                   type={showConfirmPassword ? "text" : "password"}
                   placeholder="Confirm your password"
                   autoComplete="new-password"
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   className="h-11 pr-10 bg-black border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                 />
                  <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-[2.45rem] transform -translate-y-1/2 h-5 w-5 text-neutral-400 hover:text-neutral-200"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                 </button>
               </div>
               <Button type="submit" className="w-full h-11 bg-white hover:bg-gray-200 text-black font-medium rounded-md mt-2" disabled={isLoading}>
                 {isLoading ? "Creating account..." : "Sign Up"}
               </Button>
               {/* Sign in Link - Improved contrast */}
               <div className="mt-4 text-center text-sm">
                   <span className="text-neutral-400">Already have an account?{" "}</span>
                   <a href="/login" className="underline text-neutral-200 hover:text-white font-medium">
                     Sign in
                   </a>
                </div>
          </form>

           {/* Footer Added Here */}
          <div className="mt-10 text-center text-xs text-neutral-500">
            <p>© 2025 CSENTIŌ. All Rights Reserved.</p>
            <p>Need help? Contact us at <a href="mailto:hello@csentio.com" className="underline text-neutral-400 hover:text-neutral-200">hello@csentio.com</a></p>
          </div>

        </div>
      </div>
      {/* Right Column: Image - Simplifying styles for debugging */}
      <div className="hidden lg:flex lg:items-center lg:justify-center bg-black p-6">
        <Image
          src="/WW-2.png" 
          alt="CSENTIŌ Feature Logo"
          width={300} // Using a smaller, fixed size for test
          height={300}
          // Temporarily removing className constraints
          // className="h-auto max-h-[80vh] w-auto max-w-[90%] object-contain"
          unoptimized={process.env.NODE_ENV === 'development'}
        />
      </div>
    </div>
  )
} 