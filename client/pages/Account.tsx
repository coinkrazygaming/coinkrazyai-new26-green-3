import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, Lock, Bell, Shield, Eye, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { auth } from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Account = () => {
  const { user, isLoading, isAuthenticated, refreshProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    gameUpdates: true,
    promoBonuses: true,
    withdrawalAlerts: true,
    loginAlerts: true,
    suspiciousActivityAlerts: true,
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    sessionTimeout: '30',
    rememberDevice: false,
    passwordChangeRequired: false,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profilePublic: false,
    showInLeaderboards: true,
    allowFriendRequests: true,
    allowMessages: true,
    dataCollection: true,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user, isLoading, isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUpdating(true);

    try {
      const updates: any = {};

      if (formData.name !== user?.name) {
        updates.name = formData.name;
      }
      if (formData.email !== user?.email) {
        updates.email = formData.email;
      }

      if (Object.keys(updates).length === 0) {
        toast.info('No changes to save');
        setIsUpdating(false);
        return;
      }

      const response = await auth.updateProfile(updates);

      if (response.success) {
        await refreshProfile();
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch (err: any) {
      const message = err.message || 'Update failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.currentPassword) {
      setError('Current password is required');
      return;
    }

    if (!formData.newPassword) {
      setError('New password is required');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsUpdating(true);

    try {
      const response = await auth.updateProfile({ password: formData.newPassword });

      if (response.success) {
        toast.success('Password updated successfully');
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
      } else {
        toast.error('Failed to update password');
      }
    } catch (err: any) {
      const message = err.message || 'Password update failed';
      setError(message);
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await auth.updateProfile({ preferences });

      if (response.success) {
        toast.success('Notification preferences updated');
      } else {
        toast.error('Failed to update preferences');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to update preferences';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSecurityUpdate = async () => {
    try {
      setIsUpdating(true);
      const response = await auth.updateProfile({
        privacySettings,
        securitySettings
      });

      if (response.success) {
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch (err: any) {
      const message = err.message || 'Failed to update settings';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!confirm('Are you sure? You will be logged out on all devices.')) return;
    try {
      toast.success('Logged out from all devices');
      await logout();
      navigate('/login');
    } catch (err) {
      toast.error('Failed to logout');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">Manage your account, security, and preferences</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isUpdating}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleChange}
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={isUpdating}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isUpdating}
                >
                  {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-semibold">2FA Status</p>
                  <p className="text-sm text-muted-foreground">
                    {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                  </p>
                </div>
                <Switch
                  checked={securitySettings.twoFactorEnabled}
                  onCheckedChange={(checked) =>
                    setSecuritySettings(prev => ({...prev, twoFactorEnabled: checked}))
                  }
                />
              </div>
              {!securitySettings.twoFactorEnabled && (
                <Button className="w-full">Enable Two-Factor Authentication</Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Session Management
              </CardTitle>
              <CardDescription>Manage your active sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Session Timeout (minutes)</Label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings(prev => ({...prev, sessionTimeout: e.target.value}))}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="240">4 hours</option>
                  <option value="1440">24 hours</option>
                </select>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded">
                <span>Remember this device</span>
                <Switch
                  checked={securitySettings.rememberDevice}
                  onCheckedChange={(checked) =>
                    setSecuritySettings(prev => ({...prev, rememberDevice: checked}))
                  }
                />
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogoutAllDevices}
              >
                Logout from All Devices
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Choose how you want to receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, emailNotifications: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Push Notifications</p>
                    <p className="text-sm text-muted-foreground">Real-time alerts on your device</p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, pushNotifications: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Game Updates</p>
                    <p className="text-sm text-muted-foreground">New games and features</p>
                  </div>
                  <Switch
                    checked={preferences.gameUpdates}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, gameUpdates: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Promo & Bonuses</p>
                    <p className="text-sm text-muted-foreground">Exclusive offers and bonuses</p>
                  </div>
                  <Switch
                    checked={preferences.promoBonuses}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, promoBonuses: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Withdrawal Alerts</p>
                    <p className="text-sm text-muted-foreground">Notifications for withdrawal requests</p>
                  </div>
                  <Switch
                    checked={preferences.withdrawalAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, withdrawalAlerts: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Login Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert when someone accesses your account</p>
                  </div>
                  <Switch
                    checked={preferences.loginAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, loginAlerts: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Suspicious Activity Alerts</p>
                    <p className="text-sm text-muted-foreground">Alert about unusual account activity</p>
                  </div>
                  <Switch
                    checked={preferences.suspiciousActivityAlerts}
                    onCheckedChange={(checked) =>
                      setPreferences(prev => ({...prev, suspiciousActivityAlerts: checked}))
                    }
                  />
                </div>
              </div>

              <Button onClick={handlePreferencesUpdate} className="w-full">
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>Control who can see your profile and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Public Profile</p>
                    <p className="text-sm text-muted-foreground">Allow other players to view your profile</p>
                  </div>
                  <Switch
                    checked={privacySettings.profilePublic}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({...prev, profilePublic: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Show in Leaderboards</p>
                    <p className="text-sm text-muted-foreground">Appear on global leaderboards</p>
                  </div>
                  <Switch
                    checked={privacySettings.showInLeaderboards}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({...prev, showInLeaderboards: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Allow Friend Requests</p>
                    <p className="text-sm text-muted-foreground">Let other players add you as a friend</p>
                  </div>
                  <Switch
                    checked={privacySettings.allowFriendRequests}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({...prev, allowFriendRequests: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Allow Messages</p>
                    <p className="text-sm text-muted-foreground">Receive messages from other players</p>
                  </div>
                  <Switch
                    checked={privacySettings.allowMessages}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({...prev, allowMessages: checked}))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded">
                  <div>
                    <p className="font-semibold">Data Collection</p>
                    <p className="text-sm text-muted-foreground">Allow analytics and data collection for improvements</p>
                  </div>
                  <Switch
                    checked={privacySettings.dataCollection}
                    onCheckedChange={(checked) =>
                      setPrivacySettings(prev => ({...prev, dataCollection: checked}))
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSecurityUpdate} className="w-full">
                Save Privacy Settings
              </Button>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Data & Privacy</CardTitle>
              <CardDescription>Manage your personal data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                Download My Data
              </Button>
              <Button variant="outline" className="w-full">
                View Privacy Policy
              </Button>
              <Button variant="outline" className="w-full">
                View Terms of Service
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Account;
