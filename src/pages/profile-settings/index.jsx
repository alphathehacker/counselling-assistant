import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { authAPI } from '../../utils/api';

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { user, login, updateProfile, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    examType: '',
    rank: '',
    category: '',
    state: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.profile?.phone || '',
        examType: user.profile?.examType || '',
        rank: user.profile?.rank || '',
        category: user.profile?.category || '',
        state: user.profile?.state || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const examOptions = [
    { value: 'JEE Main', label: 'JEE Main' },
    { value: 'JEE Advanced', label: 'JEE Advanced' },
    { value: 'AP EAPCET', label: 'AP EAPCET' },
    { value: 'AP ECET', label: 'AP ECET' },
    { value: 'NEET', label: 'NEET' },
  ];

  const categoryOptions = [
    { value: 'General', label: 'General' },
    { value: 'OBC-NCL', label: 'OBC-NCL' },
    { value: 'SC', label: 'SC' },
    { value: 'ST', label: 'ST' },
    { value: 'EWS', label: 'EWS' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate(-1)}
                  className="rounded-full h-8 w-8"
                >
                  <Icon name="ArrowLeft" size={18} />
                </Button>
                <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground m-0">
                  Profile Settings
                </h1>
              </div>
              <p className="text-muted-foreground ml-11">
                Manage your personal information and academic details
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sidebar / Profile Card */}
            <div className="md:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-card relative group">
                    <Icon name="User" size={48} className="text-primary" />
                    <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Icon name="Camera" size={24} className="text-white" />
                    </button>
                  </div>
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                    {formData.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">{formData.email}</p>
                  <div className="w-full bg-muted rounded-full h-2 mb-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${user?.profileCompletion || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Profile {user?.profileCompletion || 0}% Complete
                  </p>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Account Information */}
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4 pb-2 border-b border-border">
                      Account Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        iconName="User"
                      />
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        readOnly
                        disabled
                        placeholder="your@email.com"
                        iconName="Mail"
                        description="Email cannot be changed"
                      />
                      <Input
                        label="Phone Number"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        iconName="Phone"
                      />
                    </div>
                  </div>

                  {/* Academic Details */}
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4 pb-2 border-b border-border">
                      Academic Details
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Select
                        label="Entrance Exam"
                        options={examOptions}
                        value={formData.examType}
                        onChange={(val) => handleSelectChange('examType', val)}
                        iconName="BookOpen"
                      />
                      <Input
                        label="Exam Rank"
                        name="rank"
                        type="number"
                        value={formData.rank}
                        onChange={handleChange}
                        placeholder="Enter your rank"
                        iconName="Trophy"
                      />
                      <Select
                        label="Category"
                        options={categoryOptions}
                        value={formData.category}
                        onChange={(val) => handleSelectChange('category', val)}
                        iconName="Tag"
                      />
                      <Input
                        label="Vilage/City/State"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="Enter your location"
                        iconName="MapPin"
                      />
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="flex items-center justify-between pt-4">
                    {success && (
                      <div className="flex items-center text-success text-sm font-medium">
                        <Icon name="CheckCircle" size={16} className="mr-2" />
                        Profile updated successfully!
                      </div>
                    )}
                    {error && (
                      <div className="flex items-center text-error text-sm font-medium">
                        <Icon name="AlertCircle" size={16} className="mr-2" />
                        {error}
                      </div>
                    )}
                    <div className="ml-auto flex space-x-3">
                      <Button variant="outline" type="button" onClick={() => window.history.back()}>
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={loading} iconName="Save" iconPosition="left">
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Password Section */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                      Security
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your password and account security settings
                    </p>
                  </div>
                  <Button variant="outline" iconName="Lock" size="sm">
                    Change Password
                  </Button>
                </div>
              </div>

              {/* Sign Out */}
              <div className="bg-card border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                      Sign Out
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Log out of your account on this device.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    iconName="LogOut"
                    onClick={() => { logout(); navigate('/login'); }}
                  >
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-error/5 border border-error/20 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-error mb-1">
                      Danger Zone
                    </h3>
                    <p className="text-sm text-error/70">
                      Deleting your account is permanent and cannot be undone. All your data will be permanently removed.
                    </p>
                  </div>
                  <Button variant="error" size="sm" iconName="Trash2">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
