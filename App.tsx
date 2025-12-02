import React, { useEffect, useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { SAMPLE_XML } from './constants';
import { parseMSProjectXML } from './utils/parser';
import { MSProject } from './types';
import GanttChart from './components/GanttChart';

function App() {
  const [project, setProject] = useState<MSProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load the prompt's XML by default
  useEffect(() => {
    loadXml(SAMPLE_XML);
  }, []);

  const loadXml = (xmlStr: string) => {
    try {
      setLoading(true);
      setError(null);
      const parsed = parseMSProjectXML(xmlStr);
      setProject(parsed);
    } catch (err) {
      console.error(err);
      setError("Failed to parse the project file. Please ensure it is a valid MS Project XML.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      loadXml(text);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "text/xml" || file.name.endsWith('.xml')) {
      processFile(file);
    } else {
      setError("Please drop a valid XML file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-1.5 rounded-lg">
                <FileText size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ProjectViewer Pro</h1>
        </div>
        <div className="flex gap-2">
            <label className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 transition-colors px-4 py-2 rounded-md cursor-pointer text-sm font-medium">
                <Upload size={16} />
                <span>Open XML</span>
                <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
            </label>
        </div>
      </nav>

      {/* Main Content */}
      <main 
        className="flex-1 p-4 overflow-hidden flex flex-col relative"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {isDragging && (
             <div className="absolute inset-0 bg-blue-500/10 border-4 border-dashed border-blue-500 z-50 flex items-center justify-center rounded-xl backdrop-blur-sm m-4">
                <div className="text-2xl font-bold text-blue-600">Drop XML File Here</div>
             </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-4 flex items-center gap-2 border border-red-200">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Loading Project...
            </div>
        ) : project ? (
            <div className="flex-1 overflow-hidden h-full">
                <GanttChart project={project} />
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Upload size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">No Project Loaded</p>
                <p className="text-sm">Upload a Microsoft Project XML file to get started</p>
            </div>
        )}
      </main>
    </div>
  );
}

export default App;
