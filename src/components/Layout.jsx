import React from 'react';
import Header from './ui/Header';
import Footer from './ui/Footer';
import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const location = useLocation();
  
  // Pages that should not have footer (like login, register, auth callback)
  const noFooterPages = ['/login', '/admin/login', '/register', '/auth/callback', '/404'];
  const noHeaderPages = ['/login', '/admin/login', '/register', '/auth/callback'];
  
  const shouldShowFooter = !noFooterPages.includes(location?.pathname);
  const shouldShowHeader = !noHeaderPages.includes(location?.pathname);
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {shouldShowHeader && <Header />}
      <main className={`flex-1 ${shouldShowHeader ? 'pt-16' : ''} ${shouldShowFooter ? 'pb-0' : ''}`}>
        {children}
      </main>
      {shouldShowFooter && <Footer />}
    </div>
  );
};

export default Layout;
