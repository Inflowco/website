import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../helpers/useAuth';
import {
  LayoutDashboard,
  Factory,
  Bell,
  GitBranch,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  Wind,
  MessageSquare,
  BookOpen,
  Package,
  Menu,
  X,
  Briefcase,
  Users,
} from 'lucide-react';
import { Button } from './Button';
import styles from './DashboardLayout.module.css';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/app/dashboard', icon: <LayoutDashboard size={20} /> },
  { label: 'Facilities', path: '/app/facilities', icon: <Factory size={20} /> },
  { label: 'Diagrams', path: '/app/diagrams', icon: <GitBranch size={20} /> },
  { label: 'Alerts', path: '/app/alerts', icon: <Bell size={20} /> },
  { label: 'Reports', path: '/app/reports', icon: <FileText size={20} /> },
  { label: 'Install Kit', path: '/app/install-kit', icon: <Package size={20} /> },
];

const aiNavItems: NavItem[] = [
  { label: 'AI Assistant', path: '/app/assistant', icon: <MessageSquare size={20} /> },
  { label: 'Knowledge Base', path: '/app/knowledge-base', icon: <BookOpen size={20} /> },
  { label: 'Customers', path: '/app/crm', icon: <Users size={20} /> },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, facilities, currentFacilityId, setCurrentFacility, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [facilityDropdownOpen, setFacilityDropdownOpen] = useState(false);

  const currentFacility = facilities.find(f => f.id === currentFacilityId);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.menuButton}
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <div className={styles.mobileLogo}>
          <Wind size={24} />
          <span>CompressedAir.AI</span>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/app/dashboard" className={styles.logo}>
            <Wind size={28} />
            <span>CompressedAir.AI</span>
          </Link>
          <button
            className={styles.closeButton}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Facility Selector */}
        <div className={styles.facilitySelector}>
          <button
            className={styles.facilityButton}
            onClick={() => setFacilityDropdownOpen(!facilityDropdownOpen)}
          >
            <Factory size={18} />
            <span>{currentFacility?.name || 'Select Facility'}</span>
            <ChevronDown size={16} className={facilityDropdownOpen ? styles.chevronUp : ''} />
          </button>
          {facilityDropdownOpen && (
            <div className={styles.facilityDropdown}>
              {facilities.map(facility => (
                <button
                  key={facility.id}
                  className={`${styles.facilityOption} ${facility.id === currentFacilityId ? styles.active : ''}`}
                  onClick={() => {
                    setCurrentFacility(facility.id);
                    setFacilityDropdownOpen(false);
                  }}
                >
                  {facility.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <div className={styles.navSection}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navDivider} />

          <div className={styles.navSection}>
            <span className={styles.navSectionLabel}>AI Tools</span>
            {aiNavItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className={styles.navDivider} />

          <div className={styles.navSection}>
            <Link
              to="/services"
              className={styles.navItem}
              onClick={() => setSidebarOpen(false)}
            >
              <Briefcase size={20} />
              <span>Engineering Services</span>
            </Link>
          </div>
        </nav>

        {/* User Section */}
        <div className={styles.userSection}>
          <Link
            to="/app/settings"
            className={`${styles.navItem} ${isActive('/app/settings') ? styles.active : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={20} />
            <span>Settings</span>
          </Link>

          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user?.firstName} {user?.lastName}</span>
              <span className={styles.userRole}>{user?.role}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <LogOut size={18} />
            <span>Sign out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
