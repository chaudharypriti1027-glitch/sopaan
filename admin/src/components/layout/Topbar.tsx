import { useMemo, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PAGE_GROUPS, PAGE_SUBTITLES, PAGE_TITLES } from '../../navigation';
import { GenerateExamButton } from '../exam/GenerateExamButton';
import '../ui.css';

const NAV_SEARCH_TARGETS = Object.entries(PAGE_TITLES).map(([path, label]) => ({
  path,
  label,
  group: PAGE_GROUPS[path] ?? 'Console',
  subtitle: PAGE_SUBTITLES[path] ?? '',
}));

export function Topbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Admin';
  const group = PAGE_GROUPS[pathname] ?? 'Console';
  const subtitle = PAGE_SUBTITLES[pathname] ?? 'Manage your Sopaan platform';
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV_SEARCH_TARGETS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [query]);

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && matches[0]) {
      navigate(matches[0].path);
      setQuery('');
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-copy">
        <div className="topbar-eyebrow">{group}</div>
        <h1>{title}</h1>
        <p className="topbar-sub">{subtitle}</p>
      </div>
      <div className="search search-live">
        <Search aria-hidden strokeWidth={1.8} />
        <input
          placeholder="Quick search pages…"
          aria-label="Search admin pages"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
        />
        {matches.length > 0 ? (
          <div className="search-dropdown" role="listbox">
            {matches.map((item) => (
              <button
                key={item.path}
                type="button"
                className="search-hit"
                role="option"
                onClick={() => {
                  navigate(item.path);
                  setQuery('');
                }}
              >
                <span className="search-hit-label">{item.label}</span>
                <span className="search-hit-meta">{item.group}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <GenerateExamButton />
      <button
        type="button"
        className="bell"
        aria-label="Open notifications"
        onClick={() => navigate('/notifications')}
      >
        <Bell aria-hidden strokeWidth={1.8} />
        <span className="d" aria-hidden />
      </button>
    </header>
  );
}
