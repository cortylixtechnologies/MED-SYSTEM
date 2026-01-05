import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  FileText, 
  Send, 
  Inbox, 
  Search, 
  LogOut, 
  Menu,
  X,
  Building2,
  BarChart3,
  Users,
  BookTemplate,
  ClipboardList,
  MessageSquare
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/NotificationCenter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isAdmin = currentUser?.role === 'admin';

  const doctorNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Activity },
    { path: '/create-referral', label: 'New Referral', icon: Send },
    { path: '/sent-referrals', label: 'Sent', icon: FileText },
    { path: '/incoming-referrals', label: 'Incoming', icon: Inbox },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/templates', label: 'Templates', icon: BookTemplate },
    { path: '/followups', label: 'Follow-ups', icon: ClipboardList },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/doctors', label: 'Directory', icon: Users },
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Admin Dashboard', icon: Activity },
    { path: '/code-lookup', label: 'Code Lookup', icon: Search },
  ];

  const navItems = isAdmin ? adminNavItems : doctorNavItems;

  const isActive = (path: string) => location.pathname === path;
  const defaultPath = isAdmin ? '/admin' : '/dashboard';

  return (
    <TooltipProvider delayDuration={100}>
      <nav className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to={defaultPath} className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-lg text-foreground">MedRefer</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <Tooltip key={item.path}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                        isActive(item.path)
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xl:inline">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent className="xl:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

          <div className="hidden lg:flex items-center gap-2">
            <NotificationCenter />
            {currentUser && (
              <div className="text-right hidden xl:block">
                <p className="text-sm font-medium text-foreground truncate max-w-[120px]">{currentUser.full_name}</p>
                <p className="text-xs text-muted-foreground truncate max-w-[120px]">{currentUser.hospital_name || 'No hospital'}</p>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden xl:inline ml-2">Logout</span>
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center gap-2">
            <NotificationCenter />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {currentUser && (
              <div className="pb-3 mb-3 border-b border-border">
                <p className="text-sm font-medium text-foreground">{currentUser.full_name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.hospital_name || 'No hospital'}</p>
              </div>
            )}
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <Button 
              variant="ghost" 
              className="w-full justify-start mt-2" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      )}
      </nav>
    </TooltipProvider>
  );
};

export default Navigation;
