import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const SITE_TITLE = '光影世界';

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/wedding', label: '详情', icon: '💒' },
  { path: '/gallery', label: '相册', icon: '📷' },
  { path: '/blessing', label: '祝福', icon: '💌' },
];

export function PublicLayout() {
  const location = useLocation();

  useEffect(() => {
    document.title = SITE_TITLE;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 via-blush-100/30 to-cream-100">
      <header className="sticky top-0 z-40 border-b border-cream-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-center px-4 py-3">
          <Link to="/" className="font-serif text-lg font-semibold tracking-widest text-champagne-600">
            {SITE_TITLE}
          </Link>
        </div>
      </header>
      <main>
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-cream-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg justify-around py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition ${
                  active ? 'text-champagne-600 font-medium' : 'text-gray-500'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
