import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

const APIDocs = () => {
  const [activeTab, setActiveTab] = useState('getting-started');

  const navItems = [
    { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
    { id: 'authentication', label: 'Authentication', icon: 'Lock' },
    { id: 'endpoints', label: 'API Endpoints', icon: 'Layers' },
    { id: 'rate-limiting', label: 'Rate Limiting', icon: 'Activity' },
    { id: 'errors', label: 'Error Codes', icon: 'AlertTriangle' }
  ];

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        {/* Header Section */}
        <div className="mb-20 text-center max-w-4xl mx-auto overflow-hidden">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold tracking-widest uppercase mb-6 animate-in slide-in-from-bottom duration-700">
            Developer API
          </div>
          <h1 className="text-4xl lg:text-6xl font-heading font-black text-foreground mb-6 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
            Build with Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">AI Prediction Data</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Integrate our admission prediction engine and college database directly into your educational portal or school management system.
          </p>
        </div>

        {/* API Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20 items-stretch">
          {/* Sidebar Nav */}
          <div className="lg:col-span-1 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-glow-sm' 
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                <Icon name={item.icon} size={18} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Docs Content */}
          <div className="lg:col-span-3 bg-card border border-border rounded-3xl p-8 lg:p-12 shadow-sm animate-in fade-in delay-200 duration-500">
            {activeTab === 'getting-started' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold mb-6">Introduction to Counselling API</h2>
                <p className="text-muted-foreground leading-relaxed">
                  The Counselling Assistant API provides a suite of programmatic interfaces to fetch college data, 
                  access cutoff statistics, and run admission predictions for individual students at scale.
                </p>
                <div className="p-6 bg-muted/30 border border-border rounded-2xl">
                  <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                    <Icon name="CheckCircle" size={18} className="text-success" />
                    <span>Key Features</span>
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <li>Real-time seat allotment updates</li>
                    <li>Historical last-rank data (5+ years)</li>
                    <li>Multivariate admission probability</li>
                    <li>Automated counseling schedules</li>
                  </ul>
                </div>
                <div className="mt-8">
                  <h3 className="font-bold text-lg mb-4">Base URL</h3>
                  <code className="block p-4 bg-muted border border-border rounded-xl font-mono text-sm break-all">
                    https://api.admissionpredictor.com/v1/
                  </code>
                </div>
              </div>
            )}

            {activeTab === 'authentication' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold mb-6 underline decoration-primary/30">Authentication</h2>
                <p className="text-muted-foreground">
                  Our API uses API Keys to authenticate requests. You can view and manage your API keys in the 
                  <span className="text-primary font-bold"> Dashboard Settings</span>.
                </p>
                <div className="p-6 bg-muted/30 border border-border rounded-2xl">
                  <p className="text-sm text-muted-foreground mb-4">Include your secret key in every request as a bearer token:</p>
                  <code className="block p-4 bg-gray-900 text-gray-100 rounded-xl font-mono text-sm">
                    Authorization: Bearer YOUR_API_KEY
                  </code>
                </div>
              </div>
            )}

            {activeTab === 'endpoints' && (
              <div className="space-y-8">
                <h2 className="text-2xl font-heading font-bold mb-6 underline decoration-primary/30">Endpoints</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/20 border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">GET</span>
                      <code className="text-sm font-bold text-foreground">/colleges</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Returns a list of all colleges matching optional search params.</p>
                  </div>
                  <div className="p-4 bg-muted/20 border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">POST</span>
                      <code className="text-sm font-bold text-foreground">/predict</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Generates a list of predicted colleges for a given rank and category.</p>
                  </div>
                  <div className="p-4 bg-muted/20 border border-border rounded-xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">GET</span>
                      <code className="text-sm font-bold text-foreground">/colleges/:id/cutoffs</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Fetches detailed historical cutoff ranks for a specific college.</p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'rate-limiting' && (
               <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold mb-6 underline decoration-primary/30">Rate Limiting</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We enforce rate limits to ensure stability across our API ecosystem. 
                  Rate limits are applied based on your current tier.
                </p>
                <ul className="list-disc pl-8 space-y-4 text-muted-foreground">
                   <li><strong>Free Tier</strong>: 100 requests / day</li>
                   <li><strong>Pro Student</strong>: 10,000 requests / day</li>
                   <li><strong>Institutional</strong>: 500,000 requests / day</li>
                </ul>
              </div>
            )}

            {activeTab === 'errors' && (
               <div className="space-y-6">
                <h2 className="text-2xl font-heading font-bold mb-6 underline decoration-primary/30">Error Codes</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Counselling Assistant uses conventional HTTP response codes to indicate the success or failure of an API request.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center space-x-3">
                      <span className="text-success font-bold">200</span>
                      <span className="text-xs text-muted-foreground">Success</span>
                   </div>
                   <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center space-x-3">
                      <span className="text-error font-bold">401</span>
                      <span className="text-xs text-muted-foreground">Unauthorized</span>
                   </div>
                   <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center space-x-3">
                      <span className="text-warning font-bold">429</span>
                      <span className="text-xs text-muted-foreground">Too Many Requests</span>
                   </div>
                   <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center space-x-3">
                      <span className="text-error font-bold">500</span>
                      <span className="text-xs text-muted-foreground">Server Error</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Support Section */}
        <div className="p-12 bg-secondary/5 rounded-3xl border border-secondary/10 flex flex-col md:flex-row items-center justify-between text-center md:text-left shadow-sm">
          <div>
            <h2 className="text-2xl font-heading font-bold mb-2">Need a custom integration?</h2>
            <p className="text-muted-foreground opacity-80 mb-6 md:mb-0">
              Our engineering team can assist you with complex setups or private deployments for large educational groups.
            </p>
          </div>
          <Button variant="primary" size="lg" iconName="Mail" className="px-10">
            Contact Developers
          </Button>
        </div>
      </div>
    </div>
  );
};

export default APIDocs;
