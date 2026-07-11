'use client';

import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';

export default function LoginPage() {
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
            Collaborate smarter,
            <br />
            deliver faster.
          </h1>
          <p className="text-base leading-relaxed text-white/70">
            The modern workspace for high-performing teams. Manage projects, track progress, and
            ship products together.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-8">
            {[
              ['10k+', 'Teams'],
              ['1M+', 'Tasks Completed'],
              ['99.9%', 'Uptime'],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-white/60">{label}</div>
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
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
