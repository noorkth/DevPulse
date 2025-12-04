import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import './Developers.css';

const Developers: React.FC = () => {
    const [developers, setDevelopers] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeveloper, setSelectedDeveloper] = useState<any>(null);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        skills: '',
        seniorityLevel: 'mid',
    });

    useEffect(() => {
        loadDevelopers();
    }, []);

    const loadDevelopers = async () => {
        try {
            const data = await window.api.developers.getAll();
            const developersWithStats = await Promise.all(
                data.map(async (dev: any) => {
                    const stats = await window.api.developers.getProductivityScore(dev.id);
                    return { ...dev, stats };
                })
            );
            setDevelopers(developersWithStats);
        } catch (error) {
            console.error('Error loading developers:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);
            await window.api.developers.create({
                ...formData,
                skills: skillsArray,
            });

            setIsModalOpen(false);
            resetForm();
            loadDevelopers();
        } catch (error) {
            console.error('Error creating developer:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            fullName: '',
            email: '',
            skills: '',
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

    return (
        <div className="developers-page">
            <div className="page-header">
                <h2>Developers</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ New Developer</Button>
            </div>

            <div className="developers-grid">
                {developers.map((developer) => {
                    const skills = JSON.parse(developer.skills || '[]');

                    return (
                        <Card key={developer.id}>
                            <div className="developer-card">
                                <div className="developer-header">
                                    <div className="developer-avatar">
                                        {developer.fullName.split(' ').map((n: string) => n[0]).join('')}
                                    </div>
                                    <div className="developer-info">
                                        <h3>{developer.fullName}</h3>
                                        <p className="developer-email">{developer.email}</p>
                                        <span
                                            className="seniority-badge"
                                            style={{ backgroundColor: getSeniorityColor(developer.seniorityLevel) }}
                                        >
                                            {developer.seniorityLevel}
                                        </span>
                                    </div>
                                </div>

                                <div className="developer-skills">
                                    {skills.map((skill: string, idx: number) => (
                                        <span key={idx} className="skill-tag">{skill}</span>
                                    ))}
                                </div>

                                <div className="developer-stats">
                                    <div className="stat-item">
                                        <span className="stat-value">{developer._count?.issues || 0}</span>
                                        <span className="stat-label">Total Issues</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{developer.stats?.resolvedCount || 0}</span>
                                        <span className="stat-label">Resolved</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-value">{developer.stats?.score || 0}</span>
                                        <span className="stat-label">Productivity</span>
                                    </div>
                                </div>

                                {developer.stats?.avgFixQuality && (
                                    <div className="quality-display">
                                        <span className="quality-label">Avg Fix Quality:</span>
                                        <div className="quality-stars">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <span key={i} className={i < Math.round(developer.stats.avgFixQuality) ? 'filled' : ''}>
                                                    ⭐
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="New Developer"
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Create</Button>
                    </>
                }
            >
                <form onSubmit={handleSubmit} className="developer-form">
                    <Input
                        label="Full Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                    />

                    <Input
                        label="Email"
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
                        <label className="input-label">Seniority Level</label>
                        <select
                            className="input"
                            value={formData.seniorityLevel}
                            onChange={(e) => setFormData({ ...formData, seniorityLevel: e.target.value })}
                        >
                            <option value="junior">Junior</option>
                            <option value="mid">Mid</option>
                            <option value="senior">Senior</option>
                            <option value="lead">Lead</option>
                            <option value="principal">Principal</option>
                        </select>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Developers;
