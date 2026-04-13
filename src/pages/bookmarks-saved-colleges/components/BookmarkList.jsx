import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const BookmarkList = ({ 
  lists, 
  activeList, 
  onListChange, 
  onCreateList, 
  onDeleteList, 
  onRenameList,
  bookmarkCounts 
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [editingList, setEditingList] = useState(null);
  const [editName, setEditName] = useState('');

  const handleCreateList = () => {
    if (newListName?.trim()) {
      onCreateList(newListName?.trim());
      setNewListName('');
      setIsCreating(false);
    }
  };

  const handleRenameList = (listId) => {
    if (editName?.trim()) {
      onRenameList(listId, editName?.trim());
      setEditingList(null);
      setEditName('');
    }
  };

  const startEditing = (list) => {
    setEditingList(list?.id);
    setEditName(list?.name);
  };

  const getListIcon = (listType) => {
    switch (listType) {
      case 'favorites': return 'Heart';
      case 'backup': return 'Shield';
      case 'dream': return 'Star';
      case 'applied': return 'Send';
      case 'rejected': return 'X';
      case 'recent': return 'Clock';
      case 'predicted': return 'Target';
      default: return 'Folder';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-lg text-foreground">My Lists</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          iconName="Plus"
          iconPosition="left"
          iconSize={14}
        >
          New List
        </Button>
      </div>
      {/* Create New List */}
      {isCreating && (
        <div className="mb-4 p-3 bg-muted rounded-lg">
          <Input
            type="text"
            placeholder="Enter list name"
            value={newListName}
            onChange={(e) => setNewListName(e?.target?.value)}
            className="mb-2"
            onKeyPress={(e) => e?.key === 'Enter' && handleCreateList()}
          />
          <div className="flex space-x-2">
            <Button size="sm" onClick={handleCreateList}>
              Create
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setIsCreating(false);
                setNewListName('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {/* Lists */}
      <div className="space-y-2">
        {lists?.map((list) => (
          <div
            key={list?.id}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-smooth ${
              activeList === list?.id
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
            onClick={() => onListChange(list?.id)}
          >
            <div className="flex items-center space-x-3 flex-1">
              <Icon 
                name={getListIcon(list?.type)} 
                size={16} 
                className={activeList === list?.id ? 'text-primary-foreground' : 'text-muted-foreground'}
              />
              
              {editingList === list?.id ? (
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e?.target?.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e?.key === 'Enter') handleRenameList(list?.id);
                    if (e?.key === 'Escape') {
                      setEditingList(null);
                      setEditName('');
                    }
                  }}
                  onBlur={() => handleRenameList(list?.id)}
                  autoFocus
                />
              ) : (
                <div className="flex-1">
                  <div className={`font-medium ${
                    activeList === list?.id ? 'text-primary-foreground' : 'text-foreground'
                  }`}>
                    {list?.name}
                  </div>
                  {list?.description && (
                    <div className={`text-xs mt-1 ${
                      activeList === list?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {list?.description}
                    </div>
                  )}
                  <span className={`ml-2 text-sm ${
                    activeList === list?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}>
                    ({bookmarkCounts?.[list?.id] || 0})
                  </span>
                </div>
              )}
            </div>

            {/* List Actions */}
            {!list?.isDefault && activeList === list?.id && (
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e?.stopPropagation();
                    startEditing(list);
                  }}
                  className="w-6 h-6 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Icon name="Edit" size={12} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e?.stopPropagation();
                    onDeleteList(list?.id);
                  }}
                  className="w-6 h-6 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <Icon name="Trash2" size={12} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      {/* List Statistics */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="font-heading font-medium text-sm text-foreground mb-3">Quick Stats</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Bookmarks:</span>
            <span className="font-medium text-sm text-foreground">
              {Object.values(bookmarkCounts)?.reduce((a, b) => a + b, 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">High Priority:</span>
            <span className="font-medium text-sm text-warning">
              {bookmarkCounts?.highPriority || 0}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">High Chance (&gt;80%):</span>
            <span className="font-medium text-sm text-success">
              {bookmarkCounts?.highChance || 0}
            </span>
          </div>

          <div className="border-t border-border pt-3 mt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Medium:</span>
                <span className="font-medium">{bookmarkCounts?.mediumChance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Low:</span>
                <span className="font-medium">{bookmarkCounts?.lowChance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Predicted:</span>
                <span className="font-medium">{bookmarkCounts?.predicted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recent:</span>
                <span className="font-medium">{bookmarkCounts?.recent || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookmarkList;