import React, { useState } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';

const HelpSupport = () => {
  const { user } = useAuth();
  const [activeFaq, setActiveFaq] = useState(null);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    email: user?.email || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      id: 1,
      question: "How accurate are the college predictions?",
      answer: "Our predictions are based on the latest cutoff trends from the last 5 years, normalized across categories. While highly accurate (approx. 90-95% for top colleges), they should be used as a guide alongside official counseling information."
    },
    {
      id: 2,
      question: "What is the difference between opening and closing ranks?",
      answer: "Opening rank is the rank of the first student admitted to a branch, while closing rank is the rank of the last student admitted. Closing ranks are usually the key indicator for your chances of admission."
    },
    {
      id: 3,
      question: "How do I update my exam rank?",
      answer: "You can update your exam rank in Profile Settings. Once updated, all your predictions across the dashboard will automatically reflect the new chances based on your current rank."
    },
    {
      id: 4,
      question: "Can I download the prediction reports?",
      answer: "Yes, once you've generated a prediction list, you can use the 'Export PDF' button on the results page to download a detailed report of your admission chances."
    },
    {
      id: 5,
      question: "Is my personal data shared with colleges?",
      answer: "By default, no. We only share anonymized statistics. You can opt-in to share your profile with recruiters and colleges in your Preferences page if you wish."
    }
  ];

  const categories = [
    { icon: 'Search', title: 'Admissions FAQ', description: 'Common questions about cutoffs and counseling' },
    { icon: 'FileText', title: 'Documentation', description: 'Step-by-step guides for using the predictor' },
    { icon: 'ShieldCheck', title: 'Security & Privacy', description: 'How we protect your data and account' },
    { icon: 'LifeBuoy', title: 'Direct Support', description: 'Connect with our team for personalized help' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ subject: '', message: '', email: user?.email || '' });
      setTimeout(() => setSubmitted(false), 5000);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-12 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6 shadow-glow-sm">
              <Icon name="LifeBuoy" size={32} className="text-primary" />
            </div>
            <h1 className="font-heading font-bold text-3xl lg:text-4xl text-foreground mb-4">
              How can we help you?
            </h1>
            <p className="text-xl text-muted-foreground">
              Search our help center or contact our support team for any queries
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {categories.map((cat, idx) => (
              <div key={idx} className="bg-card border border-border p-6 rounded-2xl hover:shadow-card transition-all cursor-pointer group">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <Icon name={cat.icon} size={24} />
                </div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-2">{cat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* FAQ Section */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="font-heading font-bold text-2xl text-foreground mb-8">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
                      <button 
                        onClick={() => setActiveFaq(activeFaq === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/30 transition-colors"
                      >
                        <span className="font-medium text-foreground">{faq.question}</span>
                        <div className={`transition-transform duration-300 ${activeFaq === faq.id ? 'rotate-180' : ''}`}>
                          <Icon name="ChevronDown" size={20} className="text-muted-foreground" />
                        </div>
                      </button>
                      <div className={`transition-all duration-300 overflow-hidden ${activeFaq === faq.id ? 'max-h-48' : 'max-h-0'}`}>
                        <div className="p-5 pt-0 text-muted-foreground leading-relaxed border-t border-border/50">
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border p-8 rounded-2xl shadow-modal sticky top-24">
                <h3 className="font-heading font-bold text-xl text-foreground mb-6">
                  Send us a message
                </h3>
                {submitted ? (
                  <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                    <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon name="Check" size={40} className="text-success" />
                    </div>
                    <h4 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h4>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Thank you for reaching out. Our support team will respond to your email within 24-48 hours.
                    </p>
                    <Button variant="outline" fullWidth onClick={() => setSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Your Email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <Input
                      label="Subject"
                      placeholder="What do you need help with?"
                      value={formData.subject}
                      onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                      required
                    />
                    <div className="space-y-1.5">
                      <label className="block font-heading font-medium text-sm text-foreground">Message</label>
                      <textarea
                        className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-muted-foreground min-h-[120px]"
                        placeholder="Please describe your issue in detail..."
                        value={formData.message}
                        onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button 
                      variant="primary" 
                      type="submit" 
                      fullWidth 
                      loading={isSubmitting}
                      iconName="Send"
                      iconPosition="right"
                    >
                      Send Message
                    </Button>
                  </form>
                )}

                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="font-heading font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-4">
                    Other Support Channels
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="w-8 h-8 bg-sky-500/10 text-sky-500 rounded-lg flex items-center justify-center">
                        <Icon name="Twitter" size={16} />
                      </div>
                      <span className="text-foreground">@AdmissionPredict</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-foreground">
                      <div className="w-8 h-8 bg-black/10 text-foreground rounded-lg flex items-center justify-center">
                        <Icon name="Github" size={16} />
                      </div>
                      <span>Report an Issue</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-foreground">
                      <div className="w-8 h-8 bg-indigo-500/10 text-indigo-500 rounded-lg flex items-center justify-center">
                        <Icon name="MessageSquare" size={16} />
                      </div>
                      <span>Community Discord</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
