// ====================================================================
// Encore - Top Bar
// ====================================================================

import { UserPlus, Menu, Search } from 'lucide-react';
import { SunIcon, MoonIcon } from '../../assets';

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export default function TopBar({ title: _title, onMenuClick, theme, onThemeToggle }: TopBarProps) {

  return (
    <header style={{
      height: 'var(--topbar-height)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 var(--space-lg)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: 'var(--space-md)',
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border-light)',
      boxShadow: '0 1px 0 rgba(11,46,40,0.05)',
    }}>
      {/* Left: Mobile Menu + Search */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 'var(--space-md)' }}>
        {onMenuClick && (
          <button 
            className="btn-ghost btn-icon show-on-mobile" 
            onClick={onMenuClick}
            style={{
              flexShrink: 0,
              color: 'var(--nomba-teal)',
            }}
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
            padding: '7px 14px',
            borderRadius: 10,
            color: 'var(--text-muted)',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 200ms ease',
            minWidth: 200,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-primary)'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)'; }}
        >
          <Search size={14} color="var(--text-muted)" />
          <span>Search or Command...</span>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2, 
            background: 'var(--bg-primary)',
            padding: '2px 6px',
            borderRadius: 5,
            fontSize: 11,
            border: '1px solid var(--border-light)',
            fontWeight: 600,
            marginLeft: 'auto',
            color: 'var(--text-secondary)',
          }}>
            <span>⌘K</span>
          </div>
        </button>
      </div>

      {/* Right: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
        <button 
          className="btn btn-secondary btn-sm hide-on-mobile"
          style={{ borderRadius: 20, fontSize: 12 }}
        >
          <UserPlus size={14} />
          <span>Invite</span>
        </button>

        {/* Theme Toggle Button */}
        <button
          onClick={onThemeToggle}
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'all 200ms ease',
          }}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-light)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)'; }}
        >
          {theme === 'dark' ? <SunIcon size={16} /> : <MoonIcon size={16} />}
        </button>

        {/* Avatar */}
        <div style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          background: 'var(--nomba-teal)',
          color: 'var(--nomba-lime)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 0 0 2px var(--nomba-lime-glow)',
          transition: 'box-shadow 200ms',
          flexShrink: 0,
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 3px rgba(200,255,0,0.4)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 2px var(--nomba-lime-glow)'; }}
        >
          E
        </div>
      </div>
    </header>
  );
}