// Removed unused default React import under new JSX transform
import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import adminApi from '../services/adminApi';
import { useToast } from '../components/ui/Toast';

export default function AdminLayout() {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { addToast } = useToast();
  // Handlers for docs upload
  const handleFileChange = (e: any) => {
    if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      await adminApi.post('/docs/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast('Document uploaded successfully');
      setUploadOpen(false);
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      addToast('Upload failed');
    }
  };
  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
      <aside className="w-64 bg-white dark:bg-gray-900 p-4">
        <nav className="flex flex-col space-y-2">
          <NavLink to="/admin/tickets" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Tickets
          </NavLink>
          <NavLink to="/admin/unclaimed" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Unclaimed
          </NavLink>
          <NavLink to="/admin/my-claims" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            My Claims
          </NavLink>
          <NavLink to="/admin/profile" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Profile
          </NavLink>
          <NavLink to="/admin/docs" className={({ isActive }) => isActive ? 'font-bold' : ''}>
            Docs
          </NavLink>
          <button
            onClick={() => setUploadOpen(true)}
            className="mt-2 bg-primary-500 text-white px-3 py-1 rounded"
          >
            Upload Docs
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
      {uploadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Upload Documentation</h3>
            <input type="file" accept=".pdf,.md" onChange={handleFileChange} />
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setUploadOpen(false)} className="px-3 py-1 border rounded">
                Cancel
              </button>
              <button onClick={handleUpload} className="px-3 py-1 bg-primary-500 text-white rounded">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}