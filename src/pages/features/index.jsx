import React from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Features = () => {
  const featureList = [
    {
      title: "AI Prediction Engine",
      description: "Our advanced neural models analyze last 5 years' cutoff trends to predict your admission chances with 90%+ accuracy.",
      icon: "Cpu",
      color: "blue"
    },
    {
      title: "Real-time Notifications",
      description: "Get instant counseling alerts, date reminders, and vacancy updates directly to your personalized dashboard.",
      icon: "Bell",
      color: "purple"
    },
    {
      title: "Smart College Search",
      description: "Filter from 5,000+ colleges based on rank, location, branch, and category with advanced multi-parameter filtering.",
      icon: "Search",
      color: "green"
    },
    {
      title: "PDF Report Generator",
      description: "Generate and email comprehensive PDF reports of your predicted college list and personalized counseling schedule.",
      icon: "FileText",
      color: "orange"
    },
    {
      title: "Entrance Exam Analytics",
      description: "Get deep insights into JEE Main, Advanced, AP EAPCET, and NEET cutoff trends and historical seat distribution.",
      icon: "Activity",
      color: "rose"
    },
    {
      title: "College Comparison",
      description: "Compare up to 4 colleges side-by-side on parameters like NIRF rank, fees, placements, and campus facilities.",
      icon: "Columns",
      color: "emerald"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section */}
        <div className="mb-20 text-center">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6 animate-in slide-in-from-bottom duration-700">
            Platform Capabilities
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black text-foreground mb-6 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            Powerful Features for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Strategic Admissions
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Take control of your educational future with the most advanced AI tools designed specifically for engineering and medical counseling in India.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {featureList.map((f, i) => (
            <div 
              key={i} 
              className="bg-card border border-border p-8 rounded-3xl group hover:shadow-card transition-all duration-300 hover:-translate-y-2 animate-in fade-in zoom-in duration-700"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <Icon name={f.icon} size={28} className="text-primary" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-4">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="p-12 bg-primary rounded-3xl relative overflow-hidden text-center text-primary-foreground shadow-glow-sm">
          <div className="relative z-10">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
              Ready to find your dream college?
            </h2>
            <p className="text-lg opacity-80 mb-8 max-w-xl mx-auto">
              Join thousands of students using Counselling Assistant to secure their seats in top institutions across India.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Button 
                variant="secondary" 
                size="xl" 
                iconName="ArrowRight" 
                className="px-10"
              >
                Start Prediction
              </Button>
              <Button 
                variant="outline" 
                size="xl" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Watch Demo
              </Button>
            </div>
          </div>
          {/* Abstract SVG Circles Background */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        </div>
      </div>
    </div>
  );
};

export default Features;
