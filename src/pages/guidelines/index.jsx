import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const Guidelines = () => {
  return (
    <LegalTemplate 
      title="Platform Guidelines" 
      icon="CheckCircle" 
      lastUpdated="September 2023"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">User Conduct & Safety</h2>
        <p className="text-muted-foreground leading-relaxed italic border-l-4 border-warning pl-6 mb-6">
          Our guidelines are designed to foster a professional, helpful, and respectful environment for all users.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-bold text-lg mb-2">1. Respect Each Other</h4>
            <p className="text-sm text-muted-foreground">Treat every user with kindness and professional respect. Harassment, discrimination, or hate speech is strictly prohibited.</p>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-bold text-lg mb-2">2. Data Integrity</h4>
            <p className="text-sm text-muted-foreground">Only provide accurate and truthful information about your academic performance and seat allotment results.</p>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h4 className="font-bold text-lg mb-2">3. Professional Advice</h4>
            <p className="text-sm text-muted-foreground">Our counseling predictions are AI-driven estimates. Always verify with official counseling boards before making final decisions.</p>
          </div>
        </div>
      </section>

      <section className="mt-12 text-center py-6 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Zero Tolerance Policy</p>
        <p className="text-muted-foreground text-sm">Violation of these guidelines may lead to temporary suspension or permanent removal from the platform.</p>
      </section>
    </LegalTemplate>
  );
};

export default Guidelines;
