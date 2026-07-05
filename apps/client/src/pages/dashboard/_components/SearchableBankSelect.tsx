import { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Bank {
  code: string;
  name: string;
}

interface Props {
  banks: Bank[];
  selectedCode: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export default function SearchableBankSelect({ banks, selectedCode, onChange, disabled }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBank = banks.find(b => b.code === selectedCode);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = banks.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.code.includes(search)
  );

  const handleSelect = (code: string) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: '1px solid var(--border-primary)', background: 'var(--bg-primary)',
          color: 'var(--text-primary)', textAlign: 'left', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <span>{selectedBank ? selectedBank.name : 'Select bank'}</span>
        <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
          background: 'var(--bg-primary)', border: '1px solid var(--border-primary)',
          borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
          maxHeight: 250, overflowY: 'auto', padding: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid var(--border-light)', marginBottom: 6 }}>
            <Search size={14} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search bank..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-primary)', fontSize: 13 }}
              autoFocus
            />
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>No banks found</div>
          ) : (
            filtered.map(b => (
              <button
                key={b.code}
                type="button"
                onClick={() => handleSelect(b.code)}
                style={{
                  width: '100%', padding: '8px 12px', background: 'none', border: 'none',
                  textAlign: 'left', fontSize: 13, color: 'var(--text-primary)',
                  borderRadius: 6, cursor: 'pointer', transition: 'background 0.1s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {b.name}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
