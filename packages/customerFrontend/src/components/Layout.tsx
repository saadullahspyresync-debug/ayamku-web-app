import React from 'react';
import Header from './Header';
import Footer from './Footer';
import Cart from './Cart';
import BranchSelector from './BranchSelector';
import LanguageSelector from './LanguageSelector';
import { useBranchStore } from '@/store/branchStore';
import BranchSelectionBackground from './BranchSelectionBackground';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { selectedBranch } = useBranchStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Show beautiful background when no branch selected */}
      {!selectedBranch && <BranchSelectionBackground />}
      
      {selectedBranch && <Header />}
      <main className="flex-1">
        {children}
      </main>
      {selectedBranch && <Footer />}
      {selectedBranch && <Cart />}
      <BranchSelector />
    </div>
  );
};

export default Layout;