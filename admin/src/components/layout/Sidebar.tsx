import { NavLink, useNavigate } from 'react-router-dom';
import { NAV_GROUPS } from '../../navigation';
import { useAuth } from '../../auth/AuthContext';
import { ADMIN_ONLY_NAV_IDS } from '../../auth/roles';
import { LogOutIcon, NavIcon } from '../icons/NavIcon';
import '../ui.css';

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user?.name
    ?.split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="side">
      <div className="brand">
        <div className="mk">
          <svg viewBox="0 0 24 24" aria-hidden>
            <rect x="4" y="16.5" width="16" height="4" rx="1.4" fill="#1A1F3B" />
            <rect x="6.5" y="11" width="11" height="4" rx="1.4" fill="#2E3766" />
            <rect x="9" y="5.5" width="6" height="4" rx="1.4" fill="#3A4680" />
          </svg>
        </div>
        <div className="nm">
          Sopaan<span>ADMIN CONSOLE</span>
        </div>
      </div>

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => isAdmin || !ADMIN_ONLY_NAV_IDS.has(item.id));
        if (items.length === 0) return null;

        return (
          <div className="navgrp" key={group.title}>
            <div className="gl">{group.title}</div>
            {items.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) => `nav${isActive ? ' on' : ''}`}
              >
                <NavIcon id={item.id} />
                {item.label}
                {item.live ? <span className="badge live">LIVE</span> : null}
                {item.badge ? <span className="badge">{item.badge}</span> : null}
              </NavLink>
            ))}
          </div>
        );
      })}

      <div className="who">
        <div className="av">{initials ?? 'SA'}</div>
        <div className="t">
          <b>{user?.name ?? 'Admin'}</b>
          <span>{user?.email ?? 'admin@sopaan.dev'}</span>
        </div>
        <button type="button" className="side-logout" onClick={handleLogout} aria-label="Sign out">
          <LogOutIcon />
          Sign out
        </button>
      </div>
    </aside>
  );
}
