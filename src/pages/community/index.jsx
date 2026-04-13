import React from 'react';
import LegalTemplate from '../../components/LegalTemplate';

const Community = () => {
  return (
    <LegalTemplate 
      title="Our Community" 
      icon="Users" 
      lastUpdated="October 2023"
    >
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Welcome to the Student Hub</h2>
        <p className="text-muted-foreground leading-relaxed">
          The Counselling Assistant community is a vibrant group of students, parents, and educational experts all working together to navigate the complex world of college admissions.
          Our platfom provides a safe space for users to share their experiences, ask questions, and support each other through the decision-making process.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="p-6 bg-muted/30 rounded-xl border border-border">
          <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
            <span>Peer Support</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Connect with seniors who are already in the colleges you're aiming for and get first-hand insights.
          </p>
        </div>
        <div className="p-6 bg-muted/30 rounded-xl border border-border">
          <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
            <span>Expert Advice</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            Join our weekly webinars with professional career counselors and admission experts.
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-2xl font-bold mb-6">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed italic border-l-4 border-primary pl-6">
          "To democratize access to quality higher education planning through community-driven data and intelligent prediction tools."
        </p>
      </section>
    </LegalTemplate>
  );
};

export default Community;
