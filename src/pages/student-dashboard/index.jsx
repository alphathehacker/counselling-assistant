import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import WelcomeCard from './components/WelcomeCard';
import QuickActionCards from './components/QuickActionCards';
import ProgressTracker from './components/ProgressTracker';
import RecentPredictions from './components/RecentPredictions';
import NotificationPanel from './components/NotificationPanel';
import StatisticsCards from './components/StatisticsCards';
import ChatbotWidget from './components/ChatbotWidget';
import JeePredictor from './components/JeePredictor';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (authLoading) return;
      
      setLoading(true);
      try {
        if (user) {
          setUserProfile({
            name: user.name,
            email: user.email,
            examType: user.profile?.examType || null,
            rank: user.profile?.rank || null,
            category: user.profile?.category || null,
            state: user.profile?.state || null,
            preferredBranches: user.profile?.preferredBranches || [],
            profileCompletion: user.profileCompletion || 0,
            profilePicture: user.profile?.profilePicture || null,
            userType: user.userType,
          });

          setStatistics(user.statistics || {
            totalPredictions: 0,
            bookmarkedColleges: 0,
            reportsDownloaded: 0,
            profileViews: 0,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="pb-20 lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Loading Skeleton */}
            <div className="space-y-8">
              <div className="h-32 bg-muted rounded-xl animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3]?.map((i) => (
                  <div key={i} className="h-40 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4]?.map((i) => (
                  <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Welcome Section */}
            <WelcomeCard userProfile={userProfile} />

            {/* Quick Actions */}
            <div>
              <h2 className="font-heading font-semibold text-xl text-foreground mb-6">
                Quick Actions
              </h2>
              <QuickActionCards />
            </div>

            {/* JEE Predictor */}
            <div className="w-full">
              <JeePredictor />
            </div>

            {/* Statistics Cards */}
            <div>
              <h2 className="font-heading font-semibold text-xl text-foreground mb-6">
                Your Statistics
              </h2>
              <StatisticsCards stats={statistics} />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Progress Tracker */}
                <div>
                  <ProgressTracker userProfile={userProfile} statistics={statistics} />
                </div>

                {/* Recent Predictions */}
                <div>
                  <h2 className="font-heading font-semibold text-xl text-foreground mb-6">
                    Recent Activity
                  </h2>
                  <RecentPredictions />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Notifications */}
                <div>
                  <NotificationPanel />
                </div>
              </div>
            </div>

            {/* Profile Completion Reminder */}
            {userProfile?.profileCompletion < 100 && (
              <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-warning/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon name="AlertTriangle" size={20} className="text-warning" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                      Complete Your Profile
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Your profile is {userProfile?.profileCompletion}% complete. Complete it to get more accurate predictions.
                    </p>
                    <div className="w-full bg-muted rounded-full h-2 mb-4">
                      <div
                        className="bg-warning h-2 rounded-full transition-all duration-500"
                        style={{ width: `${userProfile?.profileCompletion}%` }}
                      />
                    </div>
                    <div className="flex space-x-3">
                      <Link to="/profile-settings">
                        <Button variant="warning" size="sm" iconName="User" iconPosition="left">
                          Complete Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Chatbot Widget */}
      <ChatbotWidget />
    </div>
  );
};

export default StudentDashboard;