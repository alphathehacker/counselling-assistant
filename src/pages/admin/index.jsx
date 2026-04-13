import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import EditCollegeModal from './components/EditCollegeModal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [selectedExamType, setSelectedExamType] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [clearDataLoading, setClearDataLoading] = useState(false);
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterExamType, setFilterExamType] = useState('');
  const [editingCollege, setEditingCollege] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    type: 'info',
    message: '',
  });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null,
  });

  // Redirect if not admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/student-dashboard');
    }
  }, [isAdmin, navigate]);

  if (!isAdmin) {
    return null;
  }

  const showToast = (message, type = 'info') => {
    setToast({ open: true, type, message });
  };

  React.useEffect(() => {
    if (!toast.open) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.open]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        setUploadResult(null);
      } else {
        showToast('Please select a CSV file', 'error');
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast('Please select a CSV file first', 'error');
      return;
    }
    
    if (!selectedExamType) {
      alert('Please select an exam type before uploading. This is required for parsing category columns.');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Exam type is REQUIRED as query parameter for category column format
      const uploadUrl = `/admin/colleges/upload?examType=${encodeURIComponent(selectedExamType)}`;

      const response = await api.post(uploadUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadResult({
          success: true,
          message: response.data.message,
          results: response.data.results,
          errors: response.data.errors,
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file-input');
        if (fileInput) {
          fileInput.value = '';
        }
        // Refresh colleges list
        if (activeTab === 'colleges') {
          loadColleges();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error.response?.data?.message || 'Failed to upload CSV file',
      });
    } finally {
      setUploading(false);
    }
  };

  const performClearExamData = async () => {
    if (!selectedExamType) {
      return;
    }
    
    setClearDataLoading(true);
    try {
      const response = await api.post('/admin/colleges/clear-exam-data', { examType: selectedExamType });
      if (response.data.success) {
        setUploadResult({
          success: true,
          message: response.data.message,
        });
        // Refresh colleges list
        loadColleges();
      } else {
        setUploadResult({
          success: false,
          message: response.data.message || 'Failed to clear exam data',
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error.response?.data?.message || `Failed to clear ${selectedExamType} data`,
      });
    } finally {
      setClearDataLoading(false);
    }
  };

  const handleClearExamData = () => {
    if (!selectedExamType) return;

    setConfirmDialog({
      open: true,
      message: `Remove all ${selectedExamType} data from the database (exam types and cutoffs)? Colleges that only had ${selectedExamType} will be deactivated. You can then re-upload the CSV.`,
      confirmLabel: 'Clear Data',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await performClearExamData();
      },
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalColleges, setTotalColleges] = useState(0);


  const loadColleges = async (page = 1) => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm?.trim(),
        limit: 500,
        page: page,
        includeInactive: 'true', // Always show all colleges in admin panel
      };
      if (filterExamType) params.examType = filterExamType;

      const response = await api.get('/admin/colleges', { params });

      if (response.data.success) {
        setColleges(response.data.colleges);
        setTotalColleges(response.data.pagination?.total || 0);
        setTotalPages(response.data.pagination?.pages || 1);
        setCurrentPage(response.data.pagination?.page || 1);
      }
    } catch (error) {
      console.error('Error loading colleges:', error);
      showToast('Failed to load colleges', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'colleges') {
      setCurrentPage(1);
      loadColleges(1);
    }
  }, [activeTab, searchTerm, filterExamType]);

  const performDeleteCollege = async (collegeId) => {
    try {
      const response = await api.delete(`/admin/colleges/${collegeId}`);
      if (response.data.success) {
        showToast('College deleted successfully', 'success');
        loadColleges();
      }
    } catch (error) {
      console.error('Error deleting college:', error);
      showToast('Failed to delete college', 'error');
    }
  };

  const handleDeleteCollege = (collegeId) => {
    setConfirmDialog({
      open: true,
      message: 'Are you sure you want to delete this college?',
      confirmLabel: 'Delete',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await performDeleteCollege(collegeId);
      },
    });
  };

  const handleEditCollege = (college) => {
    setEditingCollege(college);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCollege(null);
  };

  const handleSaveCollege = async (updateData) => {
    try {
      const response = await api.put(`/admin/colleges/${editingCollege._id}`, updateData);
      if (response.data.success) {
        showToast('College updated successfully', 'success');
        handleCloseEditModal();
        loadColleges();
      }
    } catch (error) {
      console.error('Error updating college:', error);
      showToast(error.response?.data?.message || 'Failed to update college', 'error');
    }
  };

  const handleReactivateCollege = async (collegeId) => {
    try {
      const response = await api.put(`/admin/colleges/${collegeId}/reactivate`);
      if (response.data.success) {
        showToast('College reactivated', 'success');
        loadStats();
        loadColleges(currentPage);
      }
    } catch (error) {
      console.error('Error reactivating college:', error);
      showToast('Failed to reactivate college', 'error');
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <main className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
            <p className="text-muted-foreground">
              Manage colleges and datasets for the prediction engine
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Upload" size={16} className="inline-block mr-2" />
              Upload CSV
            </button>
            <button
              onClick={() => setActiveTab('colleges')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'colleges'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name="Database" size={16} className="inline-block mr-2" />
              Manage Colleges
            </button>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Upload College Data (CSV)
              </h2>

              <div className="space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                    CSV Upload Instructions
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li><strong>Dynamic Column Detection:</strong> System automatically detects column names - no fixed format required!</li>
                    <li><strong>Upload separate CSV files for each exam type</strong> (AP EAPCET, AP ECET, NEET, JEE Main, JEE Advanced, etc.)</li>
                    <li><strong>Essential columns for predictions:</strong>
                      <ul className="ml-4 mt-1 space-y-0.5">
                        <li>College Name (any variation: "College Name", "Name", "Institution", "Institute Name", etc.)</li>
                        <li>Exam Type (any variation: "Exam Type", "Exam", "CET Exam", etc.)</li>
                        <li>Branch (any variation: "Branch", "Course", "Stream", "Program", etc.)</li>
                        <li>Category (any variation: "Category", "Reservation Category", "Quota", etc.)</li>
                        <li><strong>Closing Rank</strong> (any variation: "Closing Rank", "Last Rank", "Cutoff Rank", "Rank", etc.) - CRITICAL for predictions</li>
                      </ul>
                    </li>
                    <li><strong>JEE Advanced Specific Format:</strong>
                      <ul className="ml-4 mt-1 space-y-0.5">
                        <li>Required columns: "Institute Name", "Branch"</li>
                        <li>Category rounds: "OPEN Round 1-6", "EWS Round 1-6", "OBC-NCL Round 1-6", "SC Round 1-6", "ST Round 1-6"</li>
                        <li>System automatically extracts worst (highest) rank across all rounds for each category</li>
                        <li>PwD columns are ignored for general predictions but stored for specialized queries</li>
                      </ul>
                    </li>
                    <li><strong>Optional columns:</strong> City, State, College Type, Year, Opening Rank, Fees, Placements, Rankings, Contact info</li>
                    <li><strong>Multiple rows per college</strong> allowed (different branches/categories/years)</li>
                    <li><strong>System automatically maps</strong> your column names to the database schema</li>
                    <li>Maximum file size: 10MB</li>
                  </ul>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <div>
                    <label className="block font-medium text-sm text-foreground mb-2">
                      Select CSV File
                    </label>
                    <div className="flex items-center space-x-4">
                      <Input
                        id="csv-file-input"
                        type="file"
                        accept=".csv,text/csv"
                        onChange={handleFileChange}
                        className="flex-1"
                      />
                      {file && (
                        <span className="text-sm text-muted-foreground">
                          {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Exam Type Selector (REQUIRED for category-specific column format) */}
                  <div>
                    <label className="block font-medium text-sm text-foreground mb-2">
                      Exam Type <span className="text-destructive">*</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={selectedExamType}
                      onChange={(e) => setSelectedExamType(e.target.value)}
                      required
                    >
                      <option value="">-- Select Exam Type --</option>
                      <option value="AP EAPCET">AP EAPCET</option>
                      <option value="AP ECET">AP ECET</option>
                      <option value="NEET">NEET</option>
                      <option value="JEE Main">JEE Main</option>
                      <option value="JEE Advanced">JEE Advanced</option>
                    </select>
                    <p className="text-xs text-muted-foreground mt-1">
                      <strong>Required</strong> - Select the exam type for this CSV file (e.g., AP EAPCET for EAPCET cutoff data)
                    </p>
                  </div>
                </div>

                {/* Clear Exam Data - always visible; enabled when an exam type is selected */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClearExamData}
                    disabled={clearDataLoading || !selectedExamType}
                    className="border-amber-500 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 disabled:opacity-60"
                  >
                    {clearDataLoading ? 'Clearing...' : `Clear ${selectedExamType || 'Exam'} data from DB`}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {selectedExamType
                      ? `Use this before re-uploading if the previous ${selectedExamType} upload had errors.`
                      : 'Select an Exam Type above to enable.'}
                  </span>
                </div>

                {/* Upload Button */}
                <Button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  loading={uploading}
                  iconName="Upload"
                  iconPosition="left"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {uploading ? 'Uploading...' : 'Upload CSV'}
                </Button>

                {/* Upload Result */}
                {uploadResult && (
                  <div
                    className={`p-4 rounded-lg border ${
                      uploadResult.success
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <Icon
                        name={uploadResult.success ? 'CheckCircle' : 'XCircle'}
                        size={20}
                        className="mt-0.5 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{uploadResult.message}</p>
                        {uploadResult.results && (
                          <div className="mt-2 text-sm">
                            <p>
                              Created: {uploadResult.created || 0} colleges | Updated: {uploadResult.updated || 0} colleges
                            </p>
                            {uploadResult.totalRows && (
                              <p className="text-xs mt-1">
                                Total rows processed: {uploadResult.totalRows}
                              </p>
                            )}
                            {uploadResult.errors && uploadResult.errors.length > 0 && (
                              <p className="text-xs mt-1 text-red-600">
                                Errors: {uploadResult.errors.length} row(s) had issues
                              </p>
                            )}
                          </div>
                        )}
                        {uploadResult.detectedColumns && (
                          <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
                            <p className="font-medium mb-1">Detected Columns:</p>
                            <div className="grid grid-cols-2 gap-1">
                              {Object.entries(uploadResult.detectedColumns).slice(0, 10).map(([key, value]) => (
                                <div key={key} className="truncate">
                                  <span className="font-medium">{key}:</span> {value}
                                </div>
                              ))}
                            </div>
                            {Object.keys(uploadResult.detectedColumns).length > 10 && (
                              <p className="mt-1 text-xs">... and {Object.keys(uploadResult.detectedColumns).length - 10} more</p>
                            )}
                          </div>
                        )}
                        {uploadResult.errors && uploadResult.errors.length > 0 && (
                          <div className="mt-2 text-sm">
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc list-inside mt-1">
                              {uploadResult.errors.slice(0, 5).map((error, index) => (
                                <li key={index}>{error.error}</li>
                              ))}
                              {uploadResult.errors.length > 5 && (
                                <li>... and {uploadResult.errors.length - 5} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Colleges Tab */}
          {activeTab === 'colleges' && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground">
                  Manage Colleges
                </h2>
                <div className="flex items-center space-x-4">
                  {totalColleges > 0 && (
                    <div className="text-sm font-medium text-muted-foreground mr-2">
                       Total: <strong className="text-foreground text-base">{totalColleges}</strong> colleges
                    </div>
                  )}
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filterExamType}
                    onChange={(e) => setFilterExamType(e.target.value)}
                  >
                    <option value="">All Exam Types</option>
                    <option value="AP EAPCET">AP EAPCET</option>
                    <option value="AP ECET">AP ECET</option>
                    <option value="NEET">NEET</option>
                    <option value="JEE Main">JEE Main</option>
                    <option value="JEE Advanced">JEE Advanced</option>
                  </select>
                  <Input
                    type="text"
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                  <Button
                    onClick={loadColleges}
                    variant="outline"
                    iconName="RefreshCw"
                    iconPosition="left"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading colleges...</p>
                </div>
              ) : colleges.length === 0 ? (
                <div className="text-center py-12">
                  <Icon name="Database" size={48} className="mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground font-medium">No colleges found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {filterExamType || searchTerm
                      ? 'No colleges match your filters. Try "All Exam Types" or clear the search.'
                      : 'Upload a CSV file (Upload CSV tab) to add colleges. Select exam type (AP EAPCET, JEE Main, etc.) before uploading.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Image
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Name
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Code
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Location
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Type
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Exam Types
                        </th>
                        <th className="text-left p-3 font-semibold text-sm text-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {colleges.map((college) => (
                        <tr
                          key={college._id}
                          className={`border-b border-border hover:bg-muted/50 transition-colors ${college.isActive === false ? 'bg-muted/30' : ''}`}
                        >
                          <td className="p-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                              {college.imageUrl ? (
                                <img
                                  src={college.imageUrl}
                                  alt={college.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f3f4f6'/%3E%3Ctext x='32' y='32' font-family='Arial' font-size='10' fill='%236b7280' text-anchor='middle' dy='.3em'%3ENo Image%3C/text%3E%3C/svg%3E";
                                  }}
                                />
                              ) : (
                                <Icon name="Image" size={24} className="text-muted-foreground" />
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-foreground">
                              {college.name}
                            </div>
                            {college.shortName && (
                              <div className="text-sm text-muted-foreground">
                                {college.shortName}
                              </div>
                            )}
                            {college.isActive === false && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                                Inactive (hidden)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {college.code || '-'}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {college.location?.city}, {college.location?.state}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs rounded bg-primary/10 text-primary">
                              {college.collegeType}
                            </span>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {college.examTypes?.join(', ') || '-'}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center space-x-2">
                              {college.isActive === false ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReactivateCollege(college._id)}
                                  iconName="RefreshCw"
                                >
                                  Reactivate
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditCollege(college)}
                                    iconName="Edit"
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteCollege(college._id)}
                                    iconName="Trash2"
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * 500) + 1} to {Math.min(currentPage * 500, totalColleges)} of {totalColleges} colleges
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = currentPage - 1;
                            if (newPage >= 1) {
                              setCurrentPage(newPage);
                              loadColleges(newPage);
                            }
                          }}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newPage = currentPage + 1;
                            if (newPage <= totalPages) {
                              setCurrentPage(newPage);
                              loadColleges(newPage);
                            }
                          }}
                          disabled={currentPage === totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit College Modal */}
      <EditCollegeModal
        college={editingCollege}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleSaveCollege}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title="Confirm Action"
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel || 'Confirm'}
        cancelLabel="Cancel"
        onCancel={() =>
          setConfirmDialog((prev) => ({ ...prev, open: false }))
        }
        onConfirm={async () => {
          const cb = confirmDialog.onConfirm;
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          if (cb) {
            await cb();
          }
        }}
      />

      {/* Toast Notification */}
      {toast.open && (
        <div className="fixed inset-0 z-300 flex items-start justify-center pointer-events-none">
          <div className="mt-24 pointer-events-auto">
            <div
              className={`px-5 py-4 rounded-lg shadow-xl border text-sm flex items-start space-x-2 max-w-md bg-card ${
                toast.type === 'success'
                  ? 'border-emerald-300 text-emerald-900'
                  : toast.type === 'error'
                  ? 'border-red-300 text-red-900'
                  : 'border-blue-300 text-blue-900'
              }`}
            >
              <Icon
                name={
                  toast.type === 'success'
                    ? 'CheckCircle'
                    : toast.type === 'error'
                    ? 'XCircle'
                    : 'Info'
                }
                size={18}
                className="mt-0.5"
              />
              <div className="flex-1 font-medium">{toast.message}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
