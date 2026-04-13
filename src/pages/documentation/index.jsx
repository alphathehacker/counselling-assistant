import React from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Documentation = () => {
  const docSections = [
    {
      title: "Quick Start Guide",
      description: "Learn how to set up your profile and run your first college admission prediction in under 2 minutes.",
      icon: "Rocket",
      items: ["Creating an Account", "Updating Your Rank", "Branch Selection Preferences"]
    },
    {
      title: "Counseling Concepts",
      description: "Deep dive into JOSAA, CSAB, and AP EAPCET counseling procedures, rules, and best practices.",
      icon: "GraduationCap",
      items: ["Opening vs Closing Ranks", "Reservation Categories", "Seat Allotment Rounds"]
    },
    {
      title: "Using the Predictor",
      description: "Master the advanced features of our AI engine to get the most accurate results.",
      icon: "Target",
      items: ["Multi-exam Predictions", "Historical Trends", "Interpreting Admission Probability"]
    },
    {
      title: "Profile & Settings",
      description: "Manage your personalized data, saved colleges, and notification preferences.",
      icon: "UserCheck",
      items: ["Profile Completion Stats", "Managing Bookmarks", "Exporting Reports"]
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Header Section */}
        <div className="mb-20 text-center max-w-3xl mx-auto overflow-hidden">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6 animate-in slide-in-from-bottom duration-700">
            Resource Center
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black text-foreground mb-6 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Admission Process</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Welcome to the comprehensive guide for Counselling Assistant. Everything you need to know about college admissions and our predictive tools.
          </p>
        </div>

        {/* Documentation Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {docSections.map((section, idx) => (
            <div key={idx} className="bg-card border border-border p-8 rounded-3xl group hover:shadow-card transition-all duration-300">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon name={section.icon} size={28} />
                </div>
                <h2 className="text-2xl font-heading font-bold text-foreground">{section.title}</h2>
              </div>
              <p className="text-muted-foreground mb-8 leading-relaxed">
                {section.description}
              </p>
              <div className="space-y-4">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 bg-muted/20 border border-border rounded-xl group/item hover:bg-primary/5 hover:border-primary/20 transition-all cursor-pointer">
                    <div className="w-6 h-6 bg-primary/20 text-primary rounded-full flex items-center justify-center flex-shrink-0 group-hover/item:bg-primary group-hover/item:text-primary-foreground transform group-hover/item:rotate-12 transition-all">
                      <Icon name="ArrowRight" size={12} />
                    </div>
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Help Center CTA */}
        <div className="p-12 bg-primary rounded-3xl relative overflow-hidden text-center text-primary-foreground">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0 md:space-x-8 text-left max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-heading font-bold mb-2">Can't find what you're looking for?</h2>
              <p className="opacity-80 max-w-xl">
                 Our support team and community experts are available 24/7 to answer your specific counseling questions.
              </p>
            </div>
            <Button variant="secondary" size="lg" iconName="MessageCircle" className="px-10">
              Go to Help Center
            </Button>
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Documentation;
