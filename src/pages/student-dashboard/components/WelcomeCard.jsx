import React from 'react';
import Icon from '../../../components/AppIcon';


const WelcomeCard = ({ userProfile }) => {
  const getGreeting = () => {
    const hour = new Date()?.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getExamBadgeColor = (examType) => {
    const examTypeColors = {
      'JEE Main': 'bg-blue-100 text-blue-800',
      'JEE Advanced': 'bg-purple-100 text-purple-800',
      'EAPCET': 'bg-green-100 text-green-800',
      'ECET': 'bg-orange-100 text-orange-800',
      'CAT': 'bg-red-100 text-red-800'
    };
    return examTypeColors?.[examType] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-gradient-to-r from-primary to-secondary rounded-xl p-6 text-white shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="font-heading font-semibold text-2xl mb-2">
            {getGreeting()}, {userProfile?.name}!
          </h1>
          <p className="text-white/80 mb-4">
            Ready to explore your college options today?
          </p>
          
          <div className="flex flex-wrap gap-3">
            
            
          </div>
        </div>
        
        <div className="hidden sm:block">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
            <Icon name="GraduationCap" size={32} color="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;