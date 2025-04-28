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
      // --- Prepare user metadata ---
      const defaultRole = 'user'; // Define the default role for new users
      const userMetadata = {
        role: defaultRole,
        // You could add other metadata here if needed from the form
        // e.g., full_name: formData.fullName
      };
      // --- End Prepare user metadata ---

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          // --- Add user_metadata here ---
          data: userMetadata,
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
    <div className={cn("w-full lg:grid h-screen lg:grid-cols-2 overflow-hidden", className)} {...props}>
      {/* Left Column: Form - Use justify-center, reduced padding */}
      <div className="flex flex-col justify-center p-6 sm:p-12 overflow-hidden"> {/* Reduced padding, removed overflow-y-auto */}
         {/* Form Centering Container - Reduced gap */} 
         <div className="mx-auto grid w-full max-w-[380px] gap-4"> {/* Reduced gap */} 
            {/* Centered logo - Moderately reduced size and margin */} 
            <div className="flex justify-center mb-3"> {/* Reduced mb */} 
               <Image
                 src="/WW-1.png"
                 alt="CSENTIŌ Logo"
                 width={260} // Reduced width slightly
                 height={100} // Reduced height proportionally
                 className="h-auto"
                 priority
               />
            </div>
            {/* Form */} 
            <form onSubmit={handleSubmit} className="grid gap-3" noValidate> {/* Reduced gap */}
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
                      className="absolute right-3 top-[2.45rem] transform -translate-y-1/2 h-2 w-5 text-neutral-400 hover:text-neutral-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                      className="absolute right-3 top-[2.45rem] transform -translate-y-1/2 h-2 w-5 text-neutral-400 hover:text-neutral-200"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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

           {/* Footer - Reduced top margin */} 
          <div className="mt-6 text-center text-xs text-neutral-500"> {/* Reduced mt */} 
            <p>© 2025 CSENTIŌ. All Rights Reserved.</p>
            <p>Need help? Contact us at <a href="mailto:hello@csentio.com" className="underline text-neutral-400 hover:text-neutral-200">hello@csentio.com</a></p>
          </div>

        </div>
      </div>

      {/* Right Column: Image - Add inline styles for debugging */}
      <div className="hidden lg:flex items-center justify-center bg-black p-0 h-full overflow-hidden">
        <Image
          src="/CAMPAIGN_9.jpg"
          alt="CSENTIŌ Campaign Image"
          width={1920}
          height={1080}
          priority
          className="h-full w-full object-cover"
          style={{ height: '100%', width: '100%', objectFit: 'cover' }}
        />
      </div>
    </div>
  )
} 