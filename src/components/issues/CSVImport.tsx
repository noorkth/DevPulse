import React, { useState, useRef } from 'react';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { parseIssuesCSV, downloadCSVTemplate } from '../../utils/csvParser';
import { useToast } from '../common/Toast';
import './CSVImport.css';

interface CSVImportProps {
    onImportComplete: () => void;
}

const CSVImport: React.FC<CSVImportProps> = ({ onImportComplete }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importResults, setImportResults] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResults(null);

        try {
            // Parse CSV
            const parseResult = await parseIssuesCSV(file);

            if (!parseResult.success) {
                toast.error(`CSV validation failed: ${parseResult.errors?.join(', ')}`);
                setIsImporting(false);
                return;
            }

            // Import issues
            const results = await (window.api.issues as any).bulkImport(parseResult.data);
            setImportResults(results);

            if (results.success > 0) {
                toast.success(`Successfully imported ${results.success} issues!`);
                onImportComplete();
            }

            if (results.failed > 0) {
                toast.warning(`Failed to import ${results.failed} issues. Check details.`);
            }
        } catch (error: any) {
            toast.error(`Import failed: ${error.message}`);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <>
            <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                📥 Import CSV
            </Button>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Import Issues from CSV"
                size="lg"
            >
                <div className="csv-import-content">
                    <div className="import-instructions">
                        <h4>📋 CSV Format Instructions</h4>
                        <p>Your CSV file must include the following columns:</p>

                        <div className="csv-structure">
                            <table className="csv-table">
                                <thead>
                                    <tr>
                                        <th>Column</th>
                                        <th>Required</th>
                                        <th>Format</th>
                                        <th>Example</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td><code>title</code></td>
                                        <td>✅ Yes</td>
                                        <td>Text</td>
                                        <td>Login Bug</td>
                                    </tr>
                                    <tr>
                                        <td><code>description</code></td>
                                        <td>No</td>
                                        <td>Text</td>
                                        <td>Users cannot login...</td>
                                    </tr>
                                    <tr>
                                        <td><code>severity</code></td>
                                        <td>No</td>
                                        <td>low, medium, high, critical</td>
                                        <td>high</td>
                                    </tr>
                                    <tr>
                                        <td><code>status</code></td>
                                        <td>No</td>
                                        <td>open, in_progress, resolved, closed</td>
                                        <td>open</td>
                                    </tr>
                                    <tr>
                                        <td><code>assignedTo</code></td>
                                        <td>No</td>
                                        <td>Email</td>
                                        <td>john@example.com</td>
                                    </tr>
                                    <tr>
                                        <td><code>project</code></td>
                                        <td>No</td>
                                        <td>Project Name</td>
                                        <td>Mobile App</td>
                                    </tr>
                                    <tr>
                                        <td><code>feature</code></td>
                                        <td>No</td>
                                        <td>Feature Name</td>
                                        <td>Authentication</td>
                                    </tr>
                                    <tr>
                                        <td><code>estimatedTime</code></td>
                                        <td>No</td>
                                        <td>Number (hours)</td>
                                        <td>8</td>
                                    </tr>
                                    <tr>
                                        <td><code>tags</code></td>
                                        <td>No</td>
                                        <td>Comma-separated</td>
                                        <td>"bug,urgent,login"</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="template-download">
                            <Button variant="secondary" onClick={downloadCSVTemplate}>
                                📥 Download Template
                            </Button>
                        </div>
                    </div>

                    <div className="file-upload-section">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <Button
                            variant="primary"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                        >
                            {isImporting ? '⏳ Importing...' : '📂 Choose CSV File'}
                        </Button>
                    </div>

                    {importResults && (
                        <div className="import-results">
                            <h4>Import Results</h4>
                            <div className="results-summary">
                                <div className="result-item success">
                                    <span className="result-icon">✅</span>
                                    <span className="result-text">
                                        Successfully imported: <strong>{importResults.success}</strong>
                                    </span>
                                </div>
                                {importResults.failed > 0 && (
                                    <div className="result-item error">
                                        <span className="result-icon">❌</span>
                                        <span className="result-text">
                                            Failed: <strong>{importResults.failed}</strong>
                                        </span>
                                    </div>
                                )}
                            </div>

                            {importResults.errors && importResults.errors.length > 0 && (
                                <div className="error-details">
                                    <h5>Errors:</h5>
                                    <ul>
                                        {importResults.errors.map((error: string, index: number) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default CSVImport;
