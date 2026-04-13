import React from 'react';
import Button from './Button';
import Icon from '../AppIcon';

const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'destructive',
}) => {
  if (!open) return null;

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
  };

  return (
    <div className="fixed inset-0 z-300 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-modal max-w-sm w-full mx-4">
        <div className="p-4 border-b border-border flex items-center">
          <Icon name="AlertTriangle" size={18} className="text-warning mr-2" />
          <h3 className="font-heading font-semibold text-sm text-foreground">
            {title}
          </h3>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

