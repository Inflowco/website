import { useState } from 'react';
import { useAuth } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Switch } from '../../components/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/Tabs';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';
import { ThemeModeSwitch } from '../../components/ThemeModeSwitch';
import styles from './settings.module.css';

export default function SettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
  });
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    pushAlerts: true,
    dailyDigest: true,
    weeklyReport: true,
  });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account and preferences</p>
      </header>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">
            <User size={16} />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell size={16} />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette size={16} />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield size={16} />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Personal Information</h2>
            <div className={styles.form}>
              <div className={styles.row}>
                <div className={styles.field}>
                  <label>First Name</label>
                  <Input
                    value={profile.firstName}
                    onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Last Name</label>
                  <Input
                    value={profile.lastName}
                    onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label>Phone (optional)</label>
                <Input
                  type="tel"
                  value={profile.phone}
                  onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Organization</h2>
            <div className={styles.infoCard}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Organization</span>
                <span className={styles.infoValue}>{user?.organizationName || 'Demo Company'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Role</span>
                <span className={styles.infoValue} style={{ textTransform: 'capitalize' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Alert Notifications</h2>
            <div className={styles.switchList}>
              <div className={styles.switchItem}>
                <div>
                  <h3>Email Alerts</h3>
                  <p>Receive critical and warning alerts via email</p>
                </div>
                <Switch
                  checked={notifications.emailAlerts}
                  onCheckedChange={checked => setNotifications(n => ({ ...n, emailAlerts: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <h3>SMS Alerts</h3>
                  <p>Receive critical alerts via SMS</p>
                </div>
                <Switch
                  checked={notifications.smsAlerts}
                  onCheckedChange={checked => setNotifications(n => ({ ...n, smsAlerts: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <h3>Push Notifications</h3>
                  <p>Receive alerts in your browser</p>
                </div>
                <Switch
                  checked={notifications.pushAlerts}
                  onCheckedChange={checked => setNotifications(n => ({ ...n, pushAlerts: checked }))}
                />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Reports</h2>
            <div className={styles.switchList}>
              <div className={styles.switchItem}>
                <div>
                  <h3>Daily Digest</h3>
                  <p>Summary of system status and alerts</p>
                </div>
                <Switch
                  checked={notifications.dailyDigest}
                  onCheckedChange={checked => setNotifications(n => ({ ...n, dailyDigest: checked }))}
                />
              </div>
              <div className={styles.switchItem}>
                <div>
                  <h3>Weekly Report</h3>
                  <p>Energy and efficiency analysis</p>
                </div>
                <Switch
                  checked={notifications.weeklyReport}
                  onCheckedChange={checked => setNotifications(n => ({ ...n, weeklyReport: checked }))}
                />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Theme</h2>
            <div className={styles.themeSelector}>
              <ThemeModeSwitch />
            </div>
            <p className={styles.themeHint}>
              Choose between light and dark mode, or let the system decide based on your device settings.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Change Password</h2>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Current Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className={styles.field}>
                <label>New Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className={styles.field}>
                <label>Confirm New Password</label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <Button>Update Password</Button>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Sessions</h2>
            <p className={styles.sessionInfo}>
              You are currently logged in. Your session will expire in 7 days.
            </p>
            <Button variant="outline">Sign Out All Devices</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
