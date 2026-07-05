import { useState, useEffect } from 'react';
import { Save, Bell } from 'lucide-react';
import type { MerchantSettings, UpdateSettingsPayload } from '../../../api/settings.api';

interface Props {
  settings: MerchantSettings | null;
  saving: boolean;
  onSave: (payload: UpdateSettingsPayload) => Promise<boolean>;
}

export default function NotificationsTab({ settings, saving, onSave }: Props) {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(true);
  const [autoRetry, setAutoRetry] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState(3);

  useEffect(() => {
    if (settings) {
      setEmailNotif(settings.notifications?.email ?? true);
      setSmsNotif(settings.notifications?.sms ?? true);
      setAutoRetry(settings.billing?.autoRetry ?? true);
      setRetryAttempts(settings.billing?.retryAttempts ?? 3);
    }
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      notifications: { email: emailNotif, sms: smsNotif },
      billing: { autoRetry, retryAttempts },
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Bell size={18} color="var(--primary-on-light)" />
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Notifications & Billing Behaviour</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Notification Channels</h3>
          {[
            { label: 'Email notifications', sub: 'Receive payment success/failure emails', value: emailNotif, setter: setEmailNotif },
            { label: 'SMS notifications', sub: 'Receive SMS alerts for critical events', value: smsNotif, setter: setSmsNotif },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{row.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{row.sub}</p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                <input type="checkbox" checked={row.value} onChange={e => row.setter(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{
                  position: 'absolute', inset: 0, borderRadius: 12,
                  background: row.value ? 'var(--primary)' : 'var(--border-light)',
                  transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: '#fff', top: 3, left: row.value ? 23 : 3, transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </span>
              </label>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Dunning & Auto-Retry</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)', marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>Auto-retry failed payments</p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically retry failed charges on the dunning schedule</p>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
              <input type="checkbox" checked={autoRetry} onChange={e => setAutoRetry(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: autoRetry ? 'var(--primary)' : 'var(--border-light)', transition: 'background 0.2s' }}>
                <span style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: autoRetry ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              </span>
            </label>
          </div>
          <div className="form-group">
            <label className="label">Max Retry Attempts</label>
            <select className="input" value={retryAttempts} onChange={e => setRetryAttempts(Number(e.target.value))}>
              {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} attempt{n > 1 ? 's' : ''}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
