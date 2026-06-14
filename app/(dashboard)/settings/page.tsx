'use client';

/**
 * Settings page for user profile, notification, workspace preferences, and danger zone.
 *
 * @page
 * @description Provides sections for managing personal profile information, toggling
 * notification channels (email, push, SMS), adjusting workspace-level preferences
 * (theme, timezone, language), and a danger zone for destructive actions like
 * workspace deletion with a confirmation dialog. Accessible labels are used
 * throughout for screen readers.
 *
 * @example
 * ```tsx
 * <SettingsPage />
 * ```
 *
 * @accessibility
 * - All form controls have associated labels
 * - Delete action requires explicit confirmation via dialog
 * - Keyboard navigable sections
 */

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { useWorkspaces, useDeleteWorkspace } from '@/hooks/use-api';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  User,
  Mail,
  Bell,
  BellRing,
  Smartphone,
  Palette,
  Globe,
  Languages,
  Trash2,
  AlertTriangle,
  Loader2,
  Save,
  Upload,
  Check,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationChannel = 'email' | 'push' | 'sms';

interface NotificationPrefs {
  email: boolean;
  push: boolean;
  sms: boolean;
}

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { theme, setTheme } = useTheme();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const deleteWorkspace = useDeleteWorkspace();

  /** Holds the workspace ID selected for deletion */
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');

  /** Notification preferences state */
  const [notifications, setNotifications] = useState<NotificationPrefs>({
    email: true,
    push: true,
    sms: false,
  });

  /** Profile form state */
  const [profileForm, setProfileForm] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  });

  /** Workspace-level preferences */
  const [timezone, setTimezone] = useState('America/New_York');
  const [language, setLanguage] = useState('en');

  /** Toggle a notification channel on/off */
  const toggleNotification = (channel: NotificationChannel) => {
    setNotifications((prev) => ({ ...prev, [channel]: !prev[channel] }));
    toast.success(`${channel.charAt(0).toUpperCase() + channel.slice(1)} notifications ${notifications[channel] ? 'disabled' : 'enabled'}`);
  };

  /** Handle profile save */
  const handleSaveProfile = async () => {
    try {
      await update({ name: profileForm.name });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  /** Confirm and execute workspace deletion */
  const handleDeleteWorkspace = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteWorkspace.mutateAsync(deleteTargetId);
      setDeleteConfirmOpen(false);
      setDeleteTargetId(null);
      setDeleteInput('');
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  const selectedWorkspace = workspaces?.find((w: { id: string }) => w.id === deleteTargetId);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your account, notifications, and workspace preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* ───── Profile Settings ───── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4" />
              Profile Settings
            </CardTitle>
            <CardDescription>Update your personal information and avatar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={session?.user?.image || undefined} />
                  <AvatarFallback className="text-lg">
                    {getInitials(session?.user?.name || session?.user?.email || 'U')}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  aria-label="Upload avatar photo"
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent"
                >
                  <Upload className="h-3 w-3" />
                </button>
              </div>
              <div>
                <p className="text-sm font-medium">{session?.user?.name || 'No name set'}</p>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="settings-name" className="flex items-center gap-1.5 text-xs font-medium">
                  <User className="h-3.5 w-3.5" />
                  Name
                </label>
                <Input
                  id="settings-name"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="settings-email" className="flex items-center gap-1.5 text-xs font-medium">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </label>
                <Input
                  id="settings-email"
                  value={profileForm.email}
                  disabled
                  className="h-9 text-sm opacity-60"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveProfile}>
                <Save className="mr-1.5 h-3.5 w-3.5" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ───── Notification Preferences ───── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose which channels you receive notifications on.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <NotificationRow
              icon={<BellRing className="h-4 w-4 text-muted-foreground" />}
              label="Email notifications"
              description="Receive updates via email"
              checked={notifications.email}
              onToggle={() => toggleNotification('email')}
              id="notif-email"
            />
            <NotificationRow
              icon={<Bell className="h-4 w-4 text-muted-foreground" />}
              label="Push notifications"
              description="Receive in-app push notifications"
              checked={notifications.push}
              onToggle={() => toggleNotification('push')}
              id="notif-push"
            />
            <NotificationRow
              icon={<Smartphone className="h-4 w-4 text-muted-foreground" />}
              label="SMS notifications"
              description="Receive text message alerts"
              checked={notifications.sms}
              onToggle={() => toggleNotification('sms')}
              id="notif-sms"
            />
          </CardContent>
        </Card>

        {/* ───── Workspace Preferences ───── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Workspace Preferences
            </CardTitle>
            <CardDescription>Customize your workspace experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="settings-theme" className="flex items-center gap-1.5 text-sm font-medium">
                  <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                  Theme
                </label>
                <p className="text-xs text-muted-foreground">Toggle between light, dark, and system theme.</p>
              </div>
              <Select value={theme} onValueChange={(v) => setTheme(v)}>
                <SelectTrigger id="settings-theme" className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="settings-tz" className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Timezone
                </label>
                <p className="text-xs text-muted-foreground">Set your local timezone.</p>
              </div>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger id="settings-tz" className="w-48 h-9 text-sm">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="America/Chicago">America/Chicago (CST)</SelectItem>
                  <SelectItem value="America/Denver">America/Denver (MST)</SelectItem>
                  <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                  <SelectItem value="Europe/Berlin">Europe/Berlin (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                  <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="Australia/Sydney">Australia/Sydney (AEST)</SelectItem>
                  <SelectItem value="Pacific/Auckland">Pacific/Auckland (NZST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <label htmlFor="settings-lang" className="flex items-center gap-1.5 text-sm font-medium">
                  <Languages className="h-3.5 w-3.5 text-muted-foreground" />
                  Language
                </label>
                <p className="text-xs text-muted-foreground">Choose your preferred language.</p>
              </div>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="settings-lang" className="w-36 h-9 text-sm">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="ko">Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ───── Danger Zone ───── */}
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your workspace. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {workspacesLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading workspaces...
              </div>
            ) : (
              workspaces?.map((workspace: { id: string; name: string }) => (
                <div
                  key={workspace.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{workspace.name}</p>
                      <p className="text-xs text-muted-foreground">Permanently delete this workspace and all its data</p>
                    </div>
                  </div>
                  <Dialog
                    open={deleteConfirmOpen && deleteTargetId === workspace.id}
                    onOpenChange={(open) => {
                      setDeleteConfirmOpen(open);
                      if (!open) {
                        setDeleteTargetId(null);
                        setDeleteInput('');
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive border-destructive/30"
                        onClick={() => {
                          setDeleteTargetId(workspace.id);
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          Delete {selectedWorkspace?.name}?
                        </DialogTitle>
                        <DialogDescription>
                          This action is <strong>irreversible</strong>. All boards, tasks, and
                          member data within this workspace will be permanently deleted.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Type <Badge variant="outline" className="font-mono text-xs">{selectedWorkspace?.name}</Badge> below to confirm:
                        </p>
                        <Input
                          value={deleteInput}
                          onChange={(e) => setDeleteInput(e.target.value)}
                          placeholder={selectedWorkspace?.name || 'Type workspace name to confirm'}
                          className="h-9 text-sm"
                          aria-label="Type workspace name to confirm deletion"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeleteConfirmOpen(false);
                            setDeleteTargetId(null);
                            setDeleteInput('');
                          }}
                        >
                          <X className="mr-1.5 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={deleteInput !== selectedWorkspace?.name || deleteWorkspace.isPending}
                          onClick={handleDeleteWorkspace}
                        >
                          {deleteWorkspace.isPending ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Confirm Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * A single row for a notification toggle with icon, label, description, and switch.
 *
 * @param icon - The Lucide icon element
 * @param label - The setting label
 * @param description - A brief description of the setting
 * @param checked - Current toggle state
 * @param onToggle - Callback when the switch is toggled
 * @param id - Unique id for the switch element
 */
function NotificationRow({
  icon,
  label,
  description,
  checked,
  onToggle,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon}</div>
        <div>
          <label htmlFor={id} className="text-sm font-medium">
            {label}
          </label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onToggle} aria-label={label} />
    </div>
  );
}
