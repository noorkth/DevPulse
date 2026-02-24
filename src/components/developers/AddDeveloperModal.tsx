import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import './AddDeveloperModal.css';

interface AddDeveloperModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (developer: any) => void;
    developer?: any; // Optional developer for edit mode
}

const AddDeveloperModal: React.FC<AddDeveloperModalProps> = ({ isOpen, onClose, onSuccess, developer }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        seniorityLevel: 'junior',
        role: 'developer',
        skills: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize form data when modal opens or developer changes
    React.useEffect(() => {
        if (isOpen) {
            if (developer) {
                // Edit mode
                setFormData({
                    fullName: developer.fullName || '',
                    email: developer.email || '',
                    seniorityLevel: developer.seniorityLevel || 'junior',
                    role: developer.role || 'developer',
                    skills: Array.isArray(JSON.parse(developer.skills || '[]'))
                        ? JSON.parse(developer.skills || '[]').join(', ')
                        : '',
                });
            } else {
                // Create mode - reset
                setFormData({
                    fullName: '',
                    email: '',
                    seniorityLevel: 'junior',
                    role: 'developer',
                    skills: '',
                });
            }
        }
    }, [isOpen, developer]);

    const handleChange = (e: React.ChangeEvent<any>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Parse skills from comma-separated string
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(Boolean);

            const payload = {
                ...formData,
                skills: skillsArray
            };

            let result;
            if (developer) {
                // Update
                result = await window.api.developers.update(developer.id, payload);
            } else {
                // Create
                result = await window.api.developers.create(payload);
            }

            onSuccess(result);
            onClose();
        } catch (err: any) {
            console.error('Error saving developer:', err);
            setError(err.message || 'Failed to save developer');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={developer ? "Edit Team Member" : "Add New Team Member"}
            size="md"
        >
            <form onSubmit={handleSubmit} className="add-developer-form">
                {error && <div className="error-message">{error}</div>}

                <Input
                    label="Full Name"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="e.g. John Doe"
                    required
                />

                <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. john@example.com"
                    required
                />

                <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="developer">Developer</option>
                        <option value="manager">Project Manager</option>
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="seniorityLevel">Seniority Level</label>
                    <select
                        id="seniorityLevel"
                        name="seniorityLevel"
                        value={formData.seniorityLevel}
                        onChange={handleChange}
                        className="form-select"
                    >
                        <option value="junior">Junior</option>
                        <option value="mid">Mid-Level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                        <option value="principal">Principal</option>
                    </select>
                </div>

                <Input
                    label="Skills (comma separated)"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="e.g. React, Node.js, TypeScript"
                />

                <div className="modal-actions">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? 'Saving...' : (developer ? 'Update Member' : 'Create Member')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddDeveloperModal;
