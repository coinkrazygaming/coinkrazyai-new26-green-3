// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, Slack, Zap, Save } from 'lucide-react';
import { toast } from 'sonner';
import { adminApiCall } from '@/lib/api';

interface NotificationPreferences {
  email_on_critical: boolean;
  email_on_high: boolean;
  email_on_medium: boolean;
  slack_on_critical: boolean;
  slack_on_high: boolean;
  notify_ai_agents: boolean;
  digest_frequency: string;
  timezone: string;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Australia/Sydney',
  'Australia/Melbourne',
];

const DIGEST_FREQUENCIES = [
  { value: 'never', label: 'Never' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export function AdminNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await adminApiCall<NotificationPreferences>(
        '/admin-notifications/preferences'
      );
      setPreferences(response.data);
    } catch (error: any) {
      console.error('Failed to fetch preferences:', error);
      toast.error('Failed to load preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;

    try {
      setIsSaving(true);
      const response = await adminApiCall(
        '/admin-notifications/preferences',
        {
          method: 'PUT',
          body: JSON.stringify(preferences),
        }
      );

      if (response.success) {
        toast.success('Preferences saved successfully');
      }
    } catch (error: any) {
      console.error('Failed to save preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    if (preferences && typeof preferences[key] === 'boolean') {
      setPreferences({
        ...preferences,
        [key]: !preferences[key],
      });
    }
  };

  const handleSelectChange = (key: keyof NotificationPreferences, value: string) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [key]: value,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          Failed to load preferences
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Notification Preferences</h2>
        <p className="text-muted-foreground">
          Customize how and when you receive notifications
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Receive email alerts based on notification priority
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Critical Priority */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Critical Priority</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive emails for critical security and system alerts
                </p>
              </div>
              <Switch
                checked={preferences.email_on_critical}
                onCheckedChange={() => handleToggle('email_on_critical')}
              />
            </div>

            {/* High Priority */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">High Priority</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive emails for high-priority alerts and warnings
                </p>
              </div>
              <Switch
                checked={preferences.email_on_high}
                onCheckedChange={() => handleToggle('email_on_high')}
              />
            </div>

            {/* Medium Priority */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Medium Priority</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive emails for medium-priority notifications
                </p>
              </div>
              <Switch
                checked={preferences.email_on_medium}
                onCheckedChange={() => handleToggle('email_on_medium')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Slack Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Slack className="w-5 h-5" />
            Slack Notifications
          </CardTitle>
          <CardDescription>
            Receive Slack messages for real-time alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Critical Priority */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">Critical Priority</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive Slack messages for critical alerts
                </p>
              </div>
              <Switch
                checked={preferences.slack_on_critical}
                onCheckedChange={() => handleToggle('slack_on_critical')}
              />
            </div>

            {/* High Priority */}
            <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
              <div className="flex-1">
                <h4 className="font-semibold text-sm">High Priority</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Receive Slack messages for high-priority alerts
                </p>
              </div>
              <Switch
                checked={preferences.slack_on_high}
                onCheckedChange={() => handleToggle('slack_on_high')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Agent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            AI Agent Notifications
          </CardTitle>
          <CardDescription>
            Control notifications from AI agents and automated systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">Notify on AI Agent Actions</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Receive notifications when AI agents perform actions
              </p>
            </div>
            <Switch
              checked={preferences.notify_ai_agents}
              onCheckedChange={() => handleToggle('notify_ai_agents')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Digest</CardTitle>
          <CardDescription>
            Receive periodic summaries of your notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-2 block">Digest Frequency</label>
            <Select
              value={preferences.digest_frequency}
              onValueChange={(value) => handleSelectChange('digest_frequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIGEST_FREQUENCIES.map((freq) => (
                  <SelectItem key={freq.value} value={freq.value}>
                    {freq.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Receive a summary of all notifications at your preferred frequency
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Timezone</label>
            <Select
              value={preferences.timezone}
              onValueChange={(value) => handleSelectChange('timezone', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Used for scheduling digest emails and displaying notification times
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={fetchPreferences}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
