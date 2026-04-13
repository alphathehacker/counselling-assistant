import React, { useState, useEffect } from 'react';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { notificationAPI } from '../../utils/api';
import { Link } from 'react-router-dom';

const CounselingUpdates = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('apeapcet');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAiNotifications();
      if (res.data?.success) setNotifications(res.data.notifications || []);
    } catch (err) { console.error('Failed updates:', err); }
    finally { setLoading(false); }
  };

  const counselingData = {
    apeapcet: {
      name: "AP EAPCET",
      desc: "Engineering & Pharmacy (State Level)",
      link: "https://eapcet-sche.aptonline.in/",
      steps: ["Fee Payment", "Online Verification", "Web Options Entry", "Seat Allotment", "College Reporting"],
      docs: ["Hall Ticket", "Rank Card", "10+2 Marks Memo", "Study Certs (6-12)", "TC", "Caste/Income Certs"],
      mode: "Primarily ONLINE. Physical visit only if online verification fails or for Special Categories."
    },
    apecet: {
      name: "AP ECET",
      desc: "Lateral Entry (Diploma holders)",
      link: "https://ecet-sche.aptonline.in/",
      steps: ["Registration", "Certificate Verification", "Login Generation", "Web Options", "Seat Allotment"],
      docs: ["ECET Hall Ticket & Rank Card", "Diploma Provisional & Marks Memo", "SSC Memo", "Residence Proof"],
      mode: "Online Web-based counseling with offline verification for PH/NCC/Sports categories."
    },
    jee_josaa: {
      name: "JoSAA (JEE)",
      desc: "NITs, IIITs, GFTIs (All India)",
      link: "https://josaa.nic.in/",
      steps: ["Registration", "Choice Filling & Locking", "Mock Allotment", "6 Rounds of Allotment", "Acceptance Fee"],
      docs: ["JEE Main/Adv Admit Card", "Class 10/12 Pass Cert", "Medical Cert", "Category Cert (OBC/SC/ST)"],
      mode: "100% ONLINE Document Verification. Reporting is only physical at the final college."
    },
    neet: {
      name: "NEET UG",
      desc: "Medical & Dental Admissions",
      link: "https://mcc.nic.in/",
      steps: ["MCC Registration", "Choice Filling", "Seat Allotment Rounds", "Allotment Letter", "Physical Reporting"],
      docs: ["NEET Admit Card & Score Card", "10th/12th Marks Memo", "8 Photos", "ID Proof (Aadhar)"],
      mode: "Registration is Online. MANDATORY physical reporting at college for verification."
    }
  };

  const formatTime = (d) => {
    const diff = (new Date() - new Date(d)) / 60000;
    if (diff < 60) return `${Math.max(0, Math.floor(diff))}m ago`;
    if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
    return `${Math.floor(diff/1440)}d ago`;
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
           <Link to="/student-dashboard" className="text-primary font-bold text-sm flex items-center hover:underline mb-4">
              <Icon name="ArrowLeft" size={16} className="mr-2" /> Back
           </Link>
           <h1 className="text-4xl lg:text-5xl font-heading font-black text-foreground">Counseling <span className="text-gradient">Hub</span></h1>
           <p className="text-muted-foreground mt-2">Comprehensive guides and important updates for all major entrance exams.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 border border-border bg-card rounded-3xl p-6 shadow-glow-sm">
              <h2 className="text-xl font-heading font-bold mb-6 flex items-center space-x-2">
                 <Icon name="Bell" size={20} className="text-primary" />
                 <span>Important Updates</span>
              </h2>
                 <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                    {loading ? (
                       <div className="animate-pulse space-y-4">
                          {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
                       </div>
                    ) : (
                      <>
                        {/* Merged List of Notifications */}
                        {notifications.map((n, idx) => (
                          <div key={idx} className={`p-4 border rounded-2xl transition-all duration-300 ${!n.read ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-muted/10 border-border opacity-80'}`}>
                             <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                   <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${n.priority === 'high' ? 'bg-error text-white' : 'bg-primary text-white'}`}>
                                      {n.priority || 'Update'}
                                   </span>
                                   {n.isAi && <span className="flex items-center text-[8px] font-bold text-primary uppercase border border-primary/20 px-1.5 py-0.5 rounded bg-primary/5"><Icon name="Sparkles" size={8} className="mr-1" /> AI Agent</span>}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium uppercase">{formatTime(n.date)}</span>
                             </div>
                             <h4 className="text-sm font-bold text-foreground mb-1 leading-snug">{n.title}</h4>
                             <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{n.message}</p>
                             <div className="mt-3 flex items-center space-x-2 text-[10px] text-muted-foreground/60 font-bold">
                                <Icon name="Calendar" size={12} />
                                <span>{new Date(n.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                             </div>
                          </div>
                        ))}
                        
                        {/* Static historical examples as fallbacks or supplementary */}
                        {[
                          { title: 'EAPCET Counseling Registration', msg: 'Registration for EAPCET counseling starts tomorrow. Don\'t miss the deadline!', date: '2025-08-13', p: 'high' },
                          { title: 'JEE Main Cutoff Updated', msg: 'Latest cutoff data for Round 2 counseling has been updated in our database.', date: '2025-08-12', p: 'medium' },
                          { title: 'New Feature: College Comparison', msg: 'Compare up to 4 colleges side by side with our new comparison tool.', date: '2025-08-11', p: 'low' }
                        ].map((n, i) => (
                           <div key={`hist-${i}`} className="p-4 bg-muted/20 border border-border rounded-2xl opacity-60 hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-between mb-2">
                                 <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded text-[8px] font-bold uppercase tracking-widest">{n.p}</span>
                                 <span className="text-[10px] text-muted-foreground/60 font-bold uppercase uppercase">Aug 2025</span>
                              </div>
                              <h4 className="text-sm font-bold text-foreground mb-1 leading-snug">{n.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.msg}</p>
                              <div className="mt-3 flex items-center space-x-2 text-[10px] text-muted-foreground/60 font-bold">
                                <Icon name="Calendar" size={12} />
                                <span>{n.date}</span>
                             </div>
                           </div>
                        ))}
                      </>
                    )}
                 </div>
              </div>

           <div className="lg:col-span-2 space-y-8">
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                 <div className="flex bg-muted/20 border-b border-border overflow-x-auto no-scrollbar">
                    {Object.entries(counselingData).map(([key, val]) => (
                       <button key={key} onClick={() => setActiveTab(key)} className={`px-6 py-4 text-xs font-bold tracking-widest uppercase transition-all ${activeTab === key ? 'bg-card text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>{val.name}</button>
                    ))}
                 </div>
                 <div className="p-8 animate-in fade-in duration-500">
                    <div className="flex justify-between items-start mb-8">
                       <div>
                          <h2 className="text-2xl font-bold">{counselingData[activeTab].name} Counseling</h2>
                          <p className="text-xs text-muted-foreground font-bold uppercase mt-1">{counselingData[activeTab].desc}</p>
                       </div>
                       <a href={counselingData[activeTab].link} target="_blank" rel="noreferrer"><Button variant="outline" size="sm" iconName="ExternalLink">Portal</Button></a>
                    </div>
                    <div className="grid md:grid-cols-2 gap-10">
                       <div>
                          <h3 className="text-sm font-bold mb-4 flex items-center text-primary"><Icon name="ListChecks" size={16} className="mr-2"/> Procedure</h3>
                          <div className="space-y-3">
                             {counselingData[activeTab].steps.map((s, i) => (
                                <div key={i} className="flex items-center text-xs p-3 bg-muted/10 rounded-xl border border-border/50">
                                   <span className="w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center text-[8px] mr-3 font-bold">{i+1}</span>
                                   {s}
                                </div>
                             ))}
                          </div>
                       </div>
                       <div>
                          <h3 className="text-sm font-bold mb-4 flex items-center text-primary"><Icon name="Files" size={16} className="mr-2"/> Checklist</h3>
                          <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-2">
                             {counselingData[activeTab].docs.map((d, i) => (
                                <div key={i} className="flex items-center text-xs text-foreground"><Icon name="Check" size={14} className="text-success mr-2"/> {d}</div>
                             ))}
                          </div>
                          <div className="mt-6 p-4 bg-muted/10 rounded-xl border border-border">
                             <p className="text-[10px] text-muted-foreground italic"><strong className="text-foreground not-italic mr-1">Mode:</strong> {counselingData[activeTab].mode}</p>
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

export default CounselingUpdates;
