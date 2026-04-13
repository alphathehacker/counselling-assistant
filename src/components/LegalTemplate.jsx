import React from 'react';
import Icon from './AppIcon';

const LegalTemplate = ({ title, icon, lastUpdated, children }) => {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Icon name={icon} size={32} className="text-primary" />
          </div>
          <h1 className="font-heading font-bold text-4xl text-foreground mb-4">
            {title}
          </h1>
          {lastUpdated && (
            <p className="text-muted-foreground text-sm">
              Last Updated: {lastUpdated}
            </p>
          )}
        </div>

        {/* Content */}
        <div className="bg-card border border-border rounded-2xl p-8 lg:p-12 shadow-sm prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>

        {/* Support Section */}
        <div className="mt-12 p-8 bg-primary/5 rounded-2xl border border-primary/10 text-center">
          <h3 className="font-heading font-semibold text-xl text-foreground mb-2">
            Still have questions?
          </h3>
          <p className="text-muted-foreground mb-6">
            If you need further clarification regarding our policies, please reach out to our legal team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <a 
              href="mailto:support@admissionpredictor.com"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-smooth flex items-center space-x-2"
            >
              <Icon name="Mail" size={18} />
              <span>Contact Support</span>
            </a>
            <a 
              href="/help"
              className="px-6 py-3 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-smooth flex items-center space-x-2"
            >
              <Icon name="HelpCircle" size={18} />
              <span>Visit Help Center</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalTemplate;
