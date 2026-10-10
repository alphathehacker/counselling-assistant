import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../AppIcon';
import Button from './Button';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../utils/api';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAiNotifications();
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
      }
    } catch (err) {
      console.error('Failed to fetch header notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/student-dashboard', icon: 'LayoutDashboard' },
    { label: 'Predict', path: '/college-prediction-engine', icon: 'Target' },
    { label: 'Results', path: '/prediction-results-reports', icon: 'BarChart3' },
    { label: 'Search', path: '/college-search-filter', icon: 'Search' },
    { label: 'Saved', path: '/bookmarks-saved-colleges', icon: 'Bookmark' },
    ...(isAdmin ? [{ label: 'Admin', path: '/admin', icon: 'Settings' }] : [])
  ];

  const isActive = (path) => location?.pathname === path;

  // Format date helper
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) return `${diffMins} mins ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    } catch (e) {
      return dateStr;
    }
  };

  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-300 bg-card border-b border-border backdrop-blur-sm">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <Link to="/student-dashboard" className="flex items-center space-x-2 hover:opacity-80 transition-smooth">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Icon name="GraduationCap" size={20} color="white" />
          </div>
          <span className="font-heading font-semibold text-lg text-foreground hidden sm:block">
            Counselling Assistant
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navigationItems?.map((item) => (
            <Link
              key={item?.path}
              to={item?.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-smooth ${isActive(item?.path)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
            >
              <Icon name={item?.icon} size={16} />
              <span>{item?.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative"
                >
                  <Icon name="Bell" size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-error-foreground text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>

                {/* Notifications Dropdown */}
                {isNotificationOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] max-w-80 bg-popover border border-border rounded-lg shadow-modal z-300">
                    <div className="p-4 border-b border-border">
                      <h3 className="font-heading font-medium text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications?.length > 0 ? (
                        notifications?.map((notification) => (
                          <div
                            key={notification?.id}
                            className={`p-4 border-b border-border last:border-b-0 hover:bg-muted transition-smooth ${!notification?.read ? 'bg-muted/50' : ''
                              }`}
                          >
                            <div className="flex items-start space-x-3">
                              {!notification?.read && (
                                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-1">
                                  <p className="text-sm font-medium text-foreground">{notification?.title}</p>
                                  {notification.isAi && <Icon name="Sparkles" size={12} className="text-primary" />}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {notification.message ? (
                                    <span className="block truncate opacity-80 mb-1">{notification.message}</span>
                                  ) : null}
                                  {formatTime(notification?.date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Icon name="Bell" size={24} className="mx-auto text-muted-foreground opacity-20 mb-2" />
                          <p className="text-sm text-muted-foreground">No new updates</p>
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t border-border">

                    </div>
                  </div>
                )}
              </div>

              {/* Profile Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="rounded-full"
                >
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                    <Icon name="User" size={16} color="white" />
                  </div>
                </Button>

                {/* Profile Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-popover border border-border rounded-lg shadow-modal z-300">
                    <div className="p-4 border-b border-border">
                      <p className="font-medium text-sm text-foreground">{user?.name || 'User'}</p>
                      <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
                      {user?.userType === 'admin' && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <div className="py-2">
                      <Link
                        to="/profile-settings"
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Icon name="User" size={16} />
                        <span>Profile Settings</span>
                      </Link>
                      <Link
                        to="/preferences"
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Icon name="Settings" size={16} />
                        <span>Preferences</span>
                      </Link>
                      <Link
                        to="/help-support"
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-smooth"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Icon name="HelpCircle" size={16} />
                        <span>Help & Support</span>
                      </Link>
                      <div className="border-t border-border my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-error hover:bg-muted transition-smooth"
                      >
                        <Icon name="LogOut" size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Mobile Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-100 bg-card border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around py-1.5">
          {navigationItems?.map((item) => (
            <Link
              key={item?.path}
              to={item?.path}
              className={`flex flex-col items-center space-y-0.5 px-2 sm:px-3 py-1.5 rounded-lg transition-smooth min-w-0 ${isActive(item?.path)
                ? 'text-primary' : 'text-muted-foreground'
                }`}
            >
              <Icon name={item?.icon} size={20} />
              <span className="text-[11px] leading-tight font-medium">{item?.label}</span>
            </Link>
          ))}
        </div>
      </nav>
      {/* Overlay for dropdowns */}
      {(isNotificationOpen || isProfileOpen) && (
        <div
          className="fixed inset-0 z-250"
          onClick={() => {
            setIsNotificationOpen(false);
            setIsProfileOpen(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;