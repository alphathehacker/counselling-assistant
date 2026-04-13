import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import BookmarkCard from './components/BookmarkCard';
import BookmarkList from './components/BookmarkList';
import BulkActions from './components/BulkActions';
import SearchAndFilter from './components/SearchAndFilter';
import CollegeDetailsModal from '../../components/ui/CollegeDetailsModal';
import ExportModal from './components/ExportModal';
import { authAPI, predictionAPI, collegesAPI } from '../../utils/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const BookmarksSavedColleges = () => {
  const navigate = useNavigate();

  // State management
  const [activeList, setActiveList] = useState('all');
  const [selectedBookmarks, setSelectedBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeDetailsModal, setCollegeDetailsModal] = useState({ open: false, college: null });
  const [sortBy, setSortBy] = useState('dateAdded');
  const [filters, setFilters] = useState({});
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Enhanced bookmark management
  const [viewMode, setViewMode] = useState('grid'); // grid, list, compact
  const [showStatistics, setShowStatistics] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState([]);
  const [favoriteColleges, setFavoriteColleges] = useState([]);

  // Bookmarked colleges state
  const [bookmarkedColleges, setBookmarkedColleges] = useState([]);
  const [completeCollegeData, setCompleteCollegeData] = useState(new Map()); // Store complete college data
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    message: '',
    confirmLabel: 'Confirm',
    onConfirm: null,
  });
  const [compareToast, setCompareToast] = useState({ open: false, message: '' });

  // Persist bookmarks to localStorage (used when API fails or for localStorage-only bookmarks)
  const persistBookmarksToLocalStorage = (bookmarks) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = storedUser.id || 'anonymous';
      localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(bookmarks || []));
    } catch (e) {
      console.warn('Failed to persist bookmarks to localStorage:', e);
    }
  };

  // Helper: stable bookmark ID (matches BookmarkCard)
  const getBookmarkId = (item) => {
    if (!item) return undefined;
    const bookmarkCollegeId = item.collegeId;
    const resolvedCollegeId =
      typeof bookmarkCollegeId === 'object'
        ? bookmarkCollegeId?._id || bookmarkCollegeId?.id
        : bookmarkCollegeId;
    return (
      item.bookmarkId ||
      resolvedCollegeId ||
      item._id ||
      item.id
    );
  };

  // Helper function to fetch all colleges once (more efficient)
  const fetchAllColleges = async () => {
    try {
      console.log('🔍 DEBUG: Fetching all colleges from collegesAPI...');
      const response = await collegesAPI.getAll({ limit: 1000 });
      console.log('🔍 DEBUG: collegesAPI.getAll response:', response);

      if (response.data.success && response.data.colleges) {
        console.log('🔍 DEBUG: Successfully loaded', response.data.colleges.length, 'colleges');
        return response.data.colleges;
      } else {
        console.log('🔍 DEBUG: collegesAPI.getAll failed:', response.data);
        return [];
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching all colleges:', error);
      console.error('🔍 DEBUG: Full error details:', error.response?.data || error.message);
      return [];
    }
  };

  // Helper function to find college in the loaded colleges
  const findCollegeInList = (bookmark, allColleges) => {
    const collegeId = bookmark.collegeId?._id || bookmark.collegeId?.id || bookmark.collegeId || bookmark._id || bookmark.id;
    const collegeName = bookmark.name || bookmark.collegeName;

    console.log('🔍 DEBUG: Looking for college - ID:', collegeId, 'Name:', collegeName);

    // First try to find by ID (convert both to strings to handle ObjectId vs string mismatch)
    if (collegeId) {
      const college = allColleges.find(c => {
        const cId = (c._id || c.id)?.toString();
        return cId === collegeId?.toString();
      });
      if (college) {
        console.log('🔍 DEBUG: Found college by ID:', college);
        return college;
      }
    }

    // Then try to find by name (case-insensitive)
    if (collegeName) {
      const college = allColleges.find(c =>
        (c.name || c.collegeName).toLowerCase() === collegeName.toLowerCase()
      );
      if (college) {
        console.log('🔍 DEBUG: Found college by name:', college);
        return college;
      }
    }

    console.log('🔍 DEBUG: College not found:', collegeName);
    return null;
  };

  // Helper function to fetch complete college data for all bookmarks
  const fetchCompleteCollegeDataForAllBookmarks = async (bookmarks) => {
    console.log('🔍 DEBUG: Fetching complete data for', bookmarks.length, 'bookmarks');

    // Fetch all colleges once
    const allColleges = await fetchAllColleges();

    // Find matches for each bookmark
    const completeDataMap = new Map();

    bookmarks.forEach(bookmark => {
      const bookmarkId = getBookmarkId(bookmark);
      const college = findCollegeInList(bookmark, allColleges);

      if (college) {
        completeDataMap.set(bookmarkId, college);
        console.log('🔍 DEBUG: Mapped bookmark', bookmarkId, 'to college', college.name);
      } else {
        console.log('🔍 DEBUG: No college found for bookmark', bookmarkId);
      }
    });

    console.log('🔍 DEBUG: Complete college data mapped for', completeDataMap.size, 'bookmarks');
    return completeDataMap;
  };

  // Load bookmarked colleges from API with enhanced features
  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        console.log('Attempting to load bookmarks from database...');
        const response = await authAPI.getBookmarks();

        if (response.data.success && response.data.bookmarks) {
          const bookmarks = response.data.bookmarks;
          console.log('📚 DEBUG: Raw bookmarks data:', bookmarks);
          console.log('📚 DEBUG: First bookmark structure:', bookmarks[0]);
          setBookmarkedColleges(bookmarks);

          // Fetch complete college data for all bookmarks at once (much more efficient)
          const completeDataMap = await fetchCompleteCollegeDataForAllBookmarks(bookmarks);
          setCompleteCollegeData(completeDataMap);

          // Set recently added (last 7 days)
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          setRecentlyAdded(bookmarks.filter(b =>
            new Date(b.dateAdded) > sevenDaysAgo
          ));

          // Set favorite colleges (high priority)
          setFavoriteColleges(bookmarks.filter(b => b.priority === 'high'));

          console.log('Bookmarks loaded from database successfully:', bookmarks.length);
        } else {
          setBookmarkedColleges([]);
          console.log('No bookmarks found in database');
        }
      } catch (error) {
        console.error('Error loading bookmarks from database:', error);
        // Fallback to localStorage if API fails
        try {
          // Get current user ID for user-specific bookmarks with fallback
          let userId = 'anonymous';
          try {
            const currentUser = await authAPI.getCurrentUser();
            userId = currentUser.data?.user?.id || 'anonymous';
          } catch (authError) {
            console.warn('Auth API not available, using anonymous user ID');
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            userId = storedUser.id || 'anonymous';
          }

          const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
          console.log('📚 DEBUG: Loaded bookmarks from localStorage:', bookmarks);
          if (bookmarks.length > 0) {
            console.log('📚 DEBUG: First localStorage bookmark structure:', bookmarks[0]);
          }
          setBookmarkedColleges(bookmarks);

          // Fetch complete college data for localStorage bookmarks too (using optimized approach)
          const completeDataMap = await fetchCompleteCollegeDataForAllBookmarks(bookmarks);
          setCompleteCollegeData(completeDataMap);

          // Set recently added and favorites from localStorage
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          setRecentlyAdded(bookmarks.filter(b =>
            new Date(b.dateAdded) > sevenDaysAgo
          ));
          setFavoriteColleges(bookmarks.filter(b => b.priority === 'high'));

          console.log('Loaded bookmarks from localStorage fallback:', bookmarks.length);
        } catch (localStorageError) {
          console.error('Error loading from localStorage:', localStorageError);
          setBookmarkedColleges([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, []);

  // Enhanced bookmark lists configuration
  const [bookmarkLists, setBookmarkLists] = useState([
    { id: 'all', name: 'All Bookmarks', type: 'default', isDefault: true, description: 'All your saved colleges' },
    { id: 'predicted', name: 'Predicted Colleges', type: 'predicted', isDefault: false, description: 'Colleges from your predictions' },
    { id: 'favorites', name: 'Favorites', type: 'favorites', isDefault: false, description: 'Your top choice colleges' },
    { id: 'backup', name: 'Backup Options', type: 'backup', isDefault: false, description: 'Alternative options' },
    { id: 'dream', name: 'Dream Colleges', type: 'dream', isDefault: false, description: 'Aspirational choices' },
    { id: 'applied', name: 'Applied', type: 'applied', isDefault: false, description: 'Colleges you\'ve applied to' },
    { id: 'recent', name: 'Recently Added', type: 'recent', isDefault: false, description: 'Added in last 7 days' }
  ]);

  // Enhanced bookmark counts with additional metrics
  const bookmarkCounts = {
    all: bookmarkedColleges?.length,
    predicted: bookmarkedColleges?.filter(c => c?.listId === 'predicted')?.length,
    // Favorites: any bookmark marked with high priority (heart)
    favorites: bookmarkedColleges?.filter(c => c?.priority === 'high')?.length,
    backup: bookmarkedColleges?.filter(c => c?.listId === 'backup')?.length,
    dream: bookmarkedColleges?.filter(c => c?.listId === 'dream')?.length,
    applied: bookmarkedColleges?.filter(c => c?.listId === 'applied')?.length,
    recent: recentlyAdded?.length,
    highPriority: bookmarkedColleges?.filter(c => c?.priority === 'high')?.length,
    highChance: bookmarkedColleges?.filter(c => {
      const prob = c?.probability || c?.predictionData?.probability || 0;
      return prob >= 80;
    })?.length,
    mediumChance: bookmarkedColleges?.filter(c => {
      const prob = c?.probability || c?.predictionData?.probability || 0;
      return prob >= 60 && prob < 80;
    })?.length,
    lowChance: bookmarkedColleges?.filter(c => {
      const prob = c?.probability || c?.predictionData?.probability || 0;
      return prob < 60;
    })?.length
  };

  // Filter and sort colleges
  const getFilteredColleges = () => {
    // Helper: resolve the actual college document from a bookmark
    const resolveCollege = (bookmark) => {
      const bId = getBookmarkId(bookmark);
      const fromMap = bId ? completeCollegeData.get(bId) : null;
      return fromMap || bookmark?.college || (typeof bookmark?.collegeId === 'object' ? bookmark?.collegeId : null) || {};
    };

    let filtered = bookmarkedColleges;

    // Filter by active list
    if (activeList !== 'all') {
      if (activeList === 'recent') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered?.filter(b => new Date(b?.dateAdded) > sevenDaysAgo);
      } else if (activeList === 'favorites') {
        filtered = filtered?.filter(b => b?.listId === 'favorites' || b?.priority === 'high');
      } else {
        filtered = filtered?.filter(b => b?.listId === activeList);
      }
    }

    // Search — check name, location, type, notes, tags
    if (searchQuery) {
      const query = searchQuery?.toLowerCase();
      filtered = filtered?.filter(bookmark => {
        const col = resolveCollege(bookmark);
        const name = (bookmark?.collegeName || bookmark?.name || col?.name || '').toLowerCase();
        const loc = typeof col?.location === 'string'
          ? col.location.toLowerCase()
          : `${col?.location?.city || ''} ${col?.location?.state || ''}`.toLowerCase();
        const type = (col?.collegeType || col?.type || bookmark?.type || '').toLowerCase();
        const notes = (bookmark?.notes || '').toLowerCase();
        const tags = (bookmark?.tags || []).join(' ').toLowerCase();

        return name.includes(query) || loc.includes(query) || type.includes(query) ||
          notes.includes(query) || tags.includes(query);
      });
    }

    // Location filter
    if (filters?.location?.length > 0) {
      filtered = filtered?.filter(bookmark => {
        const col = resolveCollege(bookmark);
        const locStr = typeof col?.location === 'string'
          ? col.location.toLowerCase()
          : `${col?.location?.city || ''} ${col?.location?.state || ''}`.toLowerCase();
        return filters.location.some(loc => locStr.includes(loc.toLowerCase()));
      });
    }

    // Probability filter
    if (filters?.probability?.length > 0) {
      filtered = filtered?.filter(bookmark => {
        const prob = bookmark?.probability || bookmark?.predictionData?.probability || 0;
        return filters.probability.some(range => {
          if (range === 'high') return prob >= 80;
          if (range === 'medium') return prob >= 60 && prob < 80;
          if (range === 'low') return prob < 60;
          return false;
        });
      });
    }

    // Priority filter
    if (filters?.priority?.length > 0) {
      filtered = filtered?.filter(b => filters.priority.includes(b?.priority));
    }

    // College type filter
    if (filters?.type?.length > 0) {
      filtered = filtered?.filter(bookmark => {
        const col = resolveCollege(bookmark);
        const type = (col?.collegeType || col?.type || bookmark?.type || '').toLowerCase();
        return filters.type.some(t => type.includes(t.toLowerCase()));
      });
    }

    // Fees range filter
    if (filters?.minFees) {
      filtered = filtered?.filter(bookmark => {
        const col = resolveCollege(bookmark);
        const fees = col?.fees?.annualTuitionFee || (typeof col?.fees === 'number' ? col.fees : 0);
        return fees >= parseInt(filters.minFees);
      });
    }
    if (filters?.maxFees) {
      filtered = filtered?.filter(bookmark => {
        const col = resolveCollege(bookmark);
        const fees = col?.fees?.annualTuitionFee || (typeof col?.fees === 'number' ? col.fees : 0);
        return fees <= parseInt(filters.maxFees);
      });
    }

    // Sort
    const sorted = [...(filtered || [])];
    sorted.sort((a, b) => {
      const colA = resolveCollege(a);
      const colB = resolveCollege(b);
      switch (sortBy) {
        case 'name': {
          const nameA = a?.collegeName || a?.name || colA?.name || '';
          const nameB = b?.collegeName || b?.name || colB?.name || '';
          return nameA.localeCompare(nameB);
        }
        case 'probability': {
          const pA = a?.probability || a?.predictionData?.probability || 0;
          const pB = b?.probability || b?.predictionData?.probability || 0;
          return pB - pA;
        }
        case 'fees': {
          const fA = colA?.fees?.annualTuitionFee || (typeof colA?.fees === 'number' ? colA.fees : 0);
          const fB = colB?.fees?.annualTuitionFee || (typeof colB?.fees === 'number' ? colB.fees : 0);
          return fA - fB;
        }
        case 'ranking': {
          const rA = colA?.rankings?.nirf || colA?.nirfRank || 9999;
          const rB = colB?.rankings?.nirf || colB?.nirfRank || 9999;
          return rA - rB;
        }
        case 'dateAdded':
          return new Date(b?.dateAdded || 0) - new Date(a?.dateAdded || 0);
        case 'priority': {
          const order = { high: 3, medium: 2, low: 1 };
          return (order[b?.priority] || 0) - (order[a?.priority] || 0);
        }
        default:
          return 0;
      }
    });

    return sorted;
  };

  const filteredColleges = getFilteredColleges();

  // Enhanced handlers with better error handling
  const handleSelectBookmark = (collegeId, isSelected) => {
    setSelectedBookmarks(prev =>
      isSelected
        ? [...prev, collegeId]
        : prev?.filter(id => id !== collegeId)
    );
  };

  const handleSelectAll = () => {
    setSelectedBookmarks(filteredColleges?.map(c => getBookmarkId(c)).filter(Boolean) || []);
    setShowBulkActions(true);
  };

  const handleDeselectAll = () => {
    setSelectedBookmarks([]);
    setShowBulkActions(false);
  };

  const performRemoveBookmark = async (bookmark) => {
    try {
      // Try API first
      await authAPI.removeBookmark(bookmark);

      // Force refresh bookmarks from server after successful deletion
      console.log('🔄 Updating local state after deletion...');

      const collegeId = bookmark.collegeId || bookmark._id || bookmark.id || bookmark.bookmarkId;
      setBookmarkedColleges(prev => prev.filter(c => (c.collegeId || c._id || c.id || c.bookmarkId) !== collegeId));

      // Update recently added and favorites
      setRecentlyAdded(prev => prev.filter(c => (c.collegeId || c._id || c.id || c.bookmarkId) !== collegeId));
      setFavoriteColleges(prev => prev.filter(c => (c.collegeId || c._id || c.id || c.bookmarkId) !== collegeId));

    } catch (error) {
      console.log('API remove failed, trying localStorage fallback');
      // Fallback to localStorage
      try {
        let userId = 'anonymous';
        try {
          const currentUser = await authAPI.getCurrentUser();
          userId = currentUser.data?.user?.id || 'anonymous';
        } catch (authError) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userId = storedUser.id || 'anonymous';
        }

        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
        const collegeId = bookmark.collegeId || bookmark._id || bookmark.id || bookmark.bookmarkId;
        const updatedBookmarks = bookmarks.filter(c => (c.collegeId || c._id || c.id || c.bookmarkId) !== collegeId);
        localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));

        // Update state and force refresh
        setBookmarkedColleges(updatedBookmarks);
      } catch (localStorageError) {
        console.error('localStorage fallback failed:', localStorageError);
      }
    }
  };

  const handleRemoveBookmark = (bookmark) => {
    setConfirmDialog({
      open: true,
      message: 'Are you sure you want to remove this bookmark?',
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await performRemoveBookmark(bookmark);
      },
    });
  };

  const handleShareBookmark = async (college) => {
    try {
      // Create shareable data
      const shareData = {
        name: college?.name || college?.collegeName,
        location: typeof college?.location === 'string' ? college.location :
          `${college?.location?.city || ''}, ${college?.location?.state || ''}`,
        type: college?.collegeType || college?.type,
        probability: college?.probability || college?.predictionData?.probability,
        fees: college?.fees?.annualTuitionFee || college?.fees,
        rank: college?.nirfRank || college?.rankings?.nirf
      };

      // Try native share API first
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${shareData.name}`,
          text: `${shareData.name} - ${shareData.location}\nType: ${shareData.type}\nChance: ${shareData.probability}%\nFees: ₹${shareData.fees}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        const text = `${shareData.name} - ${shareData.location}\nType: ${shareData.type}\nChance: ${shareData.probability}%\nFees: ₹${shareData.fees}\n\nCheck it out: ${window.location.href}`;
        await navigator.clipboard.writeText(text);
        alert('College details copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing bookmark:', error);
      alert('Failed to share bookmark. Please try again.');
    }
  };

  const handleViewDetails = (bookmarkIdArg) => {
    console.log('🔍 DEBUG: handleViewDetails called with:', bookmarkIdArg);

    if (!bookmarkIdArg) {
      console.warn('🔍 DEBUG: handleViewDetails called with invalid id, aborting.');
      return;
    }

    // Find the bookmark — bookmarkId is passed from BookmarkCard
    const bookmark = bookmarkedColleges.find(c => getBookmarkId(c) === bookmarkIdArg);
    console.log('🔍 DEBUG: Found bookmark:', bookmark?.collegeName);

    // Try getting complete college data from the Map (keyed by bookmarkId)
    const completeCollege = completeCollegeData.get(bookmarkIdArg);
    console.log('🔍 DEBUG: Complete college data from Map:', completeCollege?.name);

    if (completeCollege) {
      setCollegeDetailsModal({ open: true, college: completeCollege });
      return;
    }

    // Fallback: build college object from the bookmark itself
    if (bookmark) {
      const collegeData = bookmark.college || (typeof bookmark.collegeId === 'object' ? bookmark.collegeId : null) || bookmark;
      const predictionData = bookmark.predictionData || {};

      const fallbackCollege = {
        _id: collegeData._id || bookmarkIdArg,
        id: collegeData.id || bookmarkIdArg,
        name: collegeData.name || bookmark.collegeName || bookmark.name,
        collegeType: collegeData.collegeType || collegeData.type || bookmark.type,
        location: collegeData.location || bookmark.location,
        fees: collegeData.fees || predictionData.fees,
        placements: collegeData.placements,
        rankings: collegeData.rankings,
        branches: collegeData.branches,
        facilities: collegeData.facilities,
        established: collegeData.established,
        affiliation: collegeData.affiliation,
        contact: collegeData.contact || bookmark.contact,
        website: collegeData.website || bookmark.website,
        imageUrl: collegeData.imageUrl || bookmark.imageUrl,
        nirfRank: collegeData.rankings?.nirf || collegeData.nirfRank,
        bookmarkId: bookmark.bookmarkId,
        priority: bookmark.priority,
        notes: bookmark.notes,
        tags: bookmark.tags,
        probability: bookmark.probability || predictionData.probability,
        predictionData: bookmark.predictionData,
        ...collegeData,
      };

      console.log('🔍 DEBUG: Using fallback college data for:', fallbackCollege.name);
      setCollegeDetailsModal({ open: true, college: fallbackCollege });
    } else {
      console.log('🔍 DEBUG: No college found for bookmarkId:', bookmarkIdArg);
    }
  };

  const handleUpdateNotes = async (collegeId, notes) => {
    try {
      const college = bookmarkedColleges.find(c => getBookmarkId(c) === collegeId);
      if (college?.bookmarkId) {
        await authAPI.updateBookmark(college.bookmarkId, { notes });
      }
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, notes } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    } catch (error) {
      console.error('Error updating notes:', error);
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, notes } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    }
  };

  const handleUpdateTags = async (collegeId, tags) => {
    try {
      const college = bookmarkedColleges.find(c => getBookmarkId(c) === collegeId);
      if (college?.bookmarkId) {
        await authAPI.updateBookmark(college.bookmarkId, { tags });
      }
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, tags } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    } catch (error) {
      console.error('Error updating tags:', error);
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, tags } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    }
  };

  const handleUpdatePriority = async (collegeId, priority) => {
    try {
      const college = bookmarkedColleges.find(c => getBookmarkId(c) === collegeId);
      if (college?.bookmarkId) {
        await authAPI.updateBookmark(college.bookmarkId, { priority });
      }
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, priority } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    } catch (error) {
      console.error('Error updating priority:', error);
      const updated = bookmarkedColleges.map(c =>
        getBookmarkId(c) === collegeId ? { ...c, priority } : c
      );
      setBookmarkedColleges(updated);
      persistBookmarksToLocalStorage(updated);
    }
  };

  const handleCreateList = (listName) => {
    const newList = {
      id: `custom_${Date.now()}`,
      name: listName,
      type: 'custom',
      isDefault: false,
      description: `Custom list: ${listName}`
    };
    setBookmarkLists(prev => [...prev, newList]);
  };

  const handleDeleteList = (listId) => {
    setBookmarkLists(prev => prev?.filter(list => list?.id !== listId));
    if (activeList === listId) {
      setActiveList('all');
    }
  };

  const handleRenameList = (listId, newName) => {
    setBookmarkLists(prev =>
      prev?.map(list =>
        list?.id === listId ? { ...list, name: newName } : list
      )
    );
  };

  const performBulkRemove = async () => {
    try {
      // Get the actual bookmark objects for selected IDs
      const selectedBookmarkObjects = selectedBookmarks.map(id =>
        bookmarkedColleges?.find(c => (c.collegeId || c._id || c.id || c.bookmarkId) === id)
      ).filter(Boolean);

      // Try bulk API call first
      await Promise.all(selectedBookmarkObjects.map(bookmark => authAPI.removeBookmark(bookmark)));
    } catch (error) {
      console.log('Bulk API remove failed, trying localStorage fallback');
      // Fallback to localStorage
      try {
        let userId = 'anonymous';
        try {
          const currentUser = await authAPI.getCurrentUser();
          userId = currentUser.data?.user?.id || 'anonymous';
        } catch (authError) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userId = storedUser.id || 'anonymous';
        }

        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
        const updatedBookmarks = bookmarks.filter(c => !selectedBookmarks.includes(c.collegeId || c._id || c.id || c.bookmarkId));
        localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));
      } catch (localStorageError) {
        console.error('localStorage fallback failed:', localStorageError);
      }
    }

    // Update state regardless of API success
    setBookmarkedColleges(prev => prev.filter(c => !selectedBookmarks.includes(c.collegeId || c._id || c.id || c.bookmarkId)));
    setSelectedBookmarks([]);
    setShowBulkActions(false);
  };

  const handleBulkRemove = () => {
    if (!selectedBookmarks?.length) return;

    setConfirmDialog({
      open: true,
      message: `Are you sure you want to remove ${selectedBookmarks?.length} bookmark(s)?`,
      confirmLabel: 'Remove',
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        await performBulkRemove();
      },
    });
  };

  const handleBulkMove = async (targetListId) => {
    try {
      // Get the actual bookmark objects for selected IDs
      const selectedBookmarkObjects = selectedBookmarks.map(id =>
        bookmarkedColleges?.find(c => (c.collegeId || c._id || c.id || c.bookmarkId) === id)
      ).filter(Boolean);

      // Try bulk API call first
      await Promise.all(selectedBookmarkObjects.map(bookmark => {
        if (bookmark?.bookmarkId) {
          return authAPI.updateBookmark(bookmark.bookmarkId, { listId: targetListId });
        }
        return Promise.resolve();
      }));
    } catch (error) {
      console.log('Bulk API move failed, trying localStorage fallback');
      // Fallback to localStorage
      try {
        let userId = 'anonymous';
        try {
          const currentUser = await authAPI.getCurrentUser();
          userId = currentUser.data?.user?.id || 'anonymous';
        } catch (authError) {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          userId = storedUser.id || 'anonymous';
        }

        const bookmarks = JSON.parse(localStorage.getItem(`bookmarks_${userId}`) || '[]');
        const updatedBookmarks = bookmarks.map(c => {
          if (selectedBookmarks.includes(c.collegeId || c._id || c.id || c.bookmarkId)) {
            return { ...c, listId: targetListId };
          }
          return c;
        });
        localStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));
      } catch (localStorageError) {
        console.error('localStorage fallback failed:', localStorageError);
      }
    }

    // Update state regardless of API success
    setBookmarkedColleges(prev => prev.map(c => {
      if (selectedBookmarks.includes(c.collegeId || c._id || c.id || c.bookmarkId)) {
        return { ...c, listId: targetListId };
      }
      return c;
    }));
    setSelectedBookmarks([]);
    setShowBulkActions(false);
  };

  const handleBulkExport = () => {
    setIsExportModalOpen(true);
  };

  const handleBulkShare = async () => {
    try {
      // Get the actual bookmark objects for selected IDs
      const selectedBookmarkObjects = selectedBookmarks.map(id =>
        bookmarkedColleges?.find(c => (c.collegeId || c._id || c.id || c.bookmarkId) === id)
      ).filter(Boolean);

      const shareText = selectedBookmarkObjects.map(college => {
        const name = college?.name || college?.collegeName;
        const location = typeof college?.location === 'string' ? college.location :
          `${college?.location?.city || ''}, ${college?.location?.state || ''}`;
        const prob = college?.probability || college?.predictionData?.probability || 0;
        return `${name} - ${location} (${prob}% chance)`;
      }).join('\n');

      const fullText = `My College Bookmarks:\n\n${shareText}\n\nCheck out more at: ${window.location.href}`;

      if (navigator.share) {
        await navigator.share({
          title: 'My College Bookmarks',
          text: fullText
        });
      } else {
        await navigator.clipboard.writeText(fullText);
        alert(`${selectedBookmarks.length} bookmarks copied to clipboard!`);
      }
    } catch (error) {
      console.error('Error sharing bookmarks:', error);
      alert('Failed to share bookmarks. Please try again.');
    }
  };

  const handleExport = (exportConfig) => {
    try {
      const selectedColleges = exportConfig.includeSelected
        ? selectedBookmarks.map(id => bookmarkedColleges?.find(c => (c.collegeId || c._id || c.id || c.bookmarkId) === id)).filter(Boolean)
        : filteredColleges;

      let content = '';
      let filename = '';
      let mimeType = '';

      switch (exportConfig.format) {
        case 'csv':
          content = 'College Name,Location,Type,Probability,Fees,Rank,Priority,Notes\n';
          content += selectedColleges.map(college => {
            const name = (college?.name || college?.collegeName || '').replace(/,/g, ';;');
            const location = typeof college?.location === 'string' ? college.location :
              `${college?.location?.city || ''}, ${college?.location?.state || ''}`;
            const type = college?.collegeType || college?.type || '';
            const prob = college?.probability || college?.predictionData?.probability || 0;
            const fees = college?.fees?.annualTuitionFee || college?.fees || 0;
            const rank = college?.nirfRank || college?.rankings?.nirf || 'N/A';
            const priority = college?.priority || '';
            const notes = (college?.notes || '').replace(/,/g, ';;');
            return `${name},${location},${type},${prob}%,${fees},${rank},${priority},${notes}`;
          }).join('\n');
          filename = 'bookmarks.csv';
          mimeType = 'text/csv';
          break;

        case 'json':
          content = JSON.stringify(selectedColleges, null, 2);
          filename = 'bookmarks.json';
          mimeType = 'application/json';
          break;

        case 'pdf':
          // Simple text-based PDF content (in real app, use a PDF library)
          content = selectedColleges.map(college => {
            const name = college?.name || college?.collegeName;
            const location = typeof college?.location === 'string' ? college.location :
              `${college?.location?.city || ''}, ${college?.location?.state || ''}`;
            const prob = college?.probability || college?.predictionData?.probability || 0;
            const fees = college?.fees?.annualTuitionFee || college?.fees || 0;
            return `${name}\n${location}\nProbability: ${prob}% | Fees: ₹${fees}\n---`;
          }).join('\n\n');
          filename = 'bookmarks.txt';
          mimeType = 'text/plain';
          break;
      }

      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('Exported', selectedColleges.length, 'bookmarks as', exportConfig.format);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export bookmarks. Please try again.');
    }
  };

  const handleClearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  // Resolve bookmark to college object for comparison - merge all available data
  // Backend API often returns 404 for bookmark colleges (from CET/prediction), so we need rich local data.
  const getCollegeFromBookmark = (bookmark) => {
    if (!bookmark) return null;
    const college = bookmark?.college || bookmark?.collegeId;
    const id = typeof college === 'object' && college !== null
      ? (college._id || college.id)
      : (college || bookmark?._id || bookmark?.id || bookmark?.bookmarkId);
    const name = bookmark?.collegeName || bookmark?.name || (typeof college === 'object' ? college?.name : '') || 'Unknown';
    if (!id) return null;

    const pd = bookmark?.predictionData || {};
    const base = typeof college === 'object' && college !== null ? { ...college } : {};

    return {
      _id: id,
      id,
      name: name || base.name,
      shortName: base.shortName || name?.split(' ').slice(-1)[0] || name,
      collegeType: base.collegeType || base.type || pd.cetDetails?.examType || 'N/A',
      location: base.location || bookmark?.location,
      fees: base.fees || pd.fees || (typeof pd.fees === 'number' ? { annualTuitionFee: pd.fees } : undefined),
      placements: base.placements || (pd.placement && typeof pd.placement === 'object'
        ? pd.placement
        : pd.placement?.averagePackage ? { averagePackage: pd.placement.averagePackage } : undefined),
      rankings: base.rankings || base.ranking,
      branches: base.branches || (pd.cetDetails?.branch ? [pd.cetDetails.branch] : base.courses),
      courses: base.courses || base.branches,
      probability: pd.probability,
      matchPercentage: pd.probability,
      ...base,
    };
  };

  const handleCompareSelected = () => {
    if (!selectedBookmarks?.length) {
      setCompareToast({ open: true, message: 'Please select 2–4 colleges to compare. Use "Select Multiple" and check the colleges you want.' });
      setShowBulkActions(true);
      setTimeout(() => setCompareToast(prev => ({ ...prev, open: false })), 4000);
      return;
    }
    const collegesToCompare = selectedBookmarks
      .map(id => {
        const bookmark = bookmarkedColleges?.find(c => getBookmarkId(c) === id);
        return getCollegeFromBookmark(bookmark);
      })
      .filter(Boolean);
    if (collegesToCompare.length < 2) {
      setCompareToast({ open: true, message: 'Select at least 2 colleges to compare.' });
      setTimeout(() => setCompareToast(prev => ({ ...prev, open: false })), 3000);
      return;
    }
    const limited = collegesToCompare.slice(0, 4);
    sessionStorage.setItem('comparisonColleges_bookmarks', JSON.stringify(limited));
    navigate('/college-details-comparison', { state: { colleges: limited, source: 'bookmarks' } });
  };

  // Update bulk actions visibility
  useEffect(() => {
    setShowBulkActions(selectedBookmarks?.length > 0);
  }, [selectedBookmarks]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-16 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
              <button
                onClick={() => navigate('/student-dashboard')}
                className="hover:text-foreground transition-smooth"
              >
                Dashboard
              </button>
              <Icon name="ChevronRight" size={14} />
              <span>Bookmarks</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="font-heading font-bold text-2xl lg:text-3xl text-foreground mb-2">
                  Bookmarks & Saved Colleges
                </h1>
                <p className="text-muted-foreground">
                  Manage your saved colleges and organize them into custom lists
                </p>
              </div>

              <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                <Button
                  variant="outline"
                  onClick={() => navigate('/college-search-filter')}
                  iconName="Plus"
                  iconPosition="left"
                  iconSize={16}
                >
                  Add More Colleges
                </Button>

                <Button
                  variant="outline"
                  onClick={handleCompareSelected}
                  iconName="GitCompare"
                  iconPosition="left"
                  iconSize={16}
                >
                  Compare Selected
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setShowStatistics(!showStatistics)}
                  iconName="BarChart3"
                  iconPosition="left"
                  iconSize={16}
                >
                  Statistics
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar - Lists */}
            <div className="lg:col-span-3">
              <BookmarkList
                lists={bookmarkLists}
                activeList={activeList}
                onListChange={setActiveList}
                onCreateList={handleCreateList}
                onDeleteList={handleDeleteList}
                onRenameList={handleRenameList}
                bookmarkCounts={bookmarkCounts}
              />
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-9 space-y-6">
              {/* Statistics Panel */}
              {showStatistics && (
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-lg text-foreground">
                      Bookmark Statistics
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowStatistics(false)}
                      iconName="X"
                      iconSize={16}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">{bookmarkCounts?.all || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Bookmarks</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-success">{bookmarkCounts?.highChance || 0}</div>
                      <div className="text-sm text-muted-foreground">High Chance (&gt;80%)</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-warning">{bookmarkCounts?.highPriority || 0}</div>
                      <div className="text-sm text-muted-foreground">High Priority</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-info">{bookmarkCounts?.recent || 0}</div>
                      <div className="text-sm text-muted-foreground">Recently Added</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medium Chance:</span>
                        <span className="font-medium">{bookmarkCounts?.mediumChance || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Low Chance:</span>
                        <span className="font-medium">{bookmarkCounts?.lowChance || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Predicted Colleges:</span>
                        <span className="font-medium">{bookmarkCounts?.predicted || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View Mode Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">View:</span>
                  <div className="flex bg-muted rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      iconName="Grid3x3"
                      iconSize={14}
                      className="px-2 py-1"
                    />
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      iconName="List"
                      iconSize={14}
                      className="px-2 py-1"
                    />
                    <Button
                      variant={viewMode === 'compact' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('compact')}
                      iconName="LayoutGrid"
                      iconSize={14}
                      className="px-2 py-1"
                    />
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkActions(!showBulkActions)}
                  iconName="CheckSquare"
                  iconPosition="left"
                  iconSize={14}
                >
                  {showBulkActions ? 'Cancel Selection' : 'Select Multiple'}
                </Button>
              </div>
              {/* Search and Filter */}
              <SearchAndFilter
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortBy={sortBy}
                onSortChange={setSortBy}
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />

              {/* Bulk Actions */}
              {showBulkActions && (
                <BulkActions
                  selectedCount={selectedBookmarks?.length}
                  totalCount={filteredColleges?.length}
                  onSelectAll={handleSelectAll}
                  onDeselectAll={handleDeselectAll}
                  onBulkRemove={handleBulkRemove}
                  onBulkMove={handleBulkMove}
                  onBulkExport={handleBulkExport}
                  onBulkShare={handleBulkShare}
                  lists={bookmarkLists?.filter(list => !list?.isDefault)}
                />
              )}

              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="font-heading font-semibold text-lg text-foreground">
                    {bookmarkLists?.find(list => list?.id === activeList)?.name || 'All Bookmarks'}
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    ({filteredColleges?.length} college{filteredColleges?.length !== 1 ? 's' : ''})
                  </span>
                  {searchQuery && (
                    <span className="text-sm text-info">
                      for "{searchQuery}"
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {Object.keys(filters)?.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      iconName="X"
                      iconPosition="left"
                      iconSize={14}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* College Cards */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading bookmarks...</p>
                </div>
              ) : filteredColleges?.length > 0 ? (
                <div className={
                  viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' :
                    viewMode === 'list' ? 'space-y-4' :
                      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                }>
                  {filteredColleges?.map((college) => {
                    const bookmarkKey = college?.bookmarkId || college?.collegeId || college?._id || college?.id;
                    // Merge complete college data (with fees/rankings/placements) from the map
                    const completeData = completeCollegeData.get(getBookmarkId(college));
                    const enrichedBookmark = completeData
                      ? {
                        ...college,
                        college: {
                          ...(college?.college || {}),
                          ...completeData,
                        }
                      }
                      : college;
                    return (
                      <BookmarkCard
                        key={bookmarkKey}
                        college={enrichedBookmark}
                        onRemove={handleRemoveBookmark}
                        onShare={handleShareBookmark}
                        onViewDetails={handleViewDetails}
                        onUpdateNotes={handleUpdateNotes}
                        onUpdateTags={handleUpdateTags}
                        onUpdatePriority={handleUpdatePriority}
                        isSelected={selectedBookmarks?.some(id => id === getBookmarkId(college))}
                        onSelect={handleSelectBookmark}
                        showCheckbox={showBulkActions}
                        viewMode={viewMode}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="Bookmark" size={24} className="text-muted-foreground" />
                  </div>
                  <h3 className="font-heading font-medium text-lg text-foreground mb-2">
                    No bookmarks found
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || Object.keys(filters)?.length > 0
                      ? 'Try adjusting your search or filters' : 'Start by bookmarking colleges from your prediction results'
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <Button
                      onClick={() => navigate('/college-prediction-engine')}
                      iconName="Target"
                      iconPosition="left"
                      iconSize={16}
                    >
                      Get Predictions
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/college-search-filter')}
                      iconName="Search"
                      iconPosition="left"
                      iconSize={16}
                    >
                      Search Colleges
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        selectedColleges={selectedBookmarks?.map(id =>
          bookmarkedColleges?.find(c => getBookmarkId(c) === id)
        )?.filter(Boolean)}
        onExport={handleExport}
      />

      {/* College Details Modal */}
      <CollegeDetailsModal
        isOpen={collegeDetailsModal.open}
        onClose={() => setCollegeDetailsModal({ open: false, college: null })}
        collegeData={collegeDetailsModal.college}
        collegeId={null} // Force it to fetch using name fallback from collegeData if necessary
      />
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
      {/* Compare toast - guides user when no selection */}
      {compareToast.open && (
        <div className="fixed inset-0 z-300 flex items-start justify-center pointer-events-none">
          <div className="mt-24 pointer-events-auto">
            <div className="px-5 py-4 rounded-lg shadow-xl border border-primary/30 bg-card text-foreground text-sm flex items-center gap-2 max-w-md">
              <Icon name="Info" size={18} className="text-primary flex-shrink-0" />
              <span className="font-medium">{compareToast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarksSavedColleges;