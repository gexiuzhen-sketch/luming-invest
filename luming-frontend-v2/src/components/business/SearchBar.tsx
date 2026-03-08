import { useState } from 'react';
import { Search, X } from 'lucide-react';
import type { CSSProperties } from 'react';

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  onClear?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function SearchBar({
  placeholder = '搜索股票代码或名称',
  onSearch,
  onClear,
  style,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  const handleClear = () => {
    setQuery('');
    onClear?.();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`search-bar ${className}`}
      style={{
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '12px 16px',
          transition: 'all 0.2s',
        }}
      >
        <Search size={18} style={{ color: 'rgba(255, 255, 255, 0.3)', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            outline: 'none',
            color: '#fff',
            fontSize: '14px',
            marginLeft: '10px',
            minWidth: 0,
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
          </button>
        )}
      </div>
    </form>
  );
}
