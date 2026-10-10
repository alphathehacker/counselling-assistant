import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Switch from '../../components/ui/Switch.jsx';
import Select from '../../components/ui/Select';

const Preferences = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [preferences, setPreferences] = useState({
    theme: 'system',
    notifications: {
      email: true,
      push: true,
      sms: false,
      newColleges: true,
      predictionUpdates: true,
    },
    defaultSettings: {
      category: user?.profile?.category || 'General',
      gender: 'Male',
      state: user?.profile?.state || 'Andhra Pradesh',
      examType: user?.profile?.examType || 'JEE Main',
    },
    dataPrivacy: {
      publicProfile: false,
      shareWithColleges: true,
    }
  });

  const handleToggle = (category, field) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const handleSelectChange = (category, field, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    setLoading(true);
    // Mock API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const themeOptions = [
    { value: 'light', label: 'Light Mode' },
    { value: 'dark', label: 'Dark Mode' },
    { value: 'system', label: 'System Default' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-2">
                Preferences
              </h1>
              <p className="text-muted-foreground">
                Customize your experience and notification settings
              </p>
            </div>
            <Button variant="primary" onClick={handleSave} loading={loading} iconName="Save">
              Save Preferences
            </Button>
          </div>

          <div className="space-y-8">
            {/* Appearance Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden relative">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Sun" size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    Appearance
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Choose how the application looks to you
                  </p>
                  <div className="max-w-xs">
                    <Select
                      label="Theme Preference"
                      options={themeOptions}
                      value={preferences.theme}
                      onChange={(val) => setPreferences(p => ({ ...p, theme: val }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notification Section */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Bell" size={20} className="text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    Notifications
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Control which updates and alerts you receive
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pl-14">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground uppercase tracking-wider">Channels</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-foreground">Email Notifications</p>
                        <p className="text-xs text-muted-foreground">Weekly newsletters and updates</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.email} 
                        onChange={() => handleToggle('notifications', 'email')}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-foreground">Push Notifications</p>
                        <p className="text-xs text-muted-foreground">Real-time alerts on your device</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.push} 
                        onChange={() => handleToggle('notifications', 'push')}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-foreground uppercase tracking-wider">Alert Types</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-foreground">New College Listings</p>
                        <p className="text-xs text-muted-foreground">When new colleges are added</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.newColleges} 
                        onChange={() => handleToggle('notifications', 'newColleges')}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-foreground">Prediction Updates</p>
                        <p className="text-xs text-muted-foreground">When your prediction accuracy changes</p>
                      </div>
                      <Switch 
                        checked={preferences.notifications.predictionUpdates} 
                        onChange={() => handleToggle('notifications', 'predictionUpdates')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Default Admission Settings */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Settings" size={20} className="text-warning" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    Default Search Settings
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Pre-set values for your searches and predictions
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pl-14">
                <Select
                  label="Default Exam"
                  options={[
                    { value: 'JEE Main', label: 'JEE Main' },
                    { value: 'JEE Advanced', label: 'JEE Advanced' },
                  ]}
                  value={preferences.defaultSettings.examType}
                  onChange={(val) => handleSelectChange('defaultSettings', 'examType', val)}
                />
                <Select
                  label="Default Category"
                  options={[
                    { value: 'General', label: 'General' },
                    { value: 'OBC', label: 'OBC-NCL' },
                    { value: 'SC', label: 'SC' },
                  ]}
                  value={preferences.defaultSettings.category}
                  onChange={(val) => handleSelectChange('defaultSettings', 'category', val)}
                />
                <Select
                  label="Gender Preference"
                  options={genderOptions}
                  value={preferences.defaultSettings.gender}
                  onChange={(val) => handleSelectChange('defaultSettings', 'gender', val)}
                />
                <Select
                  label="Home State"
                  options={[
                    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
                    { value: 'Telangana', label: 'Telangana' },
                    { value: 'Karnataka', label: 'Karnataka' },
                  ]}
                  value={preferences.defaultSettings.state}
                  onChange={(val) => handleSelectChange('defaultSettings', 'state', val)}
                />
              </div>
            </div>

            {/* Data & Privacy */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Shield" size={20} className="text-error" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-6">
                    Data & Privacy
                  </h3>
                  
                  <div className="space-y-4 pl-10 max-w-2xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">Public Profile</p>
                        <p className="text-xs text-muted-foreground">Allow others to see your statistics (anonymous)</p>
                      </div>
                      <Switch 
                        checked={preferences.dataPrivacy.publicProfile} 
                        onChange={() => handleToggle('dataPrivacy', 'publicProfile')}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-foreground">Share with Colleges</p>
                        <p className="text-xs text-muted-foreground">Let colleges contact you based on your predictions</p>
                      </div>
                      <Switch 
                        checked={preferences.dataPrivacy.shareWithColleges} 
                        onChange={() => handleToggle('dataPrivacy', 'shareWithColleges')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Status (Desktop) */}
            {success && (
              <div className="fixed bottom-8 right-8 bg-success text-success-foreground px-6 py-3 rounded-full shadow-lg flex items-center space-x-3 animate-slide-in">
                <Icon name="CheckCircle" size={18} />
                <span className="font-medium">Preferences saved successfully!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Preferences;
