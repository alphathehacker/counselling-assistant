import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressIndicator = ({ currentStep, totalSteps, steps, className = "" }) => {
  return (
    <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-medium text-sm text-foreground">
          Prediction Progress
        </h3>
        <span className="text-xs text-muted-foreground">
          {currentStep} of {totalSteps} completed
        </span>
      </div>
      <div className="space-y-3">
        {steps?.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={step?.id} className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                isCompleted 
                  ? 'bg-success text-success-foreground' 
                  : isCurrent 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
              }`}>
                {isCompleted ? (
                  <Icon name="Check" size={12} />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  isCompleted || isCurrent 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
                }`}>
                  {step?.title}
                </p>
                {step?.description && (
                  <p className="text-xs text-muted-foreground">
                    {step?.description}
                  </p>
                )}
              </div>
              {isCompleted && (
                <Icon name="CheckCircle" size={16} className="text-success" />
              )}
              {isCurrent && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
      {/* Progress Bar */}
      <div className="mt-4 px-1 pb-1">
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ProgressIndicator;