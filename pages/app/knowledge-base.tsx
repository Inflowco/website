import { useState, useEffect, useCallback } from 'react';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/Dialog';
import { FileDropzone } from '../../components/FileDropzone';
import {
  Upload,
  FileText,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Search,
  Filter,
} from 'lucide-react';
import superjson from 'superjson';
import { format } from 'date-fns';
import styles from './knowledge-base.module.css';

interface Document {
  id: number;
  name: string;
  fileType: string;
  category: string;
  status: 'processing' | 'ready' | 'failed';
  chunkCount: number;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  standards: 'Standards',
  manuals: 'Manuals',
  'best-practices': 'Best Practices',
  specifications: 'Specifications',
  other: 'Other',
};

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDocuments = useCallback(async () => {
    try {
      const response = await authFetch('/_api/documents');
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', 'other');

        const response = await authFetch('/_api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = superjson.parse(await response.text());
          setDocuments(prev => [data.document, ...prev]);
        }
      }
      setShowUpload(false);
    } catch (error) {
      console.error('Failed to upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await authFetch(`/_api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
      }
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle2 size={16} className={styles.statusReady} />;
      case 'processing':
        return <Loader2 size={16} className={styles.statusProcessing} />;
      case 'failed':
        return <AlertCircle size={16} className={styles.statusFailed} />;
      default:
        return null;
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery && !doc.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const categories = ['all', ...new Set(documents.map(d => d.category))];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Knowledge Base</h1>
          <p className={styles.subtitle}>
            Upload and manage documents for AI-powered answers
          </p>
        </div>
        <Dialog open={showUpload} onOpenChange={setShowUpload}>
          <DialogTrigger asChild>
            <Button>
              <Upload size={18} />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className={styles.uploadDialog}>
            <DialogHeader>
              <DialogTitle>Upload Documents</DialogTitle>
            </DialogHeader>
            <div className={styles.uploadContent}>
              <FileDropzone
                onDrop={handleUpload}
                accept={{
                  'application/pdf': ['.pdf'],
                  'text/plain': ['.txt'],
                  'text/markdown': ['.md'],
                }}
                maxSize={10 * 1024 * 1024}
                multiple
              />
              <p className={styles.uploadHint}>
                Supported formats: PDF, TXT, Markdown. Max file size: 10MB
              </p>
              {uploading && (
                <div className={styles.uploadingState}>
                  <Loader2 size={20} className={styles.spinner} />
                  <span>Processing documents...</span>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.categoryFilter}>
          <Filter size={16} />
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.filter(c => c !== 'all').map(cat => (
              <option key={cat} value={cat}>
                {categoryLabels[cat] || cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{documents.length}</span>
          <span className={styles.statLabel}>Total Documents</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {documents.filter(d => d.status === 'ready').length}
          </span>
          <span className={styles.statLabel}>Indexed</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>
            {documents.reduce((sum, d) => sum + d.chunkCount, 0)}
          </span>
          <span className={styles.statLabel}>Total Chunks</span>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinner} />
          <p>Loading documents...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={48} strokeWidth={1.5} />
          <h2>No documents yet</h2>
          <p>
            Upload PDFs, manuals, and standards documents to enable AI-powered
            question answering.
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload size={18} />
            Upload Your First Document
          </Button>
        </div>
      ) : (
        <div className={styles.documentList}>
          {filteredDocuments.map(doc => (
            <div key={doc.id} className={styles.documentCard}>
              <div className={styles.documentIcon}>
                <FileText size={24} />
              </div>
              <div className={styles.documentInfo}>
                <h3>{doc.name}</h3>
                <div className={styles.documentMeta}>
                  <Badge variant="outline">{categoryLabels[doc.category] || doc.category}</Badge>
                  <span className={styles.documentDate}>
                    <Clock size={14} />
                    {format(new Date(doc.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              <div className={styles.documentStatus}>
                {getStatusIcon(doc.status)}
                <span>
                  {doc.status === 'ready'
                    ? `${doc.chunkCount} chunks`
                    : doc.status === 'processing'
                      ? 'Processing...'
                      : 'Failed'}
                </span>
              </div>
              <div className={styles.documentActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
