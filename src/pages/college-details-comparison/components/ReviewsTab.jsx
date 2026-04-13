import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';
import Button from '../../../components/ui/Button';

const ReviewsTab = ({ college }) => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showWriteReview, setShowWriteReview] = useState(false);

  const filters = [
    { id: 'all', label: 'All Reviews', count: college?.reviews?.length },
    { id: 'academics', label: 'Academics', count: college?.reviews?.filter(r => r?.category === 'academics')?.length },
    { id: 'infrastructure', label: 'Infrastructure', count: college?.reviews?.filter(r => r?.category === 'infrastructure')?.length },
    { id: 'placements', label: 'Placements', count: college?.reviews?.filter(r => r?.category === 'placements')?.length },
    { id: 'campus-life', label: 'Campus Life', count: college?.reviews?.filter(r => r?.category === 'campus-life')?.length }
  ];

  const filteredReviews = selectedFilter === 'all' 
    ? college?.reviews 
    : college?.reviews?.filter(review => review?.category === selectedFilter);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Icon
        key={index}
        name="Star"
        size={16}
        className={index < rating ? "text-warning fill-current" : "text-muted-foreground"}
      />
    ));
  };

  const getTimeAgo = (date) => {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffTime = Math.abs(now - reviewDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{college?.overallRating}</span>
              <div className="flex space-x-1">
                {renderStars(Math.floor(college?.overallRating))}
              </div>
            </div>
            <p className="text-muted-foreground mb-2">
              Based on {college?.reviews?.length} reviews
            </p>
            <Button
              variant="outline"
              onClick={() => setShowWriteReview(true)}
              iconName="Edit3"
              iconPosition="left"
              size="sm"
            >
              Write a Review
            </Button>
          </div>
          
          <div className="space-y-3">
            {college?.ratingBreakdown?.map((item, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="text-sm text-muted-foreground w-20">{item?.category}</span>
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(item?.rating / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-foreground w-8">{item?.rating}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Review Filters */}
      <div className="flex flex-wrap gap-2">
        {filters?.map((filter) => (
          <button
            key={filter?.id}
            onClick={() => setSelectedFilter(filter?.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-smooth ${
              selectedFilter === filter?.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="font-medium">{filter?.label}</span>
            <span className="text-xs bg-black/10 px-2 py-0.5 rounded-full">
              {filter?.count}
            </span>
          </button>
        ))}
      </div>
      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews?.map((review, index) => (
          <div key={index} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Image
                src={review?.author?.avatar}
                alt={review?.author?.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-heading font-medium text-foreground">
                      {review?.author?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {review?.author?.course} • {review?.author?.batch}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {renderStars(review?.rating)}
                      <span className="text-sm font-medium text-foreground ml-1">
                        {review?.rating}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(review?.date)}
                    </p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full capitalize">
                    {review?.category?.replace('-', ' ')}
                  </span>
                </div>
                
                <h5 className="font-heading font-medium text-foreground mb-2">
                  {review?.title}
                </h5>
                
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                  {review?.content}
                </p>
                
                {review?.pros && review?.pros?.length > 0 && (
                  <div className="mb-3">
                    <h6 className="font-medium text-success text-sm mb-1 flex items-center space-x-1">
                      <Icon name="ThumbsUp" size={14} />
                      <span>Pros</span>
                    </h6>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {review?.pros?.map((pro, proIndex) => (
                        <li key={proIndex} className="flex items-start space-x-2">
                          <Icon name="Plus" size={12} className="text-success mt-1 flex-shrink-0" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {review?.cons && review?.cons?.length > 0 && (
                  <div className="mb-3">
                    <h6 className="font-medium text-error text-sm mb-1 flex items-center space-x-1">
                      <Icon name="ThumbsDown" size={14} />
                      <span>Cons</span>
                    </h6>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {review?.cons?.map((con, conIndex) => (
                        <li key={conIndex} className="flex items-start space-x-2">
                          <Icon name="Minus" size={12} className="text-error mt-1 flex-shrink-0" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center space-x-4">
                    <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-smooth">
                      <Icon name="ThumbsUp" size={16} />
                      <span>Helpful ({review?.helpfulCount})</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground transition-smooth">
                      <Icon name="MessageCircle" size={16} />
                      <span>Reply</span>
                    </button>
                  </div>
                  <button className="text-sm text-muted-foreground hover:text-foreground transition-smooth">
                    <Icon name="Flag" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Load More Button */}
      {filteredReviews?.length >= 10 && (
        <div className="text-center">
          <Button variant="outline">
            Load More Reviews
          </Button>
        </div>
      )}
      {/* Write Review Modal */}
      {showWriteReview && (
        <div className="fixed inset-0 z-400 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWriteReview(false)}
          />
          <div className="relative w-full max-w-2xl bg-card rounded-lg shadow-modal p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-semibold text-lg text-foreground">
                Write a Review for {college?.shortName}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowWriteReview(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Overall Rating
                </label>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, index) => (
                    <button key={index} className="text-muted-foreground hover:text-warning transition-smooth">
                      <Icon name="Star" size={24} />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Review Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Summarize your experience"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Detailed Review
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Share your detailed experience..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowWriteReview(false)}
                >
                  Cancel
                </Button>
                <Button>
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;