"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
// import { useRouter } from "next/navigation" // No longer needed for push/refresh
import { useActionState } from "react" // useActionState from react
import { useFormStatus } from "react-dom" // useFormStatus from react-dom
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"

// import supabase from "@/lib/supabase" // No longer needed directly
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginAction, type FormState } from "@/lib/actions/auth.actions" // Import action and type

// Initial state for the form
const initialState: FormState = {
  message: "",
}

// Separate Submit Button component to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus()
  return (
     <Button type="submit" className="w-full h-11 bg-white hover:bg-gray-200 text-black font-medium rounded-md mt-2" disabled={pending}>
       {pending ? "Logging in..." : "Login"}
     </Button>
  )
}


export function AuthForm({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // const router = useRouter() // No longer needed
  // const [isLoading, setIsLoading] = useState(false) // Replaced by useFormStatus
  const [showPassword, setShowPassword] = useState(false)
  // const [formData, setFormData] = useState({ email: "", password: "" }) // No longer needed

  // useActionState hook manages state updates based on action results
  const [state, formAction] = useActionState(loginAction, initialState)

  // // Removed handleChange as form data is handled by FormData API

  // // Removed handleSubmit, replaced by form action prop

  // Use useEffect to show toast messages based on form state
  useEffect(() => {
    if (state?.message) {
      if (state.error) {
        toast.error(state.message)
      } else {
        // Success toast is less critical now due to immediate redirect
        // toast.success(state.message);
      }
    }
  }, [state])


  return (
    <div className={cn("w-full lg:grid h-screen lg:grid-cols-2", className)} {...props}>
      {/* Left Column: Form */}
      <div className="flex flex-col justify-center p-6 sm:p-12">
         {/* Removed absolute logo */}
         {/* Form Centering Container - Removed top padding, reduced gap/margin */}
         <div className="mx-auto grid w-full max-w-[380px] gap-4"> {/* Reduced gap */}
            {/* Centered logo replacing title - Increased size, reduced bottom margin */}
            <div className="flex justify-center mb-4"> {/* Reduced mb */}
               <Image
                 src="/WW-1.png"
                 alt="CSENTIŌ Logo"
                 width={260} // Further Increased width
                 height={104} // Further Increased height proportionally
                 className="h-auto"
                 priority // Add priority to logo
               />
            </div>
            {/* Form */}
            <form action={formAction} className="grid gap-4 px-2" noValidate>
               <div className="grid gap-2">
                 <Label htmlFor="email" className="text-neutral-300">Email</Label>
                 <Input
                   id="email"
                   name="email" // Name attribute is crucial for FormData
                   type="email"
                   placeholder="hello@csentio.com"
                   autoComplete="email"
                   // value={formData.email} // Controlled input no longer needed
                   // onChange={handleChange}
                   required // Add native validation
                   className="h-11 bg-black border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                 />
               </div>
               <div className="grid gap-2 relative">
                 <Label htmlFor="password" className="text-neutral-300">Password</Label>
                 <Input
                   id="password"
                   name="password" // Name attribute is crucial for FormData
                   type={showPassword ? "text" : "password"}
                   placeholder="••••••••"
                   autoComplete="current-password"
                   // value={formData.password} // Controlled input no longer needed
                   // onChange={handleChange}
                   required // Add native validation
                   className="h-11 pr-10 bg-black border-neutral-700 text-white placeholder:text-neutral-500 focus:border-blue-500 focus:ring-blue-500 rounded-md"
                 />
                  <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-[2.45rem] transform -translate-y-1/2 h-2 w-5 text-neutral-400 hover:text-neutral-200" // Adjusted icon positioning maybe needed
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                 </button>
               </div>
               {/* Use the dedicated SubmitButton component */}
               <SubmitButton />

                <div className="mt-4 text-center text-sm">
                   <span className="text-neutral-400">Don&apos;t have an account?{" "}</span>
                   <a href="/register" className="underline text-neutral-200 hover:text-white font-medium">
                     Sign up
                   </a>
                </div>
          </form>

          <div className="mt-10 text-center text-xs text-neutral-500">
            <p>© 2025 CSENTIŌ. All Rights Reserved.</p>
            <p>Need help? Contact us at <a href="mailto:hello@csentio.com" className="underline text-neutral-400 hover:text-neutral-200">hello@csentio.com</a></p>
          </div>

        </div>
      </div>
      {/* Right Column: Image - Ensure cover and full height */}
      <div className="hidden lg:flex items-center justify-center bg-black p-0 h-full overflow-hidden"> {/* Use h-full */}
        <Image
          src="/CAMPAIGN_9.jpg"
          alt="CSENTIŌ Campaign Image"
          width={1920}
          height={1080}
          priority
          className="h-full w-full object-cover" // Ensure cover
        />
      </div>
    </div>
  )
} 