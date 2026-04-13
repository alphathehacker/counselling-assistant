import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StickyActionBar = ({ college, onApplyNow, onContact, onShare, isBookmarked, onBookmark }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-300 bg-card border-t border-border p-4 md:hidden">
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBookmark}
          className="flex-shrink-0"
        >
          <Icon 
            name={isBookmarked ? "BookmarkCheck" : "Bookmark"} 
            size={20} 
            className={isBookmarked ? "text-primary" : "text-muted-foreground"}
          />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onShare}
          className="flex-shrink-0"
        >
          <Icon name="Share2" size={20} className="text-muted-foreground" />
        </Button>
        
        <Button
          variant="outline"
          onClick={onContact}
          iconName="Phone"
          iconPosition="left"
          className="flex-1"
        >
          Contact
        </Button>
        
        <Button
          variant="default"
          onClick={onApplyNow}
          iconName="ExternalLink"
          iconPosition="right"
          className="flex-1"
        >
          Apply Now
        </Button>
      </div>
    </div>
  );
};

export default StickyActionBar;