import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

function App() {
    const [file, setFile] = useState(null);
    const [fileError, setFileError] = useState('');
    const [summary, setSummary] = useState('');
    const [history, setHistory] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('summaryHistory');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        if (selected.size > MAX_FILE_SIZE) {
            setFile(null);
            setFileError('File is too large (maximum 8 MB');
        } else {
            setFile(selected);
            setFileError('');
        }
        setSummary('');
    };

    const handleUpload = async () => {
        if (!file) {
            alert('Please select a PDF file');
            return;
        }

        setIsProcessing(true);
        setSummary('');
        setFileError('');

        const formData = new FormData();
        formData.append('pdf', file);

        try {
            const response = await axios.post(
                'http://localhost:5000/upload',
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            const newSummary = response.data.summary;
            setSummary(newSummary);
            const updatedHistory = [{ fileName: file.name, summary: newSummary }, ...history].slice(0, 5);
            setHistory(updatedHistory);
            localStorage.setItem('summaryHistory', JSON.stringify(updatedHistory));

        } catch (err) {
            setSummary('');
            const message = err.response?.status === 413
                ? 'File exceeds 8 MB'
                : 'Error processing file';
            alert(message);
        } finally {
            setIsProcessing(false);
            setFile(null);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text)
            .then(() => {
                setCopySuccess(true);
                setTimeout(() => setCopySuccess(false), 1500);
            })
            .catch(() => alert('Copy failed'));
    };

    const handleDelete = (index) => {
        const updated = history.filter((_, i) => i !== index);
        setHistory(updated);
        localStorage.setItem('summaryHistory', JSON.stringify(updated));
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
            <div className="max-w-xl w-full">
                <h1 className="text-4xl font-bold text-center mb-4">PDF Summary AI</h1>

                <div className="mb-6">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-900 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
                    />
                    {fileError && <p className="mt-2 text-sm text-red-600">{fileError}</p>}

                    <div className="mt-4 text-center">
                        {file && !isProcessing && (
                            <button
                                onClick={handleUpload}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Upload & Process
                            </button>
                        )}
                        {isProcessing && (
                            <p className="text-blue-600 font-medium">Processing...</p>
                        )}
                    </div>
                </div>

                {/* Результат */}
                {summary && (
                    <div className="mb-8 bg-white p-4 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-2">Summary</h2>
                        <p className="text-gray-800">{summary}</p>
                    </div>
                )}

                {/* История */}
                {history.length > 0 && (
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-2xl font-semibold mb-4">History</h2>
                        <ul className="space-y-4">
                            {history.map((item, index) => (
                                <li key={index} className="border p-3 rounded flex flex-col">
                                    <span className="text-sm text-gray-500 mb-1">{item.fileName}</span>
                                    <p className="text-gray-800 mb-2">{item.summary}</p>
                                    <div className="mt-auto flex justify-end space-x-4">
                                        <button
                                            onClick={() => handleCopy(item.summary)}
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            {copySuccess ? 'Copied!' : 'Copy'}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(index)}
                                            className="text-red-600 hover:underline text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;