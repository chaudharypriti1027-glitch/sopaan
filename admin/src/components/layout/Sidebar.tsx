import { useQuery } from '@tanstack/react-query';
import { NavLink, useNavigate } from 'react-router-dom';
import { fetchAdminStats } from '../../api/admin';
import { useAuth } from '../../auth/AuthContext';
import { ADMIN_ONLY_NAV_IDS } from '../../auth/roles';
import { navBadgesFromStats } from '../../content/navBadges';
import { NAV_GROUPS } from '../../navigation';
import { BrandMark } from '../BrandMark';
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

  const statsQuery = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: fetchAdminStats,
    staleTime: 30_000,
  });

  const badges = navBadgesFromStats(statsQuery.data);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="side">
      <div className="brand">
        <BrandMark size="md" variant="light" />
      </div>

      {NAV_GROUPS.map((group) => {
        const items = group.items.filter((item) => isAdmin || !ADMIN_ONLY_NAV_IDS.has(item.id));
        if (items.length === 0) return null;

        return (
          <div className="navgrp" key={group.title}>
            <div className="gl">{group.title}</div>
            {items.map((item) => {
              const liveBadge =
                item.id in badges ? badges[item.id as keyof typeof badges] : item.badge;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) => `nav${isActive ? ' on' : ''}`}
                >
                  <NavIcon id={item.id} />
                  {item.label}
                  {item.live ? <span className="badge live">LIVE</span> : null}
                  {liveBadge ? <span className="badge">{liveBadge}</span> : null}
                </NavLink>
              );
            })}
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
