import type { MerchantProfile } from '../../../api/settings.api';
import BusinessProfileForm from './BusinessProfileForm';
import PayoutBankForm from './PayoutBankForm';
import PlanUpgradeForm from './PlanUpgradeForm';

interface Props {
  profile: MerchantProfile | null;
  saving: boolean;
  onSaveProfile: (payload: any) => Promise<boolean>;
  onSaveSettings: (payload: any) => Promise<boolean>;
  onUpgradeTier: (tier: string) => Promise<boolean>;
}

export default function ProfileTab({
  profile,
  saving,
  onSaveProfile,
  onSaveSettings,
  onUpgradeTier,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* 1. Business Profile Form */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', border: 'none' }}>
        <BusinessProfileForm profile={profile} saving={saving} onSave={onSaveProfile} />
      </div>

      {/* 2. Payout Bank Form */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', border: 'none' }}>
        <PayoutBankForm profile={profile} saving={saving} onSave={onSaveSettings} />
      </div>

      {/* 3. Plan Upgrade Form */}
      <div className="card" style={{ padding: 24, background: 'var(--bg-secondary)', border: 'none' }}>
        <PlanUpgradeForm profile={profile} saving={saving} onUpgrade={onUpgradeTier} />
      </div>
    </div>
  );
}
