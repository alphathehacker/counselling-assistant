import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const RelatedColleges = ({ colleges, onCollegeSelect }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center space-x-2">
        <Icon name="Lightbulb" size={20} className="text-primary" />
        <span>Similar Colleges You Might Like</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colleges?.map((college, index) => (
          <div key={index} className="bg-muted rounded-lg p-4 hover:shadow-card transition-smooth">
            <div className="flex items-start space-x-3 mb-3">
              <Image
                src={college?.logo}
                alt={`${college?.name} logo`}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-heading font-medium text-foreground truncate">
                  {college?.name}
                </h4>
                <p className="text-sm text-muted-foreground">{college?.location}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">NIRF Ranking:</span>
                <span className="font-medium text-foreground">#{college?.ranking}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cutoff (Gen):</span>
                <span className="font-medium text-foreground">{college?.cutoff?.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Avg Package:</span>
                <span className="font-medium text-foreground">₹{college?.avgPackage}L</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCollegeSelect(college?.id)}
                className="flex-1"
              >
                View Details
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
              >
                <Icon name="Bookmark" size={16} />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-6">
        <Button variant="outline">
          View More Similar Colleges
        </Button>
      </div>
    </div>
  );
};

export default RelatedColleges;