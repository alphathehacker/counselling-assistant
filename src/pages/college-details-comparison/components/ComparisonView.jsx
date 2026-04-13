import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ComparisonView = ({ colleges, onClose, onRemoveCollege }) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [isExporting, setIsExporting] = useState(false);

  const sections = [
    { id: 'overview', label: 'Overview', icon: 'Info' },
    { id: 'rankings', label: 'Rankings', icon: 'Trophy' },
    { id: 'courses', label: 'Courses', icon: 'BookOpen' },
    { id: 'cutoffs', label: 'Cutoffs', icon: 'TrendingUp' },
    { id: 'fees', label: 'Fees', icon: 'DollarSign' },
    { id: 'placements', label: 'Placements', icon: 'Briefcase' },
    { id: 'infrastructure', label: 'Infrastructure', icon: 'Building' },
    { id: 'location', label: 'Location', icon: 'MapPin' }
  ];

  const getDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    return value;
  };

  const renderComparisonRow = (label, getValue, highlight = false, formatter = (v) => v) => (
    <div className={`grid grid-cols-${colleges?.length + 1} gap-4 py-3 border-b border-border ${highlight ? 'bg-muted/50' : ''}`}>
      <div className="font-medium text-foreground">{label}</div>
      {colleges?.map((college, index) => (
        <div key={index} className="text-center">
          {formatter(getValue(college))}
        </div>
      ))}
    </div>
  );

  const getBestValue = (colleges, getValue, isHigherBetter = true) => {
    const values = colleges?.map(getValue).filter(v => v !== 'N/A' && v !== undefined && v !== null);
    if (values.length === 0) return null;
    return isHigherBetter ? Math.max(...values) : Math.min(...values);
  };

  const renderValueWithHighlight = (value, bestValue, formatter = (v) => v) => {
    if (value === 'N/A' || value === undefined || value === null) {
      return <span className="text-muted-foreground">{value}</span>;
    }
    const isHighlighted = bestValue !== null && value === bestValue;
    return (
      <span className={isHighlighted ? 'font-semibold text-success' : 'text-foreground'}>
        {formatter(value)}
      </span>
    );
  };

  const formatLocation = (college) => {
    const location = college?.location;
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return `${location?.city || ''}, ${location?.state || ''}`.trim() || 'N/A';
    }
    return 'N/A';
  };

  const formatFees = (college) => {
    const fees = college?.fees || {};
    const totalFee = Object.values(fees).reduce((sum, value) => sum + (Number(value) || 0), 0);
    return totalFee > 0 ? `₹${totalFee.toLocaleString()}` : 'N/A';
  };

  const formatPlacements = (college) => {
    const placements = college?.placements || {};
    const avgPackage = placements.averagePackage || 0;
    return avgPackage > 0 ? `₹${(avgPackage / 100000).toFixed(1)}L` : 'N/A';
  };

  const handleExportPdf = () => {
    setIsExporting(true);

    // Give React a moment to render all hidden sections
    setTimeout(async () => {
      try {
        const element = document.getElementById('comparison-export-content');
        if (!element) return;

        // Dynamically import so it doesn't slow down initial page load
        const html2pdf = (await import('html2pdf.js')).default;

        const opt = {
          margin: 0.3,
          filename: 'College_Comparison_Report.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        await html2pdf().set(opt).from(element).save();
      } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF. Please try again.');
      } finally {
        setIsExporting(false);
      }
    }, 250); // 250ms is plenty for React to patch the DOM before snapshotting
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'College Comparison',
          url: url
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url)
        .then(() => alert('Link copied to clipboard!'))
        .catch(() => alert('Failed to copy link.'));
    }
  };

  return (
    <div className="fixed inset-0 z-400 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="print:hidden"
            >
              <Icon name="ArrowLeft" size={20} />
            </Button>
            <h2 className="font-heading font-semibold text-xl text-foreground">
              College Comparison
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Download"
              iconPosition="left"
              onClick={handleExportPdf}
              className="print:hidden"
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              iconName="Share2"
              iconPosition="left"
              onClick={handleShare}
              className="print:hidden"
            >
              Share
            </Button>
          </div>
        </div>
      </div>
      <div className="flex h-[calc(100vh-80px)] print:h-auto">
        {/* Sidebar Navigation */}
        <div className="w-64 bg-card border-r border-border p-4 print:hidden">
          <nav className="space-y-2">
            {sections?.map((section) => (
              <button
                key={section?.id}
                onClick={() => setActiveSection(section?.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-smooth ${activeSection === section?.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <Icon name={section?.icon} size={16} />
                <span className="font-medium">{section?.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div id="comparison-export-content" className={`flex-1 p-6 print:p-0 bg-background ${isExporting ? 'h-auto overflow-visible' : 'overflow-y-auto'}`}>
          {/* College Headers */}
          <div className={`grid grid-cols-${colleges?.length + 1} gap-4 mb-6`}>
            <div></div>
            {colleges?.map((college, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-4 text-center">
                <div className="relative">
                  <button
                    onClick={() => onRemoveCollege && onRemoveCollege(college?._id || college?.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-error text-error-foreground rounded-full flex items-center justify-center text-xs hover:bg-error/80 transition-smooth print:hidden"
                  >
                    <Icon name="X" size={12} />
                  </button>
                  <Image
                    src={college?.logo || college?.imageUrl}
                    alt={`${college?.name} logo`}
                    className="w-16 h-16 object-cover rounded-lg mx-auto mb-3"
                  />
                  <h3 className="font-heading font-semibold text-foreground mb-1">
                    {college?.shortName || college?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{formatLocation(college)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Content */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className={`p-4 ${activeSection === 'overview' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Basic Information
                </h3>
                {renderComparisonRow('College Name', (college) => getDisplayValue(college?.name))}
                {renderComparisonRow('Short Name', (college) => getDisplayValue(college?.shortName))}
                {renderComparisonRow('Type', (college) => getDisplayValue(college?.collegeType || college?.type))}
                {renderComparisonRow('Established', (college) => getDisplayValue(college?.established))}
                {renderComparisonRow('Affiliation', (college) => getDisplayValue(college?.affiliation))}
                {renderComparisonRow('Campus Area', (college) => getDisplayValue(college?.campusArea))}
                {renderComparisonRow('Website', (college) =>
                  college?.website ? (
                    <a href={college.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Visit Website
                    </a>
                  ) : 'N/A'
                )}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'rankings' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Rankings Comparison
                </h3>
                {renderComparisonRow(
                  'NIRF Ranking',
                  (college) => {
                    const nirfRank = college?.rankings?.nirf || college?.ranking?.nirf;
                    const bestRank = getBestValue(colleges, (c) => c?.rankings?.nirf || c?.ranking?.nirf || 999, false);
                    return renderValueWithHighlight(
                      nirfRank || 'N/A',
                      bestRank,
                      (v) => v === 'N/A' ? v : `#${v}`
                    );
                  }
                )}
                {renderComparisonRow('Overall Rating', (college) => {
                  const rating = college?.overallRating;
                  return rating ? `${rating}/5` : 'N/A';
                })}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'courses' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Courses & Branches
                </h3>
                {renderComparisonRow('Total Courses', (college) => {
                  const courses = college?.courses || college?.branches || [];
                  return courses.length || 'N/A';
                })}
                {renderComparisonRow('Popular Branches', (college) => {
                  const branches = college?.branches || college?.courses || [];
                  if (branches.length === 0) return 'N/A';
                  return (
                    <div className="text-sm">
                      {branches.slice(0, 3).map((branch, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          {typeof branch === 'string' ? branch : branch.name}
                        </div>
                      ))}
                      {branches.length > 3 && <div className="text-muted-foreground">+{branches.length - 3} more</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'cutoffs' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Admission Cutoffs
                </h3>
                {renderComparisonRow('Cutoff Information', (college) => {
                  try {
                    const cutoffs = college?.cutoffs;
                    if (!cutoffs) return 'N/A';

                    // Handle different cutoff data structures
                    if (Array.isArray(cutoffs)) {
                      // If cutoffs is an array, show first few items
                      if (cutoffs.length === 0) return 'N/A';
                      return (
                        <div className="text-sm max-h-32 overflow-y-auto">
                          {cutoffs.slice(0, 3).map((cutoff, idx) => (
                            <div key={idx} className="text-muted-foreground">
                              {cutoff.category || cutoff.examType || 'General'}: {cutoff.closingRank || cutoff.rank || cutoff.value || 'N/A'}
                            </div>
                          ))}
                          {cutoffs.length > 3 && <div className="text-muted-foreground">+{cutoffs.length - 3} more</div>}
                        </div>
                      );
                    } else if (typeof cutoffs === 'object') {
                      // If cutoffs is an object, show entries
                      const entries = Object.entries(cutoffs);
                      if (entries.length === 0) return 'N/A';

                      return (
                        <div className="text-sm max-h-32 overflow-y-auto">
                          {entries.slice(0, 3).map(([category, value]) => {
                            // Handle different value types
                            let displayValue = 'N/A';
                            if (typeof value === 'object' && value !== null) {
                              displayValue = value.closingRank || value.rank || value.value || JSON.stringify(value);
                            } else {
                              displayValue = value;
                            }

                            return (
                              <div key={category} className="text-muted-foreground">
                                {category}: {displayValue}
                              </div>
                            );
                          })}
                          {entries.length > 3 && <div className="text-muted-foreground">+{entries.length - 3} more</div>}
                        </div>
                      );
                    }

                    return 'N/A';
                  } catch (error) {
                    console.warn('Error displaying cutoffs:', error);
                    return 'Data Error';
                  }
                })}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'fees' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Fee Structure Comparison
                </h3>
                {renderComparisonRow(
                  'Total Annual Fee',
                  (college) => {
                    const fees = college?.fees || {};
                    const totalFee = Object.values(fees).reduce((sum, value) => sum + (Number(value) || 0), 0);
                    const bestFee = getBestValue(
                      colleges,
                      (c) => {
                        const cFees = c?.fees || {};
                        return Object.values(cFees).reduce((sum, value) => sum + (Number(value) || 0), 0) || 999999;
                      },
                      false
                    );
                    return renderValueWithHighlight(
                      totalFee || 'N/A',
                      bestFee,
                      (v) => v === 'N/A' ? v : `₹${v.toLocaleString()}`
                    );
                  }
                )}
                {renderComparisonRow('Tuition Fee', (college) => getDisplayValue(college?.fees?.annualTuitionFee ? `₹${college.fees.annualTuitionFee.toLocaleString()}` : 'N/A'))}
                {renderComparisonRow('Hostel Fee', (college) => getDisplayValue(college?.fees?.annualHostelFee ? `₹${college.fees.annualHostelFee.toLocaleString()}` : 'N/A'))}
                {renderComparisonRow('Mess Fee', (college) => getDisplayValue(college?.fees?.annualMessFee ? `₹${college.fees.annualMessFee.toLocaleString()}` : 'N/A'))}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'placements' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Placement Statistics
                </h3>
                {renderComparisonRow(
                  'Placement Rate',
                  (college) => {
                    const rate = college?.placements?.placementRate || 0;
                    const bestRate = getBestValue(colleges, (c) => c?.placements?.placementRate || 0);
                    return renderValueWithHighlight(
                      rate || 'N/A',
                      bestRate,
                      (v) => v === 'N/A' ? v : `${v}%`
                    );
                  }
                )}
                {renderComparisonRow(
                  'Average Package',
                  (college) => {
                    const avgPackage = college?.placements?.averagePackage || 0;
                    const bestPackage = getBestValue(colleges, (c) => c?.placements?.averagePackage || 0);
                    return renderValueWithHighlight(
                      avgPackage || 'N/A',
                      bestPackage,
                      (v) => v === 'N/A' ? v : (Number(v) >= 10000 ? `₹${(Number(v) / 100000).toFixed(1)}L` : `₹${Number(v).toFixed(1)}L`)
                    );
                  }
                )}
                {renderComparisonRow(
                  'Highest Package',
                  (college) => {
                    const highestPackage = college?.placements?.highestPackage || 0;
                    const bestPackage = getBestValue(colleges, (c) => c?.placements?.highestPackage || 0);
                    return renderValueWithHighlight(
                      highestPackage || 'N/A',
                      bestPackage,
                      (v) => v === 'N/A' ? v : (Number(v) >= 10000 ? `₹${(Number(v) / 100000).toFixed(1)}L` : `₹${Number(v).toFixed(1)}L`)
                    );
                  }
                )}
                {renderComparisonRow('Top Recruiters', (college) => {
                  const recruiters = college?.placements?.topRecruiters || [];
                  if (recruiters.length === 0) return 'N/A';
                  return (
                    <div className="text-sm">
                      {recruiters.slice(0, 3).map((recruiter, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          {recruiter}
                        </div>
                      ))}
                      {recruiters.length > 3 && <div className="text-muted-foreground">+{recruiters.length - 3} more</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'infrastructure' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Infrastructure & Facilities
                </h3>
                {renderComparisonRow('Facilities', (college) => {
                  const facilities = college?.facilities || [];
                  if (facilities.length === 0) return 'N/A';
                  return (
                    <div className="text-sm max-h-32 overflow-y-auto">
                      {facilities.map((facility, idx) => (
                        <div key={idx} className="text-muted-foreground">
                          • {facility}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-4 ${activeSection === 'location' || isExporting ? 'block' : 'hidden print:block print:mb-8'}`}>
              <div className={`${isExporting ? 'border-b border-border pb-2 mb-4' : 'print:border-b print:border-border print:pb-2 print:mb-4'}`}>
                <h3 className={`font-heading font-semibold text-lg text-foreground mb-4 ${isExporting ? 'mb-0' : 'print:mb-0'}`}>
                  Location Details
                </h3>
                {renderComparisonRow('City', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.city);
                  return getDisplayValue(location?.split(',')[0]);
                })}
                {renderComparisonRow('State', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.state);
                  return getDisplayValue(location?.split(',')[1]);
                })}
                {renderComparisonRow('District', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.district);
                  return 'N/A';
                })}
                {renderComparisonRow('Pincode', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.pincode);
                  return 'N/A';
                })}
                {renderComparisonRow('Nearest Railway Station', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.nearestRailway);
                  return 'N/A';
                })}
                {renderComparisonRow('Nearest Bus Stand', (college) => {
                  const location = college?.location;
                  if (typeof location === 'object') return getDisplayValue(location?.nearestBusStand);
                  return 'N/A';
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;