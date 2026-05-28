import { ReactNode } from "react";
import BottomNav from "./BottomNav";
import TopNav from "./TopNav";

interface AppLayoutProps {
  children: ReactNode;
  /** Hide default mobile header area when page has its own hero (e.g. home) */
  hideMobileHeader?: boolean;
}

const AppLayout = ({ children, hideMobileHeader }: AppLayoutProps) => {
  return (
    <div className="app-container">
      {/* Desktop Top Navigation */}
      <div className="hidden md:block">
        <TopNav />
      </div>
      
      <main className="safe-bottom hide-scrollbar overflow-y-auto min-h-screen md:min-h-[calc(100vh-5rem)] md:pt-20">
        <div className="md:max-w-7xl md:mx-auto md:px-6">
          {children}
        </div>
      </main>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default AppLayout;
