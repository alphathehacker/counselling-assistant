import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { predictionAPI, authAPI } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';

const RecentPredictions = () => {
  const { user, updateUser } = useAuth();
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ open: false, predictionId: null });

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await predictionAPI.getResults({ limit: 5 });
        if (response.data.success && response.data.predictionResults) {
          // Format the prediction results for the UI
          const formattedPredictions = response.data.predictionResults.map(p => ({
            id: p._id,
            title: `${p.predictionParams?.examType || 'Unknown'} Prediction`,
            examType: p.predictionParams?.examType || 'Unknown',
            collegeCount: p.summary?.totalColleges || p.predictions?.length || 0,
            date: p.createdAt,
            status: 'completed',
            accuracy: 95, // Mocked accuracy for UI
            predictionsData: p.predictions || []
          }));
          setRecentPredictions(formattedPredictions);
        }
      } catch (error) {
        console.error('Failed to fetch recent predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  const handleDownload = async (prediction) => {
    if (!prediction?.predictionsData?.length) {
      alert('No colleges strictly available to export for this prediction.');
      return;
    }

    const lines = [];
    lines.push('College Prediction Results');
    lines.push(`Exam: ${prediction.examType}`);
    lines.push(`Date: ${new Date(prediction.date).toLocaleDateString()}`);
    lines.push('');
    lines.push('No,Name,Branch,District,Predicted Cutoff,Admission Probability,Probability Level');

    prediction.predictionsData.forEach((college, index) => {
      const name = `"${college.collegeName || 'Unknown College'}"`;
      const branch = `"${college.branch || 'N/A'}"`;
      const district = `"${college.district || 'N/A'}"`;
      const cutoff = college.predictedCutoff || college.cutoffRank || 'N/A';
      const probValue = college.admissionProbability || 'N/A';
      const probText = college.probability || 'N/A';

      lines.push(`${index + 1},${name},${branch},${district},${cutoff},${probValue},${probText}`);
    });

    const content = lines.join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prediction.examType?.toLowerCase().replace(/\s+/g, '_')}_predictions.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Increment reports downloaded count
    try {
      const response = await authAPI.incrementReportsDownloaded();
      if (response.data.success && user && updateUser) {
        updateUser({
          ...user,
          statistics: response.data.statistics
        });
      }
    } catch (error) {
      console.error('Failed to update reports downloaded count:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.predictionId) return;

    try {
      const response = await predictionAPI.deleteResult(deleteModal.predictionId);
      if (response.data.success) {
        setRecentPredictions(prev => prev.filter(p => p.id !== deleteModal.predictionId));
      }
    } catch (error) {
      console.error('Failed to delete prediction:', error);
      alert('Failed to delete prediction. Please try again.');
    } finally {
      setDeleteModal({ open: false, predictionId: null });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10';
      case 'processing':
        return 'text-warning bg-warning/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-heading font-semibold text-lg text-foreground">
          Recent Predictions
        </h3>
        <Link to="/prediction-results-reports">

        </Link>
      </div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : recentPredictions && recentPredictions.length > 0 ? (
        <div className="space-y-4">
          {recentPredictions.map((prediction, index) => (
            <div
              key={prediction?.id || `prediction-${index}`}
              className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-smooth"
            >
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon name="Target" size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-medium text-sm text-foreground mb-1">
                    {prediction?.title}
                  </h4>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span className="flex items-center space-x-1">
                      <Icon name="BookOpen" size={12} />
                      <span>{prediction?.examType}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Building2" size={12} />
                      <span>{prediction?.collegeCount} colleges</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Icon name="Calendar" size={12} />
                      <span>{new Date(prediction?.date)?.toLocaleDateString('en-IN')}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prediction?.status)}`}>
                      {prediction?.status === 'completed' ? 'Completed' : 'Processing'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {prediction?.accuracy}% accuracy
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                <Link to={`/prediction-results-reports?id=${prediction?.id}`}>
                  <Button variant="ghost" size="sm" iconName="Eye">
                    View
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Download"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDownload(prediction);
                  }}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  className="text-error hover:bg-error/10 hover:text-error"
                  onClick={(e) => {
                    e.preventDefault();
                    setDeleteModal({ open: true, predictionId: prediction?.id });
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon name="Target" size={24} className="text-muted-foreground" />
          </div>
          <h4 className="font-heading font-medium text-foreground mb-2">
            No predictions yet
          </h4>
          <p className="text-muted-foreground text-sm mb-4">
            Start your first college prediction to see results here
          </p>
          <Link to="/college-prediction-engine">
            <Button variant="default" size="sm" iconName="Plus" iconPosition="left">
              Create Prediction
            </Button>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={deleteModal.open}
        title="Delete Prediction"
        message="Are you sure you want to delete this prediction? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal({ open: false, predictionId: null })}
      />
    </div>
  );
};

export default RecentPredictions;