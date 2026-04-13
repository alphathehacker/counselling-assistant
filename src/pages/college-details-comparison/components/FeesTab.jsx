import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const FeesTab = ({ college }) => {
  const [selectedCategory, setSelectedCategory] = useState('btech');

  const categories = [
    { id: 'btech', label: 'B.Tech', icon: 'Cpu' },
    { id: 'mtech', label: 'M.Tech', icon: 'GraduationCap' },
    { id: 'phd', label: 'Ph.D', icon: 'BookOpen' }
  ];

  const currentFees = college?.feeStructure?.[selectedCategory] || {};

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="flex flex-wrap gap-2">
        {categories?.map((category) => (
          <button
            key={category?.id}
            onClick={() => setSelectedCategory(category?.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-smooth ${
              selectedCategory === category?.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={category?.icon} size={16} />
            <span className="font-medium">{category?.label}</span>
          </button>
        ))}
      </div>
      {/* Fee Breakdown */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          {categories?.find(c => c?.id === selectedCategory)?.label} Fee Structure
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Academic Fees */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading font-medium text-foreground mb-4 flex items-center space-x-2">
              <Icon name="BookOpen" size={20} className="text-primary" />
              <span>Academic Fees (Annual)</span>
            </h4>
            <div className="space-y-3">
              {currentFees?.academic?.map((fee, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <span className="text-muted-foreground">{fee?.component}</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{fee?.amount?.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-t-2 border-primary font-semibold">
                <span className="text-foreground">Academic Total</span>
                <span className="font-mono text-primary">
                  ₹{currentFees?.academic?.reduce((sum, fee) => sum + fee?.amount, 0)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Hostel & Mess Fees */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="font-heading font-medium text-foreground mb-4 flex items-center space-x-2">
              <Icon name="Home" size={20} className="text-secondary" />
              <span>Hostel & Mess Fees (Annual)</span>
            </h4>
            <div className="space-y-3">
              {currentFees?.hostel?.map((fee, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-border last:border-b-0">
                  <span className="text-muted-foreground">{fee?.component}</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{fee?.amount?.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center py-2 border-t-2 border-secondary font-semibold">
                <span className="text-foreground">Hostel Total</span>
                <span className="font-mono text-secondary">
                  ₹{currentFees?.hostel?.reduce((sum, fee) => sum + fee?.amount, 0)?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Cost Summary */}
        <div className="bg-muted rounded-lg p-4 mt-6">
          <h4 className="font-heading font-semibold text-foreground mb-3">
            Total Annual Cost Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-card rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                ₹{(currentFees?.academic?.reduce((sum, fee) => sum + fee?.amount, 0) || 0)?.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Academic Fees</div>
            </div>
            <div className="text-center p-3 bg-card rounded-lg">
              <div className="text-2xl font-bold text-secondary mb-1">
                ₹{(currentFees?.hostel?.reduce((sum, fee) => sum + fee?.amount, 0) || 0)?.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Hostel & Mess</div>
            </div>
            <div className="text-center p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                ₹{((currentFees?.academic?.reduce((sum, fee) => sum + fee?.amount, 0) || 0) + (currentFees?.hostel?.reduce((sum, fee) => sum + fee?.amount, 0) || 0))?.toLocaleString()}
              </div>
              <div className="text-sm text-primary">Total Annual Cost</div>
            </div>
          </div>
        </div>
      </div>
      {/* Scholarships */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Available Scholarships
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {college?.scholarships?.map((scholarship, index) => (
            <div key={index} className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Award" size={20} className="text-success" />
                </div>
                <div className="flex-1">
                  <h4 className="font-heading font-medium text-foreground mb-1">
                    {scholarship?.name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {scholarship?.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-success">
                      Up to {scholarship?.amount}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {scholarship?.eligibility}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Payment Options */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          Payment Options & Policies
        </h3>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-heading font-medium text-foreground mb-3 flex items-center space-x-2">
                <Icon name="CreditCard" size={20} className="text-primary" />
                <span>Payment Methods</span>
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {college?.paymentMethods?.map((method, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Icon name="Check" size={16} className="text-success" />
                    <span>{method}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-heading font-medium text-foreground mb-3 flex items-center space-x-2">
                <Icon name="Calendar" size={20} className="text-secondary" />
                <span>Important Dates</span>
              </h4>
              <div className="space-y-2 text-sm">
                {college?.feeDeadlines?.map((deadline, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-muted-foreground">{deadline?.event}</span>
                    <span className="font-medium text-foreground">{deadline?.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fee Calculator */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
          4-Year Cost Calculator
        </h3>
        <div className="bg-muted rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-heading font-medium text-foreground mb-3">
                Estimated Total Cost (4 Years)
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Academic Fees (4 years):</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{((currentFees?.academic?.reduce((sum, fee) => sum + fee?.amount, 0) || 0) * 4)?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Hostel & Mess (4 years):</span>
                  <span className="font-mono font-semibold text-foreground">
                    ₹{((currentFees?.hostel?.reduce((sum, fee) => sum + fee?.amount, 0) || 0) * 4)?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Miscellaneous (estimated):</span>
                  <span className="font-mono font-semibold text-foreground">₹50,000</span>
                </div>
                <div className="border-t border-border pt-2 mt-3">
                  <div className="flex justify-between items-center font-semibold">
                    <span className="text-foreground">Total 4-Year Cost:</span>
                    <span className="font-mono text-xl text-primary">
                      ₹{(((currentFees?.academic?.reduce((sum, fee) => sum + fee?.amount, 0) || 0) * 4) + 
                         ((currentFees?.hostel?.reduce((sum, fee) => sum + fee?.amount, 0) || 0) * 4) + 50000)?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                className="w-full md:w-auto"
              >
                Download Fee Structure PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeesTab;