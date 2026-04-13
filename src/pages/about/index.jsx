import React from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const About = () => {
  const teamMembers = [
    {
      name: "TALASU NEERAJA",
      role: "Founder & Chief Counselor",
      description: "Visionary leader with a passion for guiding students toward their ideal academic careers.",
      icon: "User"
    },
    {
      name: "MARRI DURGA PRASAD",
      role: "Lead Systems Architect",
      description: "Expert in building scalable AI systems and designing complex predictive data models.",
      icon: "Cpu"
    },
    {
      name: "KORLAPATI SANKAR NARAYANA",
      role: "Director of Product & Data",
      description: "Strategic head focused on product excellence and data integrity for Indian counseling trends.",
      icon: "Database"
    },
    {
      name: "KILLADA VIJAYA VARSHINI",
      role: "Chief Innovation Officer",
      description: "Driving the adoption of new educational technologies and user-centric features.",
      icon: "Lightbulb"
    }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Hero Section */}
        <div className="mb-24 text-center max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6">
            Our Mission
          </div>
          <h1 className="text-4xl lg:text-7xl font-heading font-black text-foreground mb-8">
            Empowering the Next Generation of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Innovators
            </span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            At Counselling Assistant, we believe that choosing the right college is the most critical decision in a student's life. 
            Our mission is to provide the data, transparency, and AI tools needed to make this decision with absolute confidence.
          </p>
        </div>

        {/* Our Story / Vision Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-32 items-center">
          <div className="relative animate-in slide-in-from-left duration-1000">
             <div className="aspect-[4/5] bg-muted/30 rounded-3xl overflow-hidden relative border border-border shadow-2xl skew-y-2">
                {/* Abstract Visual Representing Growth */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-primary rotate-45 blur-xl" />
                <div className="flex flex-col items-center justify-center h-full p-12 text-center text-foreground">
                   <Icon name="GraduationCap" size={120} className="mb-8 text-primary shadow-glow-sm" />
                   <h3 className="text-3xl font-heading font-bold mb-4 italic">Founded on Integrity</h3>
                   <p className="text-muted-foreground">Since 2023, we've helped over 100,000+ students navigate their career path across India.</p>
                </div>
             </div>
             {/* Decorative Badge */}
             <div className="absolute -bottom-6 -right-6 bg-card border border-border p-6 rounded-2xl shadow-xl -rotate-3">
                <div className="text-4xl font-black text-primary mb-1">1M+</div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Predictions Made</div>
             </div>
          </div>
          
          <div className="space-y-8 animate-in slide-in-from-right duration-1000">
            <h2 className="text-3xl lg:text-5xl font-heading font-bold text-foreground">A Legacy of <br />Helping Students</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We started with a simple observation: students with amazing potential were missing out on top institutions due to a lack of clear, data-driven admission statistics. 
              The Indian counseling process can be overwhelming, with thousands of rules and ever-changing trends.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              That's why we built Counselling Assistant. By combining massive historical datasets with modern machine learning, we've created a platform that demystifies cutoffs and makes high-quality counseling accessible to everyone, regardless of their location.
            </p>
            <div className="pt-4 flex items-center space-x-6 text-sm font-bold text-foreground uppercase tracking-widest">
               <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span>Data Verified</span>
               </div>
               <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span>AI Powered</span>
               </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-heading font-bold text-foreground mb-4">Meet the Visionaries</h2>
            <p className="text-muted-foreground">The brilliant minds driving the future of educational predictions.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, idx) => (
              <div 
                key={idx} 
                className="bg-card border border-border p-8 rounded-3xl group hover:shadow-card transition-all duration-300 hover:-translate-y-2 text-center animate-in zoom-in duration-700"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <Icon name={member.icon || "User"} size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground mb-1">{member.name}</h3>
                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">{member.role}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {member.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Values Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
           <div className="p-8 bg-muted/20 border border-border rounded-3xl">
              <h4 className="text-xl font-heading font-bold mb-4 flex items-center space-x-3">
                 <Icon name="Search" className="text-primary" size={24} />
                 <span>Transparency</span>
              </h4>
              <p className="text-sm text-muted-foreground">We provide raw cutoff data alongside our predictions, ensuring you always know where our insights come from.</p>
           </div>
           <div className="p-8 bg-muted/20 border border-border rounded-3xl">
              <h4 className="text-xl font-heading font-bold mb-4 flex items-center space-x-3">
                 <Icon name="ShieldCheck" className="text-primary" size={24} />
                 <span>Integrity</span>
              </h4>
              <p className="text-sm text-muted-foreground">Our results are unbiased and based strictly on historical trends and verifiable counseling statistics.</p>
           </div>
           <div className="p-8 bg-muted/20 border border-border rounded-3xl">
              <h4 className="text-xl font-heading font-bold mb-4 flex items-center space-x-3">
                 <Icon name="Users" className="text-primary" size={24} />
                 <span>Community</span>
              </h4>
              <p className="text-sm text-muted-foreground">Building a safe space for millions of Indian students to share their counseling experiences and support each other.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default About;
