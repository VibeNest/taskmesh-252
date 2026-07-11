'use client';

import Link from 'next/link';
import { Sparkles, Check } from 'lucide-react';
import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">TaskMesh</span>
        </div>

        <div className="max-w-md">
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
            Start building
            <br />
            something great.
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            Join thousands of teams who use TaskMesh to ship faster, collaborate better, and stay
            aligned on what matters most.
          </p>

          <div className="mt-10 space-y-4">
            {[
              'Unlimited boards and tasks',
              'Real-time collaboration',
              'Advanced analytics & reporting',
              'Enterprise-grade security',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/15">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm text-white/80">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-white/40">
          &copy; {new Date().getFullYear()} TaskMesh. All rights reserved.
        </p>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold">TaskMesh</span>
          </div>

          <div className="mb-8 space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Create an account</h2>
            <p className="text-sm text-muted-foreground">Start your journey with TaskMesh</p>
          </div>

          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
