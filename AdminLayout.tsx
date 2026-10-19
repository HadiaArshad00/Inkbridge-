import React from 'react';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from '../../components/Logo';
import { 
  LayoutDashboard, 
  FileText, 
  PlusCircle, 
  Layers, 
  LogOut, 
  ExternalLink, 
  ShieldCheck,
  Feather
} from 'lucide-react';
import { toast } from 'sonner';
import { ChangePasswordModal } from '../../components/ChangePasswordModal';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, adminEmail, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [passwordModalOpen, setPasswordModalOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#0F1419]">
        <div className="flex flex-col items-center gap-3">
          <Feather className="w-8 h-8 text-[#D98E04] animate-bounce" />
          <p className="text-xs text-[#6B7280]">Authenticating InkBridge CMS...</p>
        </div>
      </div>
    );
  }

  if (!user && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleSignOut = async () => {
    try {
      await logout();
      toast.info('Signed out from Admin CMS');
      navigate('/admin/login');
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Posts', path: '/admin/posts', icon: FileText },
    { label: 'New Post', path: '/admin/posts/new', icon: PlusCircle },
    { label: 'Novel Series', path: '/admin/series', icon: Layers },
  ];

  const currentEmail = adminEmail || user?.email || 'Administrator';

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0F1419] text-[#1A1A1A] dark:text-[#E5E7EB] flex flex-col">
      
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-[#1A2027] border-b border-[#E8E2D9] dark:border-[#2A3138] px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-6">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#14213D] text-white tracking-widest uppercase">
              CMS
            </span>
          </Link>

          {/* Admin Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path || (item.path === '/admin/posts' && location.pathname.startsWith('/admin/posts/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    active
                      ? 'bg-[#14213D] text-white dark:bg-[#D98E04]'
                      : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#14213D] hover:bg-[#E8E2D9]/40 dark:hover:bg-[#2A3138]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPasswordModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E2D9] dark:border-[#2A3138] text-xs text-[#6B7280] hover:text-[#14213D] dark:hover:text-white transition-colors"
            title="Change Admin Passcode"
          >
            <span>Passcode</span>
          </button>

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#14213D] dark:hover:text-white"
            title="View public reader site"
          >
            <span>View Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <div className="h-4 w-[1px] bg-[#E8E2D9] dark:bg-[#2A3138] hidden sm:block" />

          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-6 rounded-full bg-[#D98E04] text-white flex items-center justify-center font-bold text-[10px] uppercase">
              {currentEmail[0]}
            </div>
            <span className="hidden lg:inline text-[#6B7280] dark:text-[#9CA3AF] font-medium max-w-[180px] truncate">
              {currentEmail}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg text-[#6B7280] hover:text-[#C53030] hover:bg-[#C53030]/10 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Admin Content Body */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-8 py-8">
        <Outlet />
      </main>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />

    </div>
  );
};
