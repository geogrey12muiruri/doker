import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';
import { Document, Page, pdfjs } from 'react-pdf';

// Set the worker source to the static file in public/assets
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function Documents() {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showProposeModal, setShowProposeModal] = useState(false); // New state for propose modal
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [proposeForm, setProposeForm] = useState({ clause: '', proposedChange: '', justification: '' }); // Form state

  useEffect(() => {
    if (!user || !token) return;

    const fetchDocuments = async () => {
      try {
        const res = await fetch('http://localhost:3004/api/v1/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch documents');
        const data = await res.json();
        setDocuments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user, token]);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newDoc = {
      title: formData.get('title'),
      version: formData.get('version'),
      revision: formData.get('revision'),
      content: formData.get('content'),
      category: formData.get('category'),
    };

    try {
      const res = await fetch('http://localhost:3004/api/v1/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newDoc),
      });
      if (!res.ok) throw new Error('Failed to create document');
      const createdDoc = await res.json();
      setDocuments([...documents, createdDoc]);
      setShowCreateModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      const res = await fetch('http://localhost:3004/api/v1/documents/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const newDoc = await res.json();
      setDocuments([...documents, newDoc]);
      setShowUploadModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewDocument = async (docId) => {
    try {
      const res = await fetch(`http://localhost:3004/api/v1/documents/${docId}/content`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch document content');
      if (res.headers.get('Content-Type') === 'application/pdf') {
        const blob = await res.blob();
        setSelectedDocument({ id: docId, type: 'pdf', blob }); // Store docId for propose change
      } else {
        const { content } = await res.json();
        setSelectedDocument({ id: docId, type: 'text', content });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleProposeChange = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        `http://localhost:3004/api/v1/documents/${selectedDocument.id}/propose-change`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(proposeForm),
        }
      );
      if (!res.ok) throw new Error('Failed to propose change');
      const change = await res.json();
      setShowProposeModal(false);
      setProposeForm({ clause: '', proposedChange: '', justification: '' }); // Reset form
      alert('Change proposed successfully!'); // Replace with a toast notification for better UX
    } catch (err) {
      setError(err.message);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  if (!user) return <div>Please log in <Link href="/">Login</Link></div>;
  if (loading) return <p>Loading documents...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
        {user.role.toLowerCase() === 'implementor' && (
          <div className="space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
            >
              Create New
            </button>
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition"
            >
              Upload
            </button>
          </div>
        )}
      </div>

      {/* Document Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Version</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <tr key={doc.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-gray-800">{doc.title}</td>
                <td className="px-6 py-4 text-gray-600">{doc.version}</td>
                <td className="px-6 py-4 text-gray-600">{doc.category || 'N/A'}</td>
                <td className="px-6 py-4 text-gray-600">{doc.status}</td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewDocument(doc.id)}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Document Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800">Create New Document</h2>
            <form onSubmit={handleCreateDocument}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    name="version"
                    defaultValue="1.0"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    type="text"
                    name="revision"
                    defaultValue="A"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Student Affairs">Student Affairs</option>
                    <option value="HR & Staff">HR & Staff</option>
                    <option value="Finance & Administration">Finance & Administration</option>
                    <option value="ICT & Data Protection">ICT & Data Protection</option>
                    <option value="Health & Safety">Health & Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    name="content"
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows="4"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800">Upload Document</h2>
            <form onSubmit={handleUploadDocument}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    name="version"
                    defaultValue="1.0"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Revision</label>
                  <input
                    type="text"
                    name="revision"
                    defaultValue="A"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="category"
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Student Affairs">Student Affairs</option>
                    <option value="HR & Staff">HR & Staff</option>
                    <option value="Finance & Administration">Finance & Administration</option>
                    <option value="ICT & Data Protection">ICT & Data Protection</option>
                    <option value="Health & Safety">Health & Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                  <input
                    type="file"
                    name="file"
                    accept=".pdf"
                    required
                    className="w-full text-gray-700"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
                >
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Document Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Document Viewer</h2>
              <button
                onClick={() => setSelectedDocument(null)}
                className="text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 p-6 overflow-auto">
              {selectedDocument.type === 'pdf' ? (
                <Document
                  file={selectedDocument.blob}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="flex flex-col items-center"
                >
                  {Array.from(new Array(numPages), (el, index) => (
                    <Page
                      key={`page_${index + 1}`}
                      pageNumber={index + 1}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      className="mb-4 shadow-md"
                      width={Math.min(800, window.innerWidth * 0.8)}
                    />
                  ))}
                </Document>
              ) : (
                <div className="prose max-w-none p-4 bg-gray-50 rounded-lg shadow-inner">
                  {selectedDocument.content || 'No content available'}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              {user.role.toLowerCase() === 'staff' && (
                <button
                  onClick={() => setShowProposeModal(true)}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Propose Change
                </button>
              )}
              <button
                onClick={() => setSelectedDocument(null)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Propose Change Modal */}
      {showProposeModal && selectedDocument && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-semibold mb-5 text-gray-800">Propose a Change</h2>
            <form onSubmit={handleProposeChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Clause/Section</label>
                  <input
                    type="text"
                    name="clause"
                    value={proposeForm.clause}
                    onChange={(e) => setProposeForm({ ...proposeForm, clause: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Change</label>
                  <textarea
                    name="proposedChange"
                    value={proposeForm.proposedChange}
                    onChange={(e) => setProposeForm({ ...proposeForm, proposedChange: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                  <textarea
                    name="justification"
                    value={proposeForm.justification}
                    onChange={(e) => setProposeForm({ ...proposeForm, justification: e.target.value })}
                    required
                    className="w-full border border-gray-300 px-4 py-2 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    rows="3"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
                >
                  Submit Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}