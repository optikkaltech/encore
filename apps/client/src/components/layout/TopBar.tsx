// ====================================================================
// Encore - Top Bar
// ====================================================================

import { UserPlus, Menu, Search } from 'lucide-react';

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
}

export default function TopBar({ title: _title, onMenuClick }: TopBarProps) {

  return (
    <header className="glass" style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: 'var(--space-md)',
    }}>
      {/* Left: Mobile Menu */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 'var(--space-md)' }}>
        {onMenuClick && (
          <button 
            className="btn-ghost btn-icon show-on-mobile" 
            onClick={onMenuClick}
            style={{ flexShrink: 0 }}
          >
            <Menu size={20} />
          </button>
        )}

        {/* Search Command Hint */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-bar'))}
          className="hide-on-mobile"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            padding: '6px 12px',
            borderRadius: 8,
            color: 'var(--text-secondary)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 200ms ease',
          }}
        >
          <Search size={14} />
          <span>Search or Command...</span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            background: 'var(--bg-primary)',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: 11,
            border: '1px solid var(--border-light)',
            fontWeight: 500,
            marginLeft: 8,
          }}>
            <span>⌘</span>
            <span>K</span>
          </div>
        </button>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', flex: 1, justifyContent: 'flex-end' }}>
        <button className="btn btn-secondary btn-sm hide-on-mobile" style={{ borderRadius: 20 }}>
          <UserPlus size={16} />
          <span>Invite</span>
        </button>
        <button className="btn-ghost btn-icon" style={{ background: 'var(--bg-secondary)' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent-primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
          }}>
            E
          </div>
        </button>
      </div>
    </header>
  );
}