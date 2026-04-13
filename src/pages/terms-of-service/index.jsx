import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const TermsOfService = () => {
  return (
    <LegalTemplate 
      title="Terms of Service" 
      icon="FileText" 
      lastUpdated="January 2024"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">1. Acceptance of Terms</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          By accessing or using our Website (the "Service"), you agree to be bound by these Terms. 
          If you disagree with any part of the terms then you may not access the Service.
        </p>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">2. Description of Service</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Counselling Assistant provides an AI-powered college admission prediction tool. 
          The Service information and predictions are based on historical data and probabilistic models. 
          <strong>We do not guarantee admission into any institution.</strong>
        </p>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">3. Accounts</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          When you create an account with us, you must provide us information that is accurate, complete, and current at all times. 
          Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">4. User Content</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Our Service allows you to post personal data for prediction purposes. 
          You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness.
        </p>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">5. Limitation of Liability</h2>
        <p className="text-muted-foreground leading-relaxed italic border-l-4 border-error pl-6">
          In no event shall Counselling Assistant be liable for any indirect, incidental, special, consequential or punitive damages, 
          including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
        </p>
      </section>
    </LegalTemplate>
  );
};

export default TermsOfService;
