import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const CookiePolicy = () => {
  return (
    <LegalTemplate 
      title="Cookie Policy" 
      icon="Cookie" 
      lastUpdated="November 2023"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">1. What Are Cookies?</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Cookies are small pieces of text sent to your web browser by a website you visit. 
          A cookie file is stored in your web browser and allows the Service or a third-party to recognize you and make your next visit easier and the Service more useful to you.
        </p>
        
        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">2. How We Use Cookies</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          When you use and access the Service, we may place a number of cookies files in your web browser. 
          We use cookies for the following purposes:
        </p>
        <ul className="list-disc pl-8 space-y-4 text-muted-foreground mb-12">
          <li><strong>Essential Cookies:</strong> We use essential cookies to authenticate users and prevent fraudulent use of user accounts.</li>
          <li><strong>Preferences Cookies:</strong> We use preference cookies to remember information that changes the way the Service behaves or looks, such as the "remember me" functionality.</li>
          <li><strong>Analytics Cookies:</strong> We use analytics cookies to track information how the Service is used so that we can make improvements.</li>
        </ul>

        <h2 className="text-2xl font-bold mb-6 italic underline decoration-primary/30">3. Your Choices</h2>
        <p className="text-muted-foreground leading-relaxed mb-6">
          If you'd like to delete cookies or instruct your web browser to delete or refuse cookies, please visit the help pages of your web browser. 
          Please note, however, that if you delete cookies or refuse to accept them, you might not be able to use all of the features we offer.
        </p>
      </section>

      <section className="mt-12 text-center py-6 bg-primary/5 rounded-xl border border-primary/10">
        <p className="text-sm font-medium text-primary uppercase tracking-widest mb-2">Manage Settings</p>
        <p className="text-muted-foreground text-sm">You can always find your personalized cookie settings in your browser's Privacy & Security options.</p>
      </section>
    </LegalTemplate>
  );
};

export default CookiePolicy;
