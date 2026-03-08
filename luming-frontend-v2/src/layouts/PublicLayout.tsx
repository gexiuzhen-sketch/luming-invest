import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

interface PublicLayoutProps {
  children?: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="public-layout">
      <main className="public-content">
        {children || <Outlet />}
      </main>
    </div>
  );
}
