import { useState, useRef, useEffect } from 'react';
import { useAuth, useAuthFetch } from '../../helpers/useAuth';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Badge } from '../../components/Badge';
import { Send, Plus, MessageSquare, FileText, Loader2, BookOpen } from 'lucide-react';
import superjson from 'superjson';
import styles from './assistant.module.css';

interface Message {
  id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  sources?: { documentName: string; chunkId: number }[];
  createdAt: string;
}

interface ChatSession {
  id: number;
  title: string;
  createdAt: string;
}

export default function AssistantPage() {
  const { user } = useAuth();
  const authFetch = useAuthFetch();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const response = await authFetch('/_api/chat/sessions');
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    }
  };

  const loadSession = async (sessionId: number) => {
    setCurrentSession(sessionId);
    setLoading(true);
    try {
      const response = await authFetch(`/_api/chat/sessions/${sessionId}/messages`);
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = async () => {
    try {
      const response = await authFetch('/_api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({ title: 'New Chat' }),
      });
      if (response.ok) {
        const data = superjson.parse(await response.text());
        setSessions(prev => [data.session, ...prev]);
        setCurrentSession(data.session.id);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loadingMessage) return;

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: input,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoadingMessage(true);

    try {
      const response = await authFetch('/_api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: superjson.stringify({
          sessionId: currentSession,
          message: input,
        }),
      });

      if (response.ok) {
        const data = superjson.parse(await response.text());
        setMessages(prev => [...prev, data.response]);

        // Update session title if it was the first message
        if (messages.length === 0) {
          setSessions(prev =>
            prev.map(s =>
              s.id === currentSession
                ? { ...s, title: input.slice(0, 50) + (input.length > 50 ? '...' : '') }
                : s
            )
          );
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoadingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const suggestedQuestions = [
    "What are the ISO standards for compressed air quality?",
    "How do I troubleshoot high dewpoint readings?",
    "What's the optimal pressure for energy efficiency?",
    "Explain the CAGI performance sheets",
  ];

  return (
    <div className={styles.container}>
      {/* Sidebar - Chat History */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Chat History</h2>
          <Button size="sm" onClick={startNewSession}>
            <Plus size={16} />
          </Button>
        </div>
        <div className={styles.sessionList}>
          {sessions.map(session => (
            <button
              key={session.id}
              className={`${styles.sessionItem} ${session.id === currentSession ? styles.active : ''}`}
              onClick={() => loadSession(session.id)}
            >
              <MessageSquare size={16} />
              <span>{session.title || 'New Chat'}</span>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className={styles.noSessions}>No chat history yet</p>
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={styles.main}>
        {currentSession ? (
          <>
            <div className={styles.messages}>
              {loading ? (
                <div className={styles.loadingState}>
                  <Loader2 size={24} className={styles.spinner} />
                  <p>Loading conversation...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className={styles.emptyState}>
                  <BookOpen size={48} strokeWidth={1.5} />
                  <h2>Ask about compressed air</h2>
                  <p>
                    Get instant answers from your uploaded documents, industry standards,
                    and best practices.
                  </p>
                  <div className={styles.suggestions}>
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        className={styles.suggestionButton}
                        onClick={() => {
                          setInput(q);
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`${styles.message} ${styles[message.role]}`}
                    >
                      <div className={styles.messageAvatar}>
                        {message.role === 'user' ? (
                          <span>{user?.firstName?.charAt(0)}</span>
                        ) : (
                          <span>AI</span>
                        )}
                      </div>
                      <div className={styles.messageContent}>
                        <p>{message.content}</p>
                        {message.sources && message.sources.length > 0 && (
                          <div className={styles.sources}>
                            <span className={styles.sourcesLabel}>Sources:</span>
                            {message.sources.map((source, i) => (
                              <Badge key={i} variant="secondary">
                                <FileText size={12} />
                                {source.documentName}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {loadingMessage && (
                    <div className={`${styles.message} ${styles.assistant}`}>
                      <div className={styles.messageAvatar}>
                        <span>AI</span>
                      </div>
                      <div className={styles.messageContent}>
                        <div className={styles.typing}>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className={styles.inputArea}>
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask a question about compressed air systems..."
                className={styles.input}
              />
              <Button onClick={sendMessage} disabled={!input.trim() || loadingMessage}>
                <Send size={18} />
              </Button>
            </div>
          </>
        ) : (
          <div className={styles.welcomeState}>
            <BookOpen size={64} strokeWidth={1} />
            <h1>AI Assistant</h1>
            <p>
              Your intelligent companion for compressed air knowledge.
              Start a new chat or select from your history.
            </p>
            <Button onClick={startNewSession}>
              <Plus size={18} />
              Start New Chat
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
