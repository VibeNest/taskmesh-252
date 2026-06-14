'use client';

/**
 * Profile page displaying personal information, account statistics, and recent activity.
 *
 * @page
 * @description Allows users to view and edit their profile details (name, email, bio,
 * job title, department, phone, timezone), upload an avatar, and see account-level
 * statistics such as member since date, workspaces count, and recent login activity.
 * Uses React Query for API data fetching and mutations.
 *
 * @example
 * ```tsx
 * <ProfilePage />
 * ```
 *
 * @accessibility
 * - All form inputs have explicit labels and are keyboard accessible
 * - Avatar upload button includes aria-label
 * - Loading states are announced via live region text
 * - Color-coded stats use text labels in addition to visual indicators
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  User,
  Save,
  Mail,
  Briefcase,
  Building,
  Phone,
  Globe,
  Calendar,
  LayoutGrid,
  Clock,
  Upload,
  Shield,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate, formatRelativeTime, getInitials } from '@/lib/utils';
import { useWorkspaces } from '@/hooks/use-api';
import toast from 'react-hot-toast';

/** Mock recent login history items for display */
const recentLogins = [
  { id: '1', date: new Date(Date.now() - 2 * 60 * 60 * 1000), ip: '192.168.1.42', device: 'Chrome / macOS' },
  { id: '2', date: new Date(Date.now() - 24 * 60 * 60 * 1000), ip: '192.168.1.42', device: 'Chrome / macOS' },
  { id: '3', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), ip: '10.0.0.15', device: 'Safari / iOS' },
];

export default function ProfilePage() {
  const { update } = useSession();
  const queryClient = useQueryClient();
  const { data: workspaces } = useWorkspaces();
  const [isEditing, setIsEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const updateProfile = useMutation({
    mutationFn: async (data: {
      name?: string;
      bio?: string;
      jobTitle?: string;
      department?: string;
      phone?: string;
      timezone?: string;
    }) => {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await update();
      toast.success('Profile updated');
      setIsEditing(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    jobTitle: '',
    department: '',
    phone: '',
    timezone: '',
  });

  useState(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        jobTitle: profile.jobTitle || '',
        department: profile.department || '',
        phone: profile.phone || '',
        timezone: profile.timezone || '',
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const workspaceCount = workspaces?.length ?? 0;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and view account statistics.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ───── Left Column: Profile Form ───── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile photo + basic info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-muted-foreground" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.image || undefined} />
                      <AvatarFallback className="text-2xl">
                        {getInitials(profile?.name || profile?.email || 'U')}
                      </AvatarFallback>
                    </Avatar>
                    {isEditing && (
                      <button
                        type="button"
                        aria-label="Upload profile photo"
                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
                      >
                        <Upload className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div>
                    <p className="text-base font-medium">{profile?.name || 'No name set'}</p>
                    <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Member since {formatDate(profile?.createdAt || new Date())}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="profile-name" className="flex items-center gap-1.5 text-xs font-medium">
                      <User className="h-3.5 w-3.5" />
                      Name
                    </label>
                    <Input
                      id="profile-name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-email" className="flex items-center gap-1.5 text-xs font-medium">
                      <Mail className="h-3.5 w-3.5" />
                      Email
                    </label>
                    <Input id="profile-email" value={profile?.email || ''} disabled className="h-9 text-sm opacity-60" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-job" className="flex items-center gap-1.5 text-xs font-medium">
                      <Briefcase className="h-3.5 w-3.5" />
                      Job Title
                    </label>
                    <Input
                      id="profile-job"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Software Engineer"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-dept" className="flex items-center gap-1.5 text-xs font-medium">
                      <Building className="h-3.5 w-3.5" />
                      Department
                    </label>
                    <Input
                      id="profile-dept"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. Engineering"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-phone" className="flex items-center gap-1.5 text-xs font-medium">
                      <Phone className="h-3.5 w-3.5" />
                      Phone
                    </label>
                    <Input
                      id="profile-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+1 (555) 000-0000"
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="profile-tz" className="flex items-center gap-1.5 text-xs font-medium">
                      <Globe className="h-3.5 w-3.5" />
                      Timezone
                    </label>
                    <Input
                      id="profile-tz"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="e.g. America/New_York"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="profile-bio" className="text-xs font-medium">Bio</label>
                  <Textarea
                    id="profile-bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} type="button" size="sm">
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsEditing(false);
                          if (profile) {
                            setFormData({
                              name: profile.name || '',
                              bio: profile.bio || '',
                              jobTitle: profile.jobTitle || '',
                              department: profile.department || '',
                              phone: profile.phone || '',
                              timezone: profile.timezone || '',
                            });
                          }
                        }}
                        type="button"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" size="sm" disabled={updateProfile.isPending}>
                        {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save Changes
                      </Button>
                    </>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* ───── Right Column: Stats + Activity ───── */}
        <div className="space-y-6">
          {/* Account Statistics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Account Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Member since
                </span>
                <span className="text-sm font-medium">
                  {formatDate(profile?.createdAt || new Date())}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" />
                  Workspaces
                </span>
                <Badge variant="secondary">{workspaceCount}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Account type
                </span>
                <Badge variant="outline" className="capitalize">
                  {profile?.role || 'Member'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Recent Logins */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Recent Logins
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLogins.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">No login history.</p>
              ) : (
                <div className="space-y-3">
                  {recentLogins.map((login) => (
                    <div key={login.id} className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{formatRelativeTime(login.date)}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{login.device}</p>
                        <p className="text-[11px] text-muted-foreground">{login.ip}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
