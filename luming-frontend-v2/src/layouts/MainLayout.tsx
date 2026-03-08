import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/business/Header';
import { Footer } from '../components/business/Footer';
import { BottomNav } from '../components/business/BottomNav';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div
      style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Header />
      <main
        style={{
          flex: 1,
          padding: '16px 0',
        }}
      >
        {children || <Outlet />}
      </main>
      <BottomNav />
      <Footer />
    </div>
  );
}
