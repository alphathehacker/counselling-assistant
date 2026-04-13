import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const PrivacyPolicy = () => {
  return (
    <LegalTemplate 
      title="Privacy Policy" 
      icon="Shield" 
      lastUpdated="January 2024"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">1. Introduction</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          At Counselling Assistant, we are committed to protecting your personal information and your right to privacy. 
          If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, please contact us at support@admissionpredictor.com.
        </p>
        
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">2. Information We Collect</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We collect personal information that you voluntarily provide to us when you register on the Website, express an interest in obtaining information about us or our products and Services, when you participate in activities on the Website, or otherwise when you contact us.
        </p>
        <ul className="list-disc pl-8 space-y-3 text-muted-foreground mb-8">
          <li><strong>Personal Data:</strong> Name, email address, password, profile picture.</li>
          <li><strong>Academic Data:</strong> Entrance exam scores, ranks, category, state of domicile.</li>
          <li><strong>Preferences:</strong> Preferred branches, districts, and institute groups.</li>
          <li><strong>Usage Data:</strong> How you interact with our prediction tools and statistics.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">3. How We Use Your Information</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We use personal information collected via our Website for a variety of business purposes described below:
        </p>
        <ul className="list-disc pl-8 space-y-3 text-muted-foreground">
          <li>To facilitate account creation and logon process.</li>
          <li>To generate personalized college admission predictions.</li>
          <li>To send you administrative information.</li>
          <li>To protect our Services and fulfill our legal obligations.</li>
          <li>To respond to user inquiries/offer support to users.</li>
        </ul>
      </section>

      <section className="mt-12 text-center py-6 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">GDPR & Data Protection</p>
        <p className="text-muted-foreground text-sm">We process your data according to the highest industry standards for privacy and security. Check our GDPR section for more details.</p>
      </section>
    </LegalTemplate>
  );
};

export default PrivacyPolicy;
