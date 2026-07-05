import type { PayoutBalance } from '../../../api/payouts.api';

interface Props {
  balance: PayoutBalance | null;
  loading: boolean;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

export default function PayoutsStats({ balance, loading }: Props) {
  const cards = [
    {
      label: 'Available Balance',
      value: balance ? fmt(balance.availableBalance) : '₦0.00',
      sub: 'Ready to withdraw',
      color: 'var(--success)',
      bg: 'rgba(34,197,94,0.06)',
    },
    {
      label: 'Total Earned',
      value: balance ? fmt(balance.totalEarned) : '₦0.00',
      sub: 'From subscriber payments',
      color: 'var(--primary)',
      bg: 'rgba(99,102,241,0.06)',
    },
    {
      label: 'Total Paid Out',
      value: balance ? fmt(balance.totalPaidOut) : '₦0.00',
      sub: 'Completed withdrawals',
      color: 'var(--text-secondary)',
      bg: 'var(--bg-secondary)',
    },
    {
      label: 'Pending',
      value: balance ? fmt(balance.pendingPayouts) : '₦0.00',
      sub: 'In queue',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.06)',
    },
  ];

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 'var(--space-xl)' }}>
        {cards.map((_, i) => (
          <div key={i} className="card" style={{ height: 100, background: 'var(--bg-secondary)', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 'var(--space-xl)' }}>
      {cards.map((card) => (
        <div key={card.label} className="card" style={{ background: card.bg, borderColor: card.color + '33', padding: '20px 24px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{card.label}</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: card.color, marginBottom: 2 }}>{card.value}</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{card.sub}</p>
        </div>
      ))}
    </div>
  );
}
