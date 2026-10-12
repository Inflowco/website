import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/Dialog';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Plus, GitBranch, Edit2, Trash2, Clock } from 'lucide-react';
import superjson from 'superjson';
import { format } from 'date-fns';
import styles from './diagrams.module.css';

interface Diagram {
  id: number;
  name: string;
  description: string | null;
  updatedAt: string;
  nodeCount?: number;
}

export default function DiagramsPage() {
  const { currentFacilityId } = useAuth();
  const authFetch = useAuthFetch();
  const [diagrams, setDiagrams] = useState<Diagram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newDiagram, setNewDiagram] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!currentFacilityId) return;

    const fetchDiagrams = async () => {
      setLoading(true);
      try {
        const response = await authFetch(`/_api/diagrams?facilityId=${currentFacilityId}`);
        if (response.ok) {
          const data = superjson.parse(await response.text());
          setDiagrams(data.diagrams || []);
        }
      } catch (error) {
        console.error('Failed to fetch diagrams:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDiagrams();
  }, [currentFacilityId, authFetch]);

  const handleCreate = async () => {
    try {
      const response = await authFetch('/_api/diagrams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          ...newDiagram,
          facilityId: currentFacilityId,
        }),
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        setDiagrams(prev => [...prev, data.diagram]);
        setShowCreate(false);
        setNewDiagram({ name: '', description: '' });
      }
    } catch (error) {
      console.error('Failed to create diagram:', error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>PID Diagrams</h1>
          <p className={styles.subtitle}>Create and manage system diagrams with live sensor data</p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} />
              New Diagram
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Diagram</DialogTitle>
            </DialogHeader>
            <div className={styles.form}>
              <div className={styles.field}>
                <label>Name</label>
                <Input
                  value={newDiagram.name}
                  onChange={e => setNewDiagram(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Main Compressor Room"
                />
              </div>
              <div className={styles.field}>
                <label>Description (optional)</label>
                <Textarea
                  value={newDiagram.description}
                  onChange={e => setNewDiagram(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the system..."
                  rows={3}
                />
              </div>
              <Button onClick={handleCreate} disabled={!newDiagram.name}>
                Create Diagram
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {loading ? (
        <div className={styles.loading}>Loading diagrams...</div>
      ) : diagrams.length === 0 ? (
        <div className={styles.empty}>
          <GitBranch size={48} strokeWidth={1.5} />
          <h2>No diagrams yet</h2>
          <p>Create your first PID diagram to visualize your compressed air system.</p>
          <Button onClick={() => setShowCreate(true)}>
            <Plus size={18} />
            Create Diagram
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {diagrams.map(diagram => (
            <Link
              key={diagram.id}
              to={`/app/diagrams/${diagram.id}/edit`}
              className={styles.card}
            >
              <div className={styles.cardPreview}>
                <GitBranch size={32} strokeWidth={1.5} />
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.cardTitle}>{diagram.name}</h3>
                {diagram.description && (
                  <p className={styles.cardDescription}>{diagram.description}</p>
                )}
                <div className={styles.cardMeta}>
                  <Clock size={14} />
                  <span>Updated {format(new Date(diagram.updatedAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <div className={styles.cardActions}>
                <Button variant="ghost" size="sm" onClick={e => e.preventDefault()}>
                  <Edit2 size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={e => e.preventDefault()}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
