import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import './Users.css';

const Users: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        skills: '',
        role: 'developer',
        seniorityLevel: 'mid',
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const data = await window.api.developers.getAll();
            const usersWithStats = await Promise.all(
                data.map(async (user: any) => {
                    const stats = await window.api.developers.getProductivityScore(user.id);
                    return { ...user, stats };
                })
            );
            setUsers(usersWithStats);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

            if (selectedUser) {
                await window.api.developers.update(selectedUser.id, {
                    ...formData,
                    skills: skillsArray,
                });
            } else {
                await window.api.developers.create({
                    ...formData,
                    skills: skillsArray,
                });
            }

            setIsModalOpen(false);
            resetForm();
            loadUsers();
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        const skillsString = Array.isArray(user.skills)
            ? user.skills.join(', ')
            : user.skills.split(',').map((s: string) => s.trim()).join(', ');

        setFormData({
            fullName: user.fullName,
            email: user.email,
            skills: skillsString,
            role: user.role || 'developer',
            seniorityLevel: user.seniorityLevel,
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setSelectedUser(null);
        setFormData({
            fullName: '',
            email: '',
            skills: '',
            role: 'developer',
            seniorityLevel: 'mid',
        });
    };

    const getSeniorityColor = (level: string) => {
        const colors: Record<string, string> = {
            junior: '#3b82f6',
            mid: '#10b981',
            senior: '#f59e0b',
            lead: '#8b5cf6',
            principal: '#ec4899',
        };
        return colors[level] || '#6b7280';
    };

    const getRoleBadgeColor = (role: string) => {
        return role === 'manager' ? '#ec4899' : '#6366f1';
    };

    // Separate users by role
    const allDevelopers = users.filter(user => user.role === 'developer');
    const allManagers = users.filter(user => user.role === 'manager');

    // Filter by search query
    const filterUsers = (userList: any[]) => {
        if (!searchQuery.trim()) return userList;

        const query = searchQuery.toLowerCase();
        return userList.filter(user =>
            user.fullName.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query) ||
            user.seniorityLevel.toLowerCase().includes(query)
        );
    };

    const developers = filterUsers(allDevelopers);
    const managers = filterUsers(allManagers);

    const renderUserCard = (user: any) => {
        // Safely parse skills
        let skills: string[] = [];
        try {
            if (typeof user.skills === 'string') {
                if (user.skills.startsWith('[')) {
                    skills = JSON.parse(user.skills);
                } else {
                    skills = user.skills.split(',').map((s: string) => s.trim());
                }
            } else if (Array.isArray(user.skills)) {
                skills = user.skills;
            }
        } catch (e) {
            skills = user.skills?.split(',').map((s: string) => s.trim()) || [];
        }

        return (
            <Card key={user.id}>
                <div className="user-card">
                    <div className="user-header">
                        <div className="user-avatar">
                            {user.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div className="user-info">
                            <h3>{user.fullName}</h3>
                            <p className="user-email">{user.email}</p>
                            <div className="user-badges">
                                <span
                                    className="role-badge"
                                    style={{ backgroundColor: getRoleBadgeColor(user.role || 'developer') }}
                                >
                                    {user.role === 'manager' ? '👔 Manager' : '👨‍💻 Developer'}
                                </span>
                                <span
                                    className="seniority-badge"
                                    style={{ backgroundColor: getSeniorityColor(user.seniorityLevel) }}
                                >
                                    {user.seniorityLevel}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="user-skills">
                        {skills.map((skill: string, idx: number) => (
                            <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                    </div>

                    {user.role === 'developer' && (
                        <div className="user-stats">
                            <div className="stat-item">
                                <span className="stat-value">{user._count?.issues || 0}</span>
                                <span className="stat-label">Total Issues</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user.stats?.resolvedCount || 0}</span>
                                <span className="stat-label">Resolved</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{user.stats?.score || 0}</span>
                                <span className="stat-label">Productivity</span>
                            </div>
                        </div>
                    )}

                    {user.role === 'developer' && user.stats?.avgFixQuality && (
                        <div className="quality-display">
                            <span className="quality-label">Avg Fix Quality:</span>
                            <div className="quality-stars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <span key={i} className={i < Math.round(user.stats.avgFixQuality) ? 'filled' : ''}>
                                        ⭐
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="user-actions">
                        <Button variant="secondary" size="sm" onClick={() => handleEdit(user)}>
                            Edit
                        </Button>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="users-page">
            <div className="page-header">
                <h2>👥 Team Users</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ Create User</Button>
            </div>

            {/* Search Bar */}
            <div className="search-container">
                <input
                    type="text"
                    className="search-input"
                    placeholder="🔍 Search by name, email, or seniority..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <div className="search-results-info">
                        Found: {managers.length + developers.length} user(s)
                        <button
                            className="clear-search"
                            onClick={() => setSearchQuery('')}
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {/* Project Managers Section */}
            <div className="section-container">
                <div className="section-header">
                    <h3>👔 Project Managers</h3>
                    <span className="count-badge">{managers.length}</span>
                </div>
                <div className="users-grid">
                    {managers.map((user) => renderUserCard(user))}
                    {managers.length === 0 && (
                        <div className="empty-section">No project managers yet</div>
                    )}
                </div>
            </div>

            {/* Developers Section */}
            <div className="section-container">
                <div className="section-header">
                    <h3>👨‍💻 Developers</h3>
                    <span className="count-badge">{developers.length}</span>
                </div>
                <div className="users-grid">
                    {developers.map((user) => renderUserCard(user))}
                    {developers.length === 0 && (
                        <div className="empty-section">No developers yet</div>
                    )}
                </div>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    resetForm();
                }}
                title={selectedUser ? 'Edit User' : 'Create User'}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>{selectedUser ? 'Update' : 'Create'}</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="user-form">
                    <Input
                        label="Full Name *"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />

                    <Input
                        label="Email *"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />

                    <Input
                        label="Skills (comma-separated)"
                        placeholder="React, Node.js, TypeScript"
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                    />

                    <div className="form-group">
                        <label className="input-label">Role *</label>
                        <div className="role-selection">
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="role"
                                    value="developer"
                                    checked={formData.role === 'developer'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                />
                                <span>👨‍💻 Developer</span>
                            </label>
                            <label className="radio-label">
                                <input
                                    type="radio"
                                    name="role"
                                    value="manager"
                                    checked={formData.role === 'manager'}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                />
                                <span>👔 Project Manager</span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="input-label">Seniority Level *</label>
                        <select
                            className="input"
                            value={formData.seniorityLevel}
                            onChange={(e) => setFormData({ ...formData, seniorityLevel: e.target.value })}
                        >
                            {formData.role === 'manager' ? (
                                <>
                                    <option value="mid">Mid-Level Manager</option>
                                    <option value="senior">Senior Manager</option>
                                    <option value="lead">Lead Manager</option>
                                    <option value="principal">Principal Manager</option>
                                </>
                            ) : (
                                <>
                                    <option value="junior">Junior</option>
                                    <option value="mid">Mid-Level</option>
                                    <option value="senior">Senior</option>
                                    <option value="lead">Lead</option>
                                    <option value="principal">Principal</option>
                                </>
                            )}
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Users;
