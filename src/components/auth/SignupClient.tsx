'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { signup } from '@/app/auth/actions'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupClient() {
  const [isPending, startTransition] = useTransition()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = (data: SignupFormValues) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('fullName', data.fullName)
      formData.append('email', data.email)
      formData.append('password', data.password)
      
      const res = await signup(formData)
      if (res?.error) {
        toast.error(res.error)
      } else {
        toast.success('Account created successfully!')
      }
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Soft, eye-soothing decorative background elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-50/50 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-200 mb-4">
            <span className="text-3xl font-extrabold text-white tracking-tighter">TF</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Create an Account
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Start tracking your portfolio today
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)] border border-white/60">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all sm:text-sm font-medium"
                  placeholder="John Doe"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.fullName.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all sm:text-sm font-medium"
                  placeholder="you@example.com"
                  {...register('email')}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className="block w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all sm:text-sm font-medium"
                  placeholder="••••••••"
                  {...register('password')}
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs font-semibold text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:from-indigo-500 hover:to-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {isPending ? (
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                ) : (
                  'Create Account'
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center text-sm font-medium text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-500 font-bold underline decoration-indigo-200 hover:decoration-indigo-500 underline-offset-4 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
