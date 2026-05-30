'use client';

import { useState } from 'react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  Users,
  BarChart3,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Unlimited Boards & Tasks',
    description:
      'Create unlimited kanban boards and tasks. Organize work your way with custom columns, labels, and priorities.',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description:
      'Work together seamlessly with live updates. See changes as they happen across your entire team.',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description:
      'Track team velocity, completion rates, and project health with powerful built-in analytics.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'SOC 2 compliant with end-to-end encryption. Your data is safe and secure with enterprise-grade protection.',
  },
  {
    icon: Zap,
    title: 'Seamless Workflows',
    description:
      'Automate repetitive tasks and integrate with your favorite tools. Streamline your team&apos;s workflow.',
  },
  {
    icon: Sparkles,
    title: 'Built for Scale',
    description:
      'From startups to enterprises, TaskMesh grows with you. Handle thousands of tasks without breaking a sweat.',
  },
];

const stats = [
  { value: '10k+', label: 'Teams' },
  { value: '1M+', label: 'Tasks Completed' },
  { value: '99.9%', label: 'Uptime' },
];

interface LandingPageProps {
  user?: { name?: string | null; email?: string | null } | null;
}

export default function LandingPage({ user }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary">
              <Sparkles className="size-4 text-white" />
            </div>
            <span className="text-lg font-semibold">TaskMesh</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            <Link
              href="#stats"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Why TaskMesh
            </Link>
            <div className="flex items-center gap-3">
              {user ? (
                <Link
                  href="/workspaces"
                  className={cn(buttonVariants({ size: 'sm' }))}
                >
                  <LayoutDashboard className="mr-1.5 size-4" />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }))}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </nav>

          <button
            className="flex items-center md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border/50 px-6 pb-4 pt-3 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link
                href="#features"
                className="text-sm text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#stats"
                className="text-sm text-muted-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Why TaskMesh
              </Link>
              <div className="mt-2 flex flex-col gap-2">
                {user ? (
                  <Link
                    href="/workspaces"
                    className={cn(buttonVariants({ size: 'sm' }))}
                  >
                    <LayoutDashboard className="mr-1.5 size-4" />
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/register"
                      className={cn(buttonVariants({ size: 'sm' }))}
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -left-40 -top-40 size-80 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-40 -right-40 size-80 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 px-6 py-20 lg:flex-row lg:py-32">
            <div className="flex-1 text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Sparkles className="size-3.5" />
                <span>Enterprise-grade team collaboration</span>
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Collaborate smarter,
                <br />
                <span className="text-primary">deliver faster.</span>
              </h1>
              <p className="mx-auto mb-8 max-w-lg text-lg leading-relaxed text-muted-foreground lg:mx-0">
                The modern workspace for high-performing teams. Manage projects, track progress, and
                ship products together in real-time.
              </p>
              <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                {user ? (
                  <Link
                    href="/workspaces"
                    className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                  >
                    <LayoutDashboard className="size-4" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className={cn(buttonVariants({ size: 'lg' }), 'gap-2')}
                    >
                      Get Started Free
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/login"
                      className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
                    >
                      Try Demo
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Hero visual */}
            <div className="flex-1">
              <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
                <div className="absolute inset-0 animate-fade-in rounded-xl border border-border/50 bg-card shadow-sm">
                  <div className="flex h-12 items-center gap-2 border-b border-border/50 px-4">
                    <div className="size-2 rounded-full bg-red-400" />
                    <div className="size-2 rounded-full bg-yellow-400" />
                    <div className="size-2 rounded-full bg-green-400" />
                  </div>
                  <div className="grid h-[calc(100%-3rem)] grid-cols-3 gap-3 p-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="mb-3 h-3 w-16 rounded bg-muted-foreground/20" />
                      <div className="space-y-2">
                        <div className="rounded-md border border-border/50 bg-card p-3 shadow-sm">
                          <div className="mb-2 h-2 w-full rounded bg-muted-foreground/20" />
                          <div className="mb-2 h-2 w-3/4 rounded bg-muted-foreground/20" />
                          <div className="h-1.5 w-12 rounded bg-primary/30" />
                        </div>
                        <div className="rounded-md border border-border/50 bg-card p-3 shadow-sm">
                          <div className="mb-2 h-2 w-full rounded bg-muted-foreground/20" />
                          <div className="mb-2 h-2 w-2/3 rounded bg-muted-foreground/20" />
                          <div className="h-1.5 w-12 rounded bg-warning/30" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="mb-3 h-3 w-20 rounded bg-muted-foreground/20" />
                      <div className="space-y-2">
                        <div className="rounded-md border border-border/50 bg-card p-3 shadow-sm">
                          <div className="mb-2 h-2 w-full rounded bg-muted-foreground/20" />
                          <div className="mb-2 h-2 w-4/5 rounded bg-muted-foreground/20" />
                          <div className="h-1.5 w-12 rounded bg-success/30" />
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <div className="mb-3 h-3 w-14 rounded bg-muted-foreground/20" />
                      <div className="rounded-md border border-dashed border-border/50 p-3 text-center">
                        <span className="text-xs text-muted-foreground">+ Add task</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-b border-border/50 py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mx-auto mb-16 max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything your team needs
              </h2>
              <p className="text-lg text-muted-foreground">
                Powerful features to help your team collaborate, track work, and ship products
                faster.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="group rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:border-border hover:shadow-md"
                  >
                    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="mb-2 font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section id="stats" className="border-b border-border/50 py-20">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-3 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-4xl font-bold text-primary sm:text-5xl">{stat.value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center shadow-lg sm:px-16">
              <div className="absolute -left-20 -top-20 size-60 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute -bottom-20 -right-20 size-60 rounded-full bg-white/5 blur-3xl" />

              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                Start building something great
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-lg text-white/70">
                Join thousands of teams who use TaskMesh to ship faster, collaborate better, and
                stay aligned on what matters most.
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                {user ? (
                  <Link
                    href="/workspaces"
                    className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'gap-2')}
                  >
                    <LayoutDashboard className="size-4" />
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/register"
                      className={cn(buttonVariants({ variant: 'secondary', size: 'lg' }), 'gap-2')}
                    >
                      Get Started Free
                      <ArrowRight className="size-4" />
                    </Link>
                    <Link
                      href="/login"
                      className={cn(
                        buttonVariants({ variant: 'outline', size: 'lg' }),
                        'border-white/20 text-white hover:bg-white/10 hover:text-white'
                      )}
                    >
                      Sign in
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold">TaskMesh</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </Link>
            {user ? (
              <Link
                href="/workspaces"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Register
                </Link>
              </>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} TaskMesh. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
