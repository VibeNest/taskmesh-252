'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, User, Save, Mail, Briefcase, Building, Phone, Globe } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { update } = useSession();
  const queryClient = useQueryClient();
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
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <h1 className="text-lg font-semibold">Profile Settings</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm">Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-5">
              <Avatar className="size-16">
                <AvatarImage src={profile?.image || undefined} />
                <AvatarFallback className="text-lg">
                  {profile?.name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{profile?.name || 'No name set'}</p>
                <p className="text-xs text-muted-foreground">{profile?.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Member since {new Date(profile?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <User className="size-3.5" />
                  Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Mail className="size-3.5" />
                  Email
                </label>
                <Input value={profile?.email || ''} disabled className="h-9 text-sm" />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Briefcase className="size-3.5" />
                  Job Title
                </label>
                <Input
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. Software Engineer"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Building className="size-3.5" />
                  Department
                </label>
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. Engineering"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Phone className="size-3.5" />
                  Phone
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                  className="h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <Globe className="size-3.5" />
                  Timezone
                </label>
                <Input
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  disabled={!isEditing}
                  placeholder="e.g. America/New_York"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                placeholder="Tell us about yourself..."
                rows={3}
                className="text-sm"
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
                    {updateProfile.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    <Save className="mr-1.5 size-3.5" />
                    Save Changes
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
