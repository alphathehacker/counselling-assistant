import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { notificationAPI } from '../../../utils/api';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Initial mock notifications based on user request (fallback)
  const fallbackNotifications = [
    {
      id: 101,
      type: 'deadline',
      title: 'EAPCET Counseling Registration',
      message: 'Registration for EAPCET counseling starts tomorrow. Don\'t miss the deadline!',
      date: '2025-08-13',
      priority: 'high',
      read: false,
      isNew: true
    },
    {
      id: 102,
      type: 'cutoff',
      title: 'JEE Main Cutoff Updated',
      message: 'Latest cutoff data for Round 2 counseling has been updated in our database.',
      date: '2025-08-12',
      priority: 'medium',
      read: false,
      isNew: true
    },
    {
      id: 103,
      type: 'system',
      title: 'New Feature: College Comparison',
      message: 'Compare up to 4 colleges side by side with our new comparison tool.',
      date: '2025-08-11',
      priority: 'low',
      read: true,
      isNew: false
    }
  ];

  const fetchAiNotifications = async () => {
    setIsAiLoading(true);
    try {
      const response = await notificationAPI.getAiNotifications();
      if (response.data.success && response.data.notifications) {
        // Merge AI notifications with existing/fallback ones
        // In a real app, we'd probably replace or append based on date
        setNotifications(prev => {
          const aiNotifs = response.data.notifications.map(n => ({ ...n, isAi: true }));
          // Filter out duplicates if necessary, or just prepend
          const combined = [...aiNotifs, ...prev?.filter(p => !p.isAi)];
          localStorage.setItem('user_notifications', JSON.stringify(combined));
          return combined;
        });
      }
    } catch (error) {
      console.error('Failed to fetch AI notifications:', error);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Load from localStorage or use initial set
  useEffect(() => {
    const stored = localStorage.getItem('user_notifications');
    if (stored) {
      setNotifications(JSON.parse(stored));
      setLoading(false);
    } else {
      setNotifications(fallbackNotifications);
      localStorage.setItem('user_notifications', JSON.stringify(fallbackNotifications));
      setLoading(false);
    }

    // Initial AI fetch
    fetchAiNotifications();
  }, []);

  // Update and Persist
  const updateAndPersist = useCallback((updatedList) => {
    setNotifications(updatedList);
    localStorage.setItem('user_notifications', JSON.stringify(updatedList));
  }, []);

  // Simulate "Real Time" polling every 30 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Logic for background checking could go here (Fetch from API)
      // For now, we simulate by refreshing the state
      console.log('🔍 Checking for real-time updates...');
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-error bg-error/5 shadow-sm';
      case 'medium':
        return 'border-l-warning bg-warning/5';
      default:
        return 'border-l-primary bg-primary/5';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deadline':
        return { name: 'Clock', color: 'text-error' };
      case 'cutoff':
        return { name: 'TrendingUp', color: 'text-warning' };
      case 'system':
        return { name: 'Info', color: 'text-primary' };
      default:
        return { name: 'Bell', color: 'text-muted-foreground' };
    }
  };

  const markAsRead = (id) => {
    const updated = notifications?.map(notif =>
      notif?.id === id ? { ...notif, read: true, isNew: false } : notif
    );
    updateAndPersist(updated);
  };

  const unreadCount = notifications?.filter(n => !n?.read)?.length;

  if (loading) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-card animate-pulse h-80">
        <div className="h-6 w-32 bg-muted rounded mb-6" />
        {[1, 2, 3]?.map(i => (
          <div key={i} className="h-16 w-full bg-muted rounded mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <h3 className="font-heading font-semibold text-lg text-foreground">
            Important Updates
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-[11px] font-bold rounded-full animate-bounce">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 text-primary hover:bg-primary/10 ${isAiLoading ? 'animate-spin' : ''}`}
            onClick={fetchAiNotifications}
            disabled={isAiLoading}
            title="Get AI Counseling Insights"
          >
            <Icon name="Sparkles" size={16} />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted">

          </Button>
        </div>
      </div>

      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {notifications?.map((notification) => {
          const icon = getTypeIcon(notification?.type);
          return (
            <div
              key={notification?.id}
              className={`group relative border-l-4 p-4 rounded-r-lg ${getPriorityColor(notification?.priority)} ${!notification?.read ? 'border-primary' : 'border-muted opacity-80'
                } transition-all duration-300 hover:translate-x-1 cursor-pointer`}
              onClick={() => markAsRead(notification?.id)}
            >
              <div className="flex items-start space-x-3">
                <div className={`flex-shrink-0 mt-0.5 p-1.5 rounded-md ${!notification?.read ? 'bg-background shadow-soft' : ''}`}>
                  <Icon name={icon?.name} size={16} className={icon?.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h4 className={`font-heading font-semibold text-sm ${!notification?.read ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                        {notification?.title}
                      </h4>
                      {notification.isAi && (
                        <div className="flex items-center space-x-0.5 px-1.5 py-0.5 bg-primary/5 text-primary text-[8px] font-bold uppercase rounded border border-primary/10">
                          <Icon name="Sparkles" size={8} />
                          <span>AI</span>
                        </div>
                      )}
                    </div>
                    {!notification?.read && (
                      <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    )}
                  </div>

                  <p className={`text-xs leading-relaxed ${!notification?.read ? 'text-foreground/90' : 'text-muted-foreground'
                    }`}>
                    {notification?.message}
                  </p>

                  <div className="flex items-center space-x-2 mt-2">
                    <Icon name="Calendar" size={10} className="text-muted-foreground" />
                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      {new Date(notification.date)?.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {notifications?.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-background shadow-inner">
            <Icon name="BellOff" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="font-heading font-semibold text-foreground mb-1">
            All Caught Up
          </h4>
          <p className="text-muted-foreground text-xs px-4">
            No new notifications at the moment. We'll alert you when there's an update!
          </p>
        </div>
      )}

      {notifications?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border flex justify-center">
          <Link to="/counseling-updates" className="text-[11px] font-bold text-primary hover:underline flex items-center space-x-1 group">
            <span>View All Counseling Updates</span>
            <Icon name="ArrowRight" size={12} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;