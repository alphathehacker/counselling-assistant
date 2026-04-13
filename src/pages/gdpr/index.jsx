import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const GDPR = () => {
  return (
    <LegalTemplate 
      title="GDPR Compliance" 
      icon="CheckSquare" 
      lastUpdated="January 2024"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">1. Data Controller</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          The General Data Protection Regulation (GDPR) is a regulation in EU law on data protection and privacy in the European Union (EU) and the European Economic Area (EEA). 
          It also addresses the transfer of personal data outside the EU and EEA areas.
        </p>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">2. Your Data Protection Rights</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          You have the following data protection rights under the GDPR:
        </p>
        <ul className="list-disc pl-8 space-y-4 text-muted-foreground mb-12">
          <li><strong>The Right to Access:</strong> You have the right to request copies of your personal data.</li>
          <li><strong>The Right to Rectification:</strong> You have the right to request that we correct any information you believe is inaccurate.</li>
          <li><strong>The Right to Erasure:</strong> You have the right to request that we erase your personal data, under certain conditions.</li>
          <li><strong>The Right to Restrict Processing:</strong> You have the right to request that we restrict the processing of your personal data, under certain conditions.</li>
          <li><strong>The Right to Portability:</strong> You have the right to request that we transfer the data that we have collected to another organization, or directly to you.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">3. Contacting Us</h2>
        <p className="text-muted-foreground leading-relaxed mb-6 italic border-l-4 border-primary pl-6">
          If you make a request, we have one month to respond to you. 
          If you would like to exercise any of these rights, please contact our Data Protection Officer at dpo@admissionpredictor.com.
        </p>
      </section>
    </LegalTemplate>
  );
};

export default GDPR;
