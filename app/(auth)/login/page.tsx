'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { Loader2, Mail, Lock, Sparkles, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GUEST_CREDENTIALS = { email: 'demo@taskmesh.io', password: 'demo1234' };

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setError(null);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        isRegister: 'false',
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/workspaces');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    }
  };

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    try {
      const result = await signIn('credentials', {
        email: GUEST_CREDENTIALS.email,
        password: GUEST_CREDENTIALS.password,
        isRegister: 'false',
        redirect: false,
      });

      if (result?.error) {
        const registerResult = await signIn('credentials', {
          email: GUEST_CREDENTIALS.email,
          password: GUEST_CREDENTIALS.password,
          name: 'Demo User',
          isRegister: 'true',
          redirect: false,
        });
        if (registerResult?.error) {
          toast.error('Guest login unavailable. Use the credentials below.');
          setGuestLoading(false);
          return;
        }
      }

      router.push('/workspaces');
      router.refresh();
    } catch {
      toast.error('Guest login unavailable. Use the credentials below.');
    } finally {
      setGuestLoading(false);
    }
  };

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

          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              <svg
                className="h-4 w-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  className="h-10 pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-primary hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="h-10 pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-10"
              onClick={() => signIn('google', { callbackUrl: '/workspaces' })}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </Button>
            <Button
              variant="outline"
              className="h-10"
              onClick={() => signIn('github', { callbackUrl: '/workspaces' })}
            >
              <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </Button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">quick demo</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            onClick={handleGuestLogin}
            disabled={guestLoading}
          >
            {guestLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCircle className="mr-2 h-4 w-4" />
            )}
            Try Demo (No Signup Needed)
          </Button>

          <p className="mt-2 text-center text-xs text-muted-foreground">
            Demo: demo@taskmesh.io / demo1234
          </p>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-medium text-primary hover:text-primary/80">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
