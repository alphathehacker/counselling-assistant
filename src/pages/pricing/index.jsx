import React from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const Pricing = () => {
  const tiers = [
    {
      name: "Free",
      price: "0",
      description: "Essential tools for students getting started with their college journey.",
      features: [
        "Up to 3 predictions per day",
        "Basic college search",
        "Community forum access",
        "Profile tracking",
        "Public counseling dates"
      ],
      buttonText: "Get Started",
      variant: "outline",
      icon: "User"
    },
    {
      name: "Pro Student",
      price: "1,999",
      description: "Advanced AI insights and personalized counseling for serious applicants.",
      features: [
        "Unlimited AI predictions",
        "Priority counseling notifications",
        "1-on-1 advisor chat (Limited)",
        "Advanced multi-exam comparison",
        "Detailed PDF email reports",
        "Premium college metadata"
      ],
      buttonText: "Upgrade to Pro",
      variant: "primary",
      popular: true,
      icon: "Star"
    },
    {
      name: "Institution",
      price: "Custom",
      description: "Enterprise tools for schools and counseling centers to manage bulk students.",
      features: [
        "Bulk student student management",
        "Custom advisor dashboard",
        "Performance analytics",
        "White-labeled reports",
        "Priority API access",
        "Dedicated account manager"
      ],
      buttonText: "Contact Us",
      variant: "secondary",
      icon: "Building"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Header Section */}
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6 animate-in slide-in-from-bottom duration-700">
            Pricing Plans
          </div>
          <h1 className="text-4xl lg:text-5xl font-heading font-black text-foreground mb-6 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            Invest in Your <span className="underline decoration-primary/50">Future</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Choose the plan that fits your admission target. From basic tracking to enterprise management, we've got you covered.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 items-stretch">
          {tiers.map((t, i) => (
            <div 
              key={i} 
              className={`flex flex-col h-full bg-card border ${t.popular ? 'border-primary shadow-glow-sm scale-105' : 'border-border'} p-8 rounded-3xl relative animate-in fade-in zoom-in duration-700`}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              {t.popular && (
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest z-10">
                  Most Popular
                </div>
              )}
              
              <div className="flex items-center space-x-3 mb-6">
                <div className={`w-12 h-12 ${t.popular ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-2xl flex items-center justify-center`}>
                  <Icon name={t.icon} size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-heading font-bold text-foreground">{t.name}</h3>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-bold text-foreground">₹{t.price}</span>
                  {t.price !== 'Custom' && <span className="text-muted-foreground ml-2">/year</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.description}
                </p>
              </div>

              <div className="flex-1 mb-8 space-y-4">
                {t.features.map((f, j) => (
                  <div key={j} className="flex items-start space-x-3">
                    <div className="mt-1 flex-shrink-0">
                      <Icon name="CheckCircle2" size={16} className="text-success" />
                    </div>
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={t.variant} 
                fullWidth 
                size="lg" 
                className="mt-auto"
                iconName="ArrowRight"
                iconPosition="right"
              >
                {t.buttonText}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ Preview */}
        <div className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm">
          <h2 className="text-2xl font-heading font-bold mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Our team of counselors can help you choose the best roadmap for your specific engineering or medical admission goal.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" iconName="MessageSquare" iconPosition="left">
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
