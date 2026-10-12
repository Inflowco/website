import { useState } from 'react';
import { useAuth } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Badge } from '../../components/Badge';
import { Progress } from '../../components/Progress';
import { Package, Truck, CheckCircle2, Circle, HelpCircle, Video, MessageSquare } from 'lucide-react';
import styles from './install-kit.module.css';

interface InstallStep {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
}

const demoSteps: InstallStep[] = [
  { id: 1, title: 'Kit Shipped', description: 'Your sensor kit has been shipped', status: 'completed' },
  { id: 2, title: 'Kit Received', description: 'Confirm receipt of your kit', status: 'completed' },
  { id: 3, title: 'Install Sensors', description: 'Follow the guide to install sensors', status: 'current' },
  { id: 4, title: 'Connect Gateway', description: 'Power up and connect the gateway', status: 'pending' },
  { id: 5, title: 'Verify Data', description: 'Confirm sensor readings in dashboard', status: 'pending' },
];

export default function InstallKitPage() {
  const { facilities, currentFacilityId } = useAuth();
  const [steps] = useState<InstallStep[]>(demoSteps);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const facility = facilities.find(f => f.id === currentFacilityId);
  const completedSteps = steps.filter(s => s.status === 'completed').length;
  const progress = (completedSteps / steps.length) * 100;

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={24} className={styles.completedIcon} />;
      case 'current':
        return <Circle size={24} className={styles.currentIcon} />;
      default:
        return <Circle size={24} className={styles.pendingIcon} />;
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Self-Install Kit</h1>
          <p className={styles.subtitle}>
            Track your installation progress for {facility?.name || 'facility'}
          </p>
        </div>
        <Button variant="outline" onClick={() => setShowHelpModal(true)}>
          <HelpCircle size={18} />
          Get Help
        </Button>
      </header>

      <div className={styles.statusCard}>
        <div className={styles.statusHeader}>
          <div className={styles.statusInfo}>
            <Package size={24} />
            <div>
              <h2>Installation Progress</h2>
              <p>{completedSteps} of {steps.length} steps completed</p>
            </div>
          </div>
          <Badge variant={progress === 100 ? 'default' : 'secondary'}>
            {progress === 100 ? 'Complete' : 'In Progress'}
          </Badge>
        </div>
        <Progress value={progress} className={styles.progressBar} />
      </div>

      <div className={styles.trackingCard}>
        <div className={styles.trackingHeader}>
          <Truck size={20} />
          <h3>Shipping Information</h3>
        </div>
        <div className={styles.trackingDetails}>
          <div className={styles.trackingItem}>
            <span className={styles.trackingLabel}>Tracking Number</span>
            <span className={styles.trackingValue}>1Z999AA10123456784</span>
          </div>
          <div className={styles.trackingItem}>
            <span className={styles.trackingLabel}>Carrier</span>
            <span className={styles.trackingValue}>UPS Ground</span>
          </div>
          <div className={styles.trackingItem}>
            <span className={styles.trackingLabel}>Delivered</span>
            <span className={styles.trackingValue}>Feb 1, 2026</span>
          </div>
        </div>
      </div>

      <section className={styles.stepsSection}>
        <h2 className={styles.sectionTitle}>Installation Steps</h2>
        <div className={styles.stepsList}>
          {steps.map((step, index) => (
            <div key={step.id} className={`${styles.stepCard} ${styles[step.status]}`}>
              <div className={styles.stepIcon}>
                {getStepIcon(step.status)}
                {index < steps.length - 1 && <div className={styles.stepLine} />}
              </div>
              <div className={styles.stepContent}>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                {step.status === 'current' && (
                  <div className={styles.stepActions}>
                    <Button size="sm">
                      <Video size={16} />
                      Watch Guide
                    </Button>
                    <Button size="sm" variant="outline">
                      Mark Complete
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.kitContents}>
        <h2 className={styles.sectionTitle}>Kit Contents</h2>
        <div className={styles.contentsGrid}>
          <div className={styles.contentItem}>
            <span className={styles.contentQty}>3x</span>
            <span className={styles.contentName}>Pressure Sensors</span>
            <Badge variant="outline">Installed: 1/3</Badge>
          </div>
          <div className={styles.contentItem}>
            <span className={styles.contentQty}>2x</span>
            <span className={styles.contentName}>Temperature Sensors</span>
            <Badge variant="outline">Installed: 0/2</Badge>
          </div>
          <div className={styles.contentItem}>
            <span className={styles.contentQty}>1x</span>
            <span className={styles.contentName}>Flow Meter</span>
            <Badge variant="outline">Installed: 0/1</Badge>
          </div>
          <div className={styles.contentItem}>
            <span className={styles.contentQty}>1x</span>
            <span className={styles.contentName}>Gateway Hub</span>
            <Badge variant="outline">Not Connected</Badge>
          </div>
          <div className={styles.contentItem}>
            <span className={styles.contentQty}>1x</span>
            <span className={styles.contentName}>Power Supply</span>
            <Badge variant="outline">Included</Badge>
          </div>
        </div>
      </section>

      <section className={styles.helpSection}>
        <h2 className={styles.sectionTitle}>Need Assistance?</h2>
        <div className={styles.helpOptions}>
          <div className={styles.helpCard}>
            <Video size={32} />
            <h3>Video Tutorials</h3>
            <p>Step-by-step installation guides</p>
            <Button variant="outline" size="sm">Watch Now</Button>
          </div>
          <div className={styles.helpCard}>
            <MessageSquare size={32} />
            <h3>Live Support</h3>
            <p>Chat with our installation team</p>
            <Button variant="outline" size="sm">Start Chat</Button>
          </div>
          <div className={styles.helpCard}>
            <HelpCircle size={32} />
            <h3>Request Remote Session</h3>
            <p>Schedule a video call with a technician</p>
            <Button variant="outline" size="sm">Schedule</Button>
          </div>
        </div>
      </section>
    </div>
  );
}
