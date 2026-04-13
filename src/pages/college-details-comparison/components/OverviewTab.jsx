import React from 'react';
import Icon from '../../../components/AppIcon';
import Image from '../../../components/AppImage';

const OverviewTab = ({ college }) => {
  return (
    <div className="space-y-6">
      {/* Campus Images */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {college?.campusImages?.map((image, index) => (
          <div key={index} className="relative h-48 rounded-lg overflow-hidden">
            <Image
              src={image?.url}
              alt={image?.caption}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium">{image?.caption}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Key Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {college?.stats?.totalStudents?.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </div>
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-secondary mb-1">
            {college?.stats?.faculty}
          </div>
          <div className="text-sm text-muted-foreground">Faculty Members</div>
        </div>
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-accent mb-1">
            {college?.stats?.campusSize}
          </div>
          <div className="text-sm text-muted-foreground">Campus Size</div>
        </div>
        <div className="bg-muted rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-success mb-1">
            {college?.stats?.courses}
          </div>
          <div className="text-sm text-muted-foreground">Courses Offered</div>
        </div>
      </div>
      {/* About Section */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
          About {college?.shortName}
        </h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <p className="leading-relaxed mb-4">{college?.description}</p>
          <p className="leading-relaxed">{college?.additionalInfo}</p>
        </div>
      </div>
      {/* Accreditation & Recognition */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
          Accreditation & Recognition
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {college?.accreditations?.map((accreditation, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Award" size={20} className="text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">{accreditation?.name}</div>
                <div className="text-sm text-muted-foreground">{accreditation?.grade}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Facilities */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
          Campus Facilities
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {college?.facilities?.map((facility, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <Icon name={facility?.icon} size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">{facility?.name}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Location Map */}
      <div>
        <h3 className="font-heading font-semibold text-lg text-foreground mb-3">
          Location
        </h3>
        <div className="bg-muted rounded-lg p-4">
          <div className="aspect-video rounded-lg overflow-hidden">
            <iframe
              width="100%"
              height="100%"
              loading="lazy"
              title={college?.name}
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://www.google.com/maps?q=${college?.coordinates?.lat},${college?.coordinates?.lng}&z=14&output=embed`}
              className="border-0"
            />
          </div>
          <div className="mt-3 flex items-center space-x-2 text-sm text-muted-foreground">
            <Icon name="MapPin" size={16} />
            <span>{college?.fullAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;