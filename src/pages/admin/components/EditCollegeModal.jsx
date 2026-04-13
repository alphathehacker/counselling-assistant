import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Image from '../../../components/AppImage';
import { imageAPI } from '../../../utils/api';

const EditCollegeModal = ({ college, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    code: '',
    collegeType: 'Private',
    imageUrl: '',
    location: {
      city: '',
      state: '',
      district: '',
      pincode: '',
      address: '',
      nearestRailway: '',
      nearestBusStand: '',
    },
    campusArea: '',
    website: '',
    established: '',
    affiliation: '',
    contact: {
      phone: '',
      email: '',
    },
    fees: {
      annualTuitionFee: '',
      annualHostelFee: '',
      annualMessFee: '',
      totalFirstYearFee: '',
    },
    placements: {
      averagePackage: '',
      highestPackage: '',
      placementRate: '',
      topRecruiters: '',
    },
    rankings: {
      nirf: '',
    },
    facilities: '',
    cutoffs: [],
    branches: [],
  });
  const [fetchingImage, setFetchingImage] = useState(false);
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const handleJsonImport = () => {
    setJsonError('');
    try {
      const data = JSON.parse(jsonInput);
      setFormData(prev => ({
        ...prev,
        ...data,
        name: data.name || prev.name || '',
        shortName: data.shortName || prev.shortName || '',
        code: data.code || prev.code || '',
        collegeType: data.collegeType || data.type || prev.collegeType || 'Private',
        imageUrl: data.imageUrl || data.image || prev.imageUrl || '',
        campusArea: data.campusArea || data.campus_area || data.campusAreaAcres || prev.campusArea || '',
        website: data.website || prev.website || '',
        established: data.established || data.establishedYear || prev.established || '',
        affiliation: data.affiliation || prev.affiliation || '',
        location: {
          ...(prev.location || {}),
          ...(data.location || {}),
        },
        contact: {
          ...(prev.contact || {}),
          ...(data.contact || {}),
          phone: data.contact?.phone || data.phone || prev.contact?.phone || '',
          email: data.contact?.email || data.email || prev.contact?.email || '',
        },
        fees: {
          ...(prev.fees || {}),
          ...(data.fees || {}),
        },
        placements: {
          ...(prev.placements || {}),
          ...(data.placements || {}),
          topRecruiters: Array.isArray(data.placements?.topRecruiters)
            ? data.placements.topRecruiters.join(', ')
            : (data.placements?.topRecruiters || prev.placements?.topRecruiters || ''),
        },
        rankings: {
          ...(prev.rankings || {}),
          ...(data.rankings || {}),
          nirf: data.rankings?.nirf || data.nirfRank || prev.rankings?.nirf || '',
        },
        facilities: Array.isArray(data.facilities)
          ? data.facilities.join(', ')
          : (data.facilities || prev.facilities || ''),
        cutoffs: Array.isArray(data.cutoffs) && data.cutoffs.length > 0
          ? data.cutoffs.map(c => ({
              examType: c.examType || c.exam || '',
              branch: c.branch || '',
              category: c.category || '',
              year: c.year || new Date().getFullYear(),
              closingRank: c.closingRank || c.rank || undefined,
              openingRank: c.openingRank || undefined,
            }))
          : (prev.cutoffs || []),
        branches: Array.isArray(data.branches) && data.branches.length > 0
          ? data.branches
          : (prev.branches || []),
      }));
      setShowJsonImport(false);
      setJsonInput('');
      alert('JSON data applied successfully! Existing rankings were preserved.');
    } catch (err) {
      setJsonError('Invalid JSON: ' + err.message);
    }
  };

  useEffect(() => {
    if (college && isOpen) {
      setFormData({
        name: college.name || '',
        shortName: college.shortName || '',
        code: college.code || '',
        collegeType: college.collegeType || 'Private',
        imageUrl: college.imageUrl || '',
        location: {
          city: college.location?.city || '',
          state: college.location?.state || '',
          district: college.location?.district || '',
          pincode: college.location?.pincode || '',
          address: college.location?.address || '',
          nearestRailway: college.location?.nearestRailway || '',
          nearestBusStand: college.location?.nearestBusStand || '',
        },
        campusArea: college.campusArea || '',
        website: college.website || '',
        established: college.established || '',
        affiliation: college.affiliation || '',
        contact: {
          phone: college.contact?.phone || '',
          email: college.contact?.email || '',
        },
        fees: {
          annualTuitionFee: college.fees?.annualTuitionFee || '',
          annualHostelFee: college.fees?.annualHostelFee || '',
          annualMessFee: college.fees?.annualMessFee || '',
          totalFirstYearFee: college.fees?.totalFirstYearFee || '',
        },
        placements: {
          averagePackage: college.placements?.averagePackage || '',
          highestPackage: college.placements?.highestPackage || '',
          placementRate: college.placements?.placementRate || '',
          topRecruiters: college.placements?.topRecruiters?.join(', ') || '',
        },
        rankings: {
          nirf: college.rankings?.nirf || '',
        },
        facilities: college.facilities?.join(', ') || '',
        cutoffs: college.cutoffs || [],
        branches: college.branches || [],
      });
    }
  }, [college, isOpen]);

  const handleFetchImage = async () => {
    if (!formData.name) {
      alert('Please enter college name first');
      return;
    }

    setFetchingImage(true);
    try {
      const locationStr = formData.location.city && formData.location.state
        ? `${formData.location.city}, ${formData.location.state}`
        : formData.location.city || formData.location.state || '';

      const response = await imageAPI.search({
        collegeName: formData.name,
        location: locationStr,
        collegeId: college?._id,
      });

      if (response.data.success && response.data.imageUrl) {
        setFormData(prev => ({
          ...prev,
          imageUrl: response.data.imageUrl,
        }));
        alert('Image fetched successfully!');
      } else {
        alert('Failed to fetch image. Please try again or enter image URL manually.');
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      alert('Error fetching image. Please enter image URL manually.');
    } finally {
      setFetchingImage(false);
    }
  };

  const handleAddBranch = () => {
    setFormData(prev => ({
      ...prev,
      branches: [...prev.branches, { name: '', code: '', duration: 4, intake: '' }]
    }));
  };

  const handleRemoveBranch = (index) => {
    const newBranches = [...formData.branches];
    newBranches.splice(index, 1);
    setFormData(prev => ({ ...prev, branches: newBranches }));
  };

  const handleBranchChange = (index, field, value) => {
    const newBranches = [...formData.branches];
    newBranches[index] = { ...newBranches[index], [field]: value };
    setFormData(prev => ({ ...prev, branches: newBranches }));
  };

  const handleAddCutoff = () => {
    setFormData(prev => ({
      ...prev,
      cutoffs: [...prev.cutoffs, { examType: 'AP EAPCET', branch: '', category: '', year: new Date().getFullYear(), closingRank: '' }]
    }));
  };

  const handleRemoveCutoff = (index) => {
    const newCutoffs = [...formData.cutoffs];
    newCutoffs.splice(index, 1);
    setFormData(prev => ({ ...prev, cutoffs: newCutoffs }));
  };

  const handleCutoffChange = (index, field, value) => {
    const newCutoffs = [...formData.cutoffs];
    newCutoffs[index] = { ...newCutoffs[index], [field]: value };
    setFormData(prev => ({ ...prev, cutoffs: newCutoffs }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith('location.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [field]: value,
        },
      }));
    } else if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          [field]: value,
        },
      }));
    } else if (name.startsWith('fees.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        fees: {
          ...prev.fees,
          [field]: value ? parseFloat(value) : '',
        },
      }));
    } else if (name.startsWith('placements.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        placements: {
          ...prev.placements,
          [field]: field === 'topRecruiters' ? value : (value ? parseFloat(value) : ''),
        },
      }));
    } else if (name.startsWith('rankings.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        rankings: {
          ...prev.rankings,
          [field]: value ? parseInt(value) : '',
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare data for API
    const updateData = {
      name: formData.name,
      shortName: formData.shortName || undefined,
      code: formData.code || undefined,
      collegeType: formData.collegeType,
      imageUrl: formData.imageUrl || undefined,
      location: {
        ...formData.location,
        city: formData.location.city,
        state: formData.location.state,
        district: formData.location.district || undefined,
        pincode: formData.location.pincode || undefined,
        address: formData.location.address || undefined,
        nearestRailway: formData.location.nearestRailway || undefined,
        nearestBusStand: formData.location.nearestBusStand || undefined,
      },
      campusArea: formData.campusArea ? parseFloat(formData.campusArea) : undefined,
      website: formData.website || undefined,
      established: formData.established ? parseInt(formData.established) : undefined,
      affiliation: formData.affiliation || undefined,
      contact: {
        phone: formData.contact.phone || undefined,
        email: formData.contact.email || undefined,
      },
      fees: {
        annualTuitionFee: formData.fees.annualTuitionFee || 0,
        annualHostelFee: formData.fees.annualHostelFee || 0,
        annualMessFee: formData.fees.annualMessFee || 0,
        totalFirstYearFee: formData.fees.totalFirstYearFee || undefined,
      },
      placements: {
        averagePackage: formData.placements.averagePackage || undefined,
        highestPackage: formData.placements.highestPackage || undefined,
        placementRate: formData.placements.placementRate || undefined,
        topRecruiters: formData.placements.topRecruiters
          ? formData.placements.topRecruiters.split(',').map(r => r.trim()).filter(r => r)
          : undefined,
      },
      rankings: {
        nirf: formData.rankings.nirf || undefined,
      },
      facilities: formData.facilities
        ? formData.facilities.split(',').map(f => f.trim()).filter(f => f)
        : undefined,
      cutoffs: (formData.cutoffs || []).map(c => ({
        ...c,
        year: parseInt(c.year),
        closingRank: c.closingRank ? parseInt(c.closingRank) : undefined,
        openingRank: c.openingRank ? parseInt(c.openingRank) : undefined,
      })),
      branches: (formData.branches || []).map(b => ({
        ...b,
        intake: b.intake ? parseInt(b.intake) : undefined,
      })),
    };

    onSave(updateData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-modal max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Edit College</h2>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant={showJsonImport ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowJsonImport(!showJsonImport)}
                iconName="Code"
                iconPosition="left"
              >
                {showJsonImport ? 'Hide JSON' : 'Import JSON'}
              </Button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="X" size={24} />
              </button>
            </div>
          </div>

          {/* JSON Import Panel */}
          {showJsonImport && (
            <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-foreground">Paste College JSON Data</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Paste a JSON object with fields like name, location, fees, placements, rankings, facilities, etc. All matching fields will be auto-filled.
              </p>
              <textarea
                value={jsonInput}
                onChange={(e) => { setJsonInput(e.target.value); setJsonError(''); }}
                placeholder={'{\n  "name": "College Name",\n  "collegeType": "Government",\n  "location": { "city": "Delhi", "state": "Delhi" },\n  "fees": { "annualTuitionFee": 200000 },\n  "placements": { "averagePackage": 13.1 },\n  "rankings": { "nirf": 72 },\n  "facilities": ["Library", "Hostel"]\n}'}
                className="w-full h-40 p-3 border border-border rounded-md bg-background text-foreground text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {jsonError && (
                <p className="text-sm text-destructive mt-2 flex items-center">
                  <Icon name="AlertCircle" size={14} className="mr-1" />
                  {jsonError}
                </p>
              )}
              <div className="flex justify-end space-x-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowJsonImport(false); setJsonInput(''); setJsonError(''); }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleJsonImport}
                  disabled={!jsonInput.trim()}
                  iconName="Check"
                  iconPosition="left"
                >
                  Apply JSON
                </Button>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* College Image */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              College Image
            </h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-48 h-32 rounded-lg overflow-hidden bg-muted flex items-center justify-center border border-border">
                  {formData.imageUrl ? (
                    <Image
                      src={formData.imageUrl}
                      alt={formData.name || 'College image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='192' height='128' viewBox='0 0 192 128'%3E%3Crect width='192' height='128' fill='%23f3f4f6'/%3E%3Ctext x='96' y='64' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <Icon name="Image" size={32} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Image URL
                    </label>
                    <div className="flex space-x-2">
                      <Input
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        placeholder="https://example.com/image.jpg"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFetchImage}
                        disabled={fetchingImage || !formData.name}
                        loading={fetchingImage}
                        iconName="Search"
                        iconPosition="left"
                      >
                        {fetchingImage ? 'Fetching...' : 'Fetch Image'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter image URL manually or click "Fetch Image" to search using SerpAPI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  College Name <span className="text-destructive">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Short Name
                </label>
                <Input
                  name="shortName"
                  value={formData.shortName}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  College Code
                </label>
                <Input
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  College Type <span className="text-destructive">*</span>
                </label>
                <select
                  name="collegeType"
                  value={formData.collegeType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="Government">Government</option>
                  <option value="Private">Private</option>
                  <option value="Deemed University">Deemed University</option>
                  <option value="Autonomous">Autonomous</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  City <span className="text-destructive">*</span>
                </label>
                <Input
                  name="location.city"
                  value={formData.location.city}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  State <span className="text-destructive">*</span>
                </label>
                <Input
                  name="location.state"
                  value={formData.location.state}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  District
                </label>
                <Input
                  name="location.district"
                  value={formData.location.district}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Pincode
                </label>
                <Input
                  name="location.pincode"
                  value={formData.location.pincode}
                  onChange={handleChange}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Address
                </label>
                <Input
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nearest Railway Station
                </label>
                <Input
                  name="location.nearestRailway"
                  value={formData.location.nearestRailway}
                  onChange={handleChange}
                  placeholder="e.g., Guntur Junction"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Nearest Bus Stand
                </label>
                <Input
                  name="location.nearestBusStand"
                  value={formData.location.nearestBusStand}
                  onChange={handleChange}
                  placeholder="e.g., Guntur Bus Stand"
                />
              </div>
            </div>
          </div>

          {/* Campus Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Campus Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Campus Area (Acres)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  name="campusArea"
                  value={formData.campusArea}
                  onChange={handleChange}
                  placeholder="e.g., 25.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Established Year
                </label>
                <Input
                  type="number"
                  name="established"
                  value={formData.established}
                  onChange={handleChange}
                  placeholder="e.g., 2000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Affiliation
                </label>
                <Input
                  name="affiliation"
                  value={formData.affiliation}
                  onChange={handleChange}
                  placeholder="e.g., JNTU Kakinada"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Website
                </label>
                <Input
                  name="website"
                  type="url"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Phone
                </label>
                <Input
                  name="contact.phone"
                  value={formData.contact.phone}
                  onChange={handleChange}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email
                </label>
                <Input
                  name="contact.email"
                  type="email"
                  value={formData.contact.email}
                  onChange={handleChange}
                  placeholder="info@college.edu"
                />
              </div>
            </div>
          </div>

          {/* Fee Structure */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Fee Structure (₹)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Annual Tuition Fee
                </label>
                <Input
                  type="number"
                  name="fees.annualTuitionFee"
                  value={formData.fees.annualTuitionFee}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Annual Hostel Fee
                </label>
                <Input
                  type="number"
                  name="fees.annualHostelFee"
                  value={formData.fees.annualHostelFee}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Annual Mess Fee
                </label>
                <Input
                  type="number"
                  name="fees.annualMessFee"
                  value={formData.fees.annualMessFee}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Total First Year Fee
                </label>
                <Input
                  type="number"
                  name="fees.totalFirstYearFee"
                  value={formData.fees.totalFirstYearFee}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Placement Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Placement Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Average Package (LPA)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  name="placements.averagePackage"
                  value={formData.placements.averagePackage}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Highest Package (LPA)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  name="placements.highestPackage"
                  value={formData.placements.highestPackage}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Placement Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.1"
                  name="placements.placementRate"
                  value={formData.placements.placementRate}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Top Recruiters (comma-separated)
                </label>
                <Input
                  name="placements.topRecruiters"
                  value={formData.placements.topRecruiters}
                  onChange={handleChange}
                  placeholder="TCS, Infosys, Wipro"
                />
              </div>
            </div>
          </div>

          {/* Rankings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Rankings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  NIRF Rank
                </label>
                <Input
                  type="number"
                  name="rankings.nirf"
                  value={formData.rankings.nirf}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Facilities */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Facilities
            </h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Facilities (comma-separated)
              </label>
              <Input
                name="facilities"
                value={formData.facilities}
                onChange={handleChange}
                placeholder="Library, Hostel, Sports, Labs"
              />
            </div>
          </div>

          {/* Branches/Courses Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Branches / Courses
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddBranch}
                iconName="Plus"
                iconPosition="left"
              >
                Add Branch
              </Button>
            </div>
            {(formData.branches || []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No branches added yet.</p>
            ) : (
              <div className="space-y-3">
                {(formData.branches || []).map((branch, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium mb-1">Branch Name</label>
                      <Input
                        value={branch.name}
                        onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
                        placeholder="e.g., Computer Science"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium mb-1">Code</label>
                      <Input
                        value={branch.code}
                        onChange={(e) => handleBranchChange(index, 'code', e.target.value)}
                        placeholder="CSE"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium mb-1">Intake</label>
                      <Input
                        type="number"
                        value={branch.intake}
                        onChange={(e) => handleBranchChange(index, 'intake', e.target.value)}
                        placeholder="180"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveBranch(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cutoffs Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="text-lg font-semibold text-foreground">
                Cutoff Information
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCutoff}
                iconName="Plus"
                iconPosition="left"
              >
                Add Cutoff
              </Button>
            </div>
            {formData.cutoffs.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No cutoffs added yet.</p>
            ) : (
              <div className="space-y-3">
                {formData.cutoffs.map((cutoff, index) => (
                  <div key={index} className="flex flex-wrap items-end gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                    <div className="w-32">
                      <label className="block text-xs font-medium mb-1">Exam</label>
                      <select
                        value={cutoff.examType}
                        onChange={(e) => handleCutoffChange(index, 'examType', e.target.value)}
                        className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                      >
                        <option value="AP EAPCET">AP EAPCET</option>
                        <option value="AP ECET">AP ECET</option>
                        <option value="NEET">NEET</option>
                        <option value="JEE Main">JEE Main</option>
                        <option value="JEE Advanced">JEE Advanced</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-xs font-medium mb-1">Branch</label>
                      <Input
                        value={cutoff.branch}
                        onChange={(e) => handleCutoffChange(index, 'branch', e.target.value)}
                        placeholder="CSE"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-xs font-medium mb-1">Category</label>
                      <Input
                        value={cutoff.category}
                        onChange={(e) => handleCutoffChange(index, 'category', e.target.value)}
                        placeholder="OC_BOYS"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium mb-1">Rank</label>
                      <Input
                        type="number"
                        value={cutoff.closingRank}
                        onChange={(e) => handleCutoffChange(index, 'closingRank', e.target.value)}
                        placeholder="12345"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-20">
                      <label className="block text-xs font-medium mb-1">Year</label>
                      <Input
                        type="number"
                        value={cutoff.year}
                        onChange={(e) => handleCutoffChange(index, 'year', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveCutoff(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              iconName="Save"
              iconPosition="left"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCollegeModal;

