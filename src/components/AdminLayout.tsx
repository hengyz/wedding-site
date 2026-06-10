import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { isAuthenticated, clearToken } from '../lib/auth';
import { Button } from './Button';

const adminNav = [
  { path: '/admin', label: '概览', exact: true },
  { path: '/admin/config', label: '配置' },
  { path: '/admin/schedules', label: '流程' },
  { path: '/admin/photos', label: '相册' },
  { path: '/admin/blessings', label: '祝福' },
  { path: '/admin/rsvp', label: '宾客回执' },
];

export function AdminLayout() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/admin/login" replace />;
  }

  const isActive = (path: string, exact?: boolean) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <h1 className="font-serif text-lg font-semibold text-champagne-600">
            管理后台
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearToken();
              window.location.href = '/admin/login';
            }}
          >
            退出
          </Button>
        </div>
        <nav className="mx-auto mt-2 flex max-w-lg gap-1 overflow-x-auto pb-1">
          {adminNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition ${
                isActive(item.path, item.exact)
                  ? 'bg-champagne-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4 pb-8 md:max-w-5xl">
        <Outlet />
      </main>
    </div>
  );
}
