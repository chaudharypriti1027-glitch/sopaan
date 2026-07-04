import { useLocation } from 'react-router-dom';
import { PAGE_TITLES } from '../../navigation';
import { GenerateExamButton } from '../exam/GenerateExamButton';
import '../ui.css';

export function Topbar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'Admin';

  return (
    <div className="topbar">
      <h1>{title}</h1>
      <div className="search">
        <svg className="svg" viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input placeholder="Search…" aria-label="Search" />
      </div>
      <GenerateExamButton />
      <button type="button" className="bell" aria-label="Notifications">
        <svg className="svg" viewBox="0 0 24 24" aria-hidden>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span className="d" />
      </button>
    </div>
  );
}
