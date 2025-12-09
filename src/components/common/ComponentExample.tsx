import React from 'react';
import { useToast } from './Toast';
import ConfirmDialog from './ConfirmDialog';

// Example usage component
const ExampleUsage: React.FC = () => {
    const toast = useToast();
    const [showConfirm, setShowConfirm] = React.useState(false);

    const handleDelete = () => {
        // Your delete logic here
        toast.success('Item deleted successfully!');
    };

    return (
        <div>
            {/* Toast Examples */}
            <button onClick={() => toast.success('Success message!')}>
                Show Success
            </button>
            <button onClick={() => toast.error('Error message!')}>
                Show Error
            </button>
            <button onClick={() => toast.warning('Warning message!')}>
                Show Warning
            </button>
            <button onClick={() => toast.info('Info message!')}>
                Show Info
            </button>

            {/* Confirm Dialog Example */}
            <button onClick={() => setShowConfirm(true)}>
                Delete Item
            </button>

            <ConfirmDialog
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
};

export default ExampleUsage;
