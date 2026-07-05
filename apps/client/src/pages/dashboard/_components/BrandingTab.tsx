import { useState, useEffect } from 'react';
import { Save, Palette } from 'lucide-react';
import type { MerchantProfile, UpdateBrandingPayload } from '../../../api/settings.api';

interface Props {
  profile: MerchantProfile | null;
  saving: boolean;
  onSave: (payload: UpdateBrandingPayload) => Promise<boolean>;
}

export default function BrandingTab({ profile, saving, onSave }: Props) {
  const [logoUrl, setLogoUrl] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (profile) {
      setLogoUrl(profile.brandLogoUrl || '');
      setColor(profile.brandPrimaryColor || '#6366f1');
      setDomain(profile.customDomain || '');
    }
  }, [profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      brandLogoUrl: logoUrl || undefined,
      brandPrimaryColor: color || undefined,
      customDomain: domain || undefined,
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Palette size={18} color="var(--primary-on-light)" />
        <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>White-Label Branding</h2>
      </div>

      {/* Live Preview */}
      <div style={{ marginBottom: 28, padding: 24, borderRadius: 12, border: '1px solid var(--border-light)', background: 'var(--bg-secondary)' }}>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 500 }}>PORTAL PREVIEW</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo preview" style={{ height: 40, borderRadius: 8, objectFit: 'contain' }} onError={e => { (e.target as any).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 8, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>E</span>
            </div>
          )}
          <div>
            <p style={{ fontWeight: 700, color: color, fontSize: 16 }}>{profile?.businessName || 'Your Business'}</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{domain || 'subscriber portal'}</p>
          </div>
        </div>
        <div style={{ marginTop: 12, height: 4, borderRadius: 2, background: color, width: '100%' }} />
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="form-group">
          <label className="label">Logo URL</label>
          <input className="input" type="url" placeholder="https://your-cdn.com/logo.png"
            value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Displayed in the subscriber portal header. PNG or SVG recommended.
          </span>
        </div>

        <div className="form-group">
          <label className="label">Primary Brand Color</label>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 48, height: 40, border: 'none', cursor: 'pointer', borderRadius: 8, padding: 4 }} />
            <input className="input" type="text" placeholder="#6366f1" value={color}
              onChange={e => setColor(e.target.value)} maxLength={7} style={{ flex: 1 }} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Custom Domain</label>
          <input className="input" type="text" placeholder="billing.yourdomain.com"
            value={domain} onChange={e => setDomain(e.target.value)} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
            Custom domain for the subscriber portal (requires DNS CNAME setup).
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Branding'}
          </button>
        </div>
      </form>
    </div>
  );
}
