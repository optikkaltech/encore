import { useState } from 'react';
import { Settings, User, Palette, Bell, RefreshCw } from 'lucide-react';
import { useSettings } from '../../hooks/useSettings';
import ProfileTab from './_components/ProfileTab';
import BrandingTab from './_components/BrandingTab';
import NotificationsTab from './_components/NotificationsTab';

type Tab = 'profile' | 'branding' | 'notifications';

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'notifications', label: 'Notifications', icon: Bell },
];

export default function SettingsPage() {
  const {
    profile,
    settings,
    loading,
    saving,
    saveSettings,
    saveBranding,
    saveProfile,
    upgradeTier,
    refresh,
  } = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  return (
    <div style={{ animation: 'fadeIn 300ms ease-out', padding: 'var(--space-md) 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-xl)', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Settings size={24} color="var(--primary)" />
            Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your account, branding, and integration settings.</p>
        </div>
        <button className="btn btn-secondary" onClick={refresh} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Sidebar nav */}
        <div className="card" style={{ padding: 8 }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: 14, fontWeight: activeTab === id ? 600 : 400,
                background: activeTab === id ? 'rgba(99,102,241,0.08)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--text-secondary)',
                marginBottom: 2,
                transition: 'all 0.15s',
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card" style={{ padding: 28 }}>
          {loading ? (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings…</div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <ProfileTab
                  profile={profile}
                  saving={saving}
                  onSaveProfile={saveProfile}
                  onSaveSettings={saveSettings}
                  onUpgradeTier={upgradeTier}
                />
              )}
              {activeTab === 'branding' && (
                <BrandingTab profile={profile} saving={saving} onSave={saveBranding} />
              )}
              {activeTab === 'notifications' && (
                <NotificationsTab settings={settings} saving={saving} onSave={saveSettings} />
              )}

            </>
          )}
        </div>
      </div>
    </div>
  );
}
