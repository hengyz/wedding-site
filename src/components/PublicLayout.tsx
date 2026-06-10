import { Outlet, Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/wedding', label: '详情', icon: '💒' },
  { path: '/gallery', label: '相册', icon: '📷' },
  { path: '/blessing', label: '祝福', icon: '💌' },
];

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg, #fff8f5)' }}>
      <main>
        <Outlet />
      </main>

      <nav className="home-bottom-nav">
        <div className="home-bottom-nav-inner">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`home-bottom-nav-item ${active ? 'home-bottom-nav-item-active' : ''}`}
              >
                <span className="home-bottom-nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
