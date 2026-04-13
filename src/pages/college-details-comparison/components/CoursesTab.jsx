import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CoursesTab = ({ college }) => {
  const [selectedBranch, setSelectedBranch] = useState(null);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(selectedBranch?.id === branch?.id ? null : branch);
  };

  return (
    <div className="space-y-6">
      {/* Course Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {college?.courseCategories?.map((category, index) => (
          <div key={index} className="bg-muted rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name={category?.icon} size={20} className="text-primary" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-foreground">{category?.name}</h4>
                <p className="text-sm text-muted-foreground">{category?.duration}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{category?.description}</p>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Branches: {category?.branchCount}</span>
              <span className="text-muted-foreground">Total Seats: {category?.totalSeats}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Available Branches */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Available Branches
        </h3>
        <div className="space-y-3">
          {college?.branches?.map((branch) => (
            <div key={branch?.id} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => handleBranchSelect(branch)}
                className="w-full p-4 text-left hover:bg-muted transition-smooth"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-heading font-medium text-foreground">
                        {branch?.name}
                      </h4>
                      <span className="text-sm text-muted-foreground">
                        ({branch?.code})
                      </span>
                    </div>
                    <div className="flex items-center space-x-6 mt-2 text-sm text-muted-foreground">
                      <span>Duration: {branch?.duration}</span>
                      <span>Total Seats: {branch?.totalSeats}</span>
                      <span>Available: {branch?.availableSeats}</span>
                    </div>
                  </div>
                  <Icon 
                    name={selectedBranch?.id === branch?.id ? "ChevronUp" : "ChevronDown"} 
                    size={20} 
                    className="text-muted-foreground"
                  />
                </div>
              </button>
              
              {selectedBranch?.id === branch?.id && (
                <div className="px-4 pb-4 border-t border-border bg-muted/50">
                  <div className="pt-4 space-y-4">
                    {/* Seat Distribution */}
                    <div>
                      <h5 className="font-heading font-medium text-sm text-foreground mb-2">
                        Seat Distribution
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(branch?.seatDistribution)?.map(([category, seats]) => (
                          <div key={category} className="text-center p-2 bg-card rounded">
                            <div className="font-mono font-semibold text-foreground">{seats}</div>
                            <div className="text-xs text-muted-foreground uppercase">{category}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Eligibility */}
                    <div>
                      <h5 className="font-heading font-medium text-sm text-foreground mb-2">
                        Eligibility Criteria
                      </h5>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {branch?.eligibility?.map((criteria, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Icon name="Check" size={16} className="text-success mt-0.5 flex-shrink-0" />
                            <span>{criteria}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Curriculum Highlights */}
                    <div>
                      <h5 className="font-heading font-medium text-sm text-foreground mb-2">
                        Curriculum Highlights
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {branch?.curriculumHighlights?.map((highlight, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        iconName="ExternalLink"
                        iconPosition="right"
                      >
                        View Detailed Syllabus
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Admission Process */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Admission Process
        </h3>
        <div className="bg-muted rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {college?.admissionProcess?.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-primary-foreground font-bold">{index + 1}</span>
                </div>
                <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                  {step?.title}
                </h4>
                <p className="text-xs text-muted-foreground">{step?.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursesTab;