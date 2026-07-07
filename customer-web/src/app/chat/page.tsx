'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { api } from '@/lib/api';
import styles from './chat.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'vendor';
  timestamp: string;
}

interface ChatThread {
  id: number;
  name: string;
  avatarLetter: string;
  lastMessage: string;
  time: string;
  messages: Message[];
}

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [typedMessage, setTypedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/chat');
      return;
    }
    loadChatThreads();
  }, []);

  useEffect(() => {
    // Scroll chat history to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threads, activeThreadId]);

  const loadChatThreads = async () => {
    try {
      setIsLoading(true);
      // Fetch user inbox details
      const inboxRes = await api.post<{ status: boolean; data?: any }>('/api/v1/inbox/detail')
        .catch(() => null);

      // Default mock threads
      const mockThreads: ChatThread[] = [
        {
          id: 1,
          name: 'Desi Catering Stars',
          avatarLetter: 'D',
          lastMessage: 'Let us confirm the stage course menu revisions shortly.',
          time: '12:45 PM',
          messages: [
            { id: 1, text: 'Hi Adnan, we received your custom staging request details.', sender: 'vendor', timestamp: '12:30 PM' },
            { id: 2, text: 'Hi, can you update the desserts cup course count to 150?', sender: 'user', timestamp: '12:35 PM' },
            { id: 3, text: 'Let us confirm the stage course menu revisions shortly.', sender: 'vendor', timestamp: '12:45 PM' },
          ]
        },
        {
          id: 2,
          name: 'Tayaree Coordinator Helpdesk',
          avatarLetter: 'T',
          lastMessage: 'Your payment installment dates have been verified.',
          time: 'Yesterday',
          messages: [
            { id: 21, text: 'Hello Adnan, how can we assist you today?', sender: 'vendor', timestamp: '10:00 AM' },
            { id: 22, text: 'I completed the downpayment, please verify my schedule.', sender: 'user', timestamp: '10:15 AM' },
            { id: 23, text: 'Your payment installment dates have been verified.', sender: 'vendor', timestamp: '10:30 AM' },
          ]
        }
      ];

      setThreads(mockThreads);
      if (mockThreads.length > 0) {
        setActiveThreadId(mockThreads[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || activeThreadId === null) return;

    const newMessage: Message = {
      id: Date.now(),
      text: typedMessage.trim(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Update message logs locally
    setThreads(prev => prev.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          lastMessage: newMessage.text,
          time: newMessage.timestamp,
          messages: [...t.messages, newMessage],
        };
      }
      return t;
    }));

    const textToSubmit = typedMessage.trim();
    setTypedMessage('');

    // Trigger vendor automated mock reply
    setTimeout(() => {
      const vendorReply: Message = {
        id: Date.now() + 1,
        text: `Thanks for the details! We will verify this request and respond shortly.`,
        sender: 'vendor',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            lastMessage: vendorReply.text,
            time: vendorReply.timestamp,
            messages: [...t.messages, vendorReply],
          };
        }
        return t;
      }));
    }, 1500);
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        <div className={styles.chatLayout}>
          {/* Thread list panel */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <h3 style={{ fontSize: '15px', fontWeight: 800 }}>Direct Inbox</h3>
            </div>
            
            <div className={styles.threadList}>
              {threads.map((t) => {
                const isActive = t.id === activeThreadId;
                return (
                  <div
                    key={t.id}
                    onClick={() => setActiveThreadId(t.id)}
                    className={`${styles.threadItem} ${isActive ? styles.threadItemActive : ''}`}
                  >
                    <div className={styles.avatar}>{t.avatarLetter}</div>
                    <div className={styles.threadInfo}>
                      <div className={styles.threadTitleRow}>
                        <h4 className={styles.threadName}>{t.name}</h4>
                        <span className={styles.threadTime}>{t.time}</span>
                      </div>
                      <p className={styles.threadMsg}>{t.lastMessage}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Chat workspace view */}
          <section className={styles.chatWorkspace}>
            {activeThread ? (
              <>
                {/* Header */}
                <div className={styles.workspaceHeader}>
                  <div className={styles.avatar}>{activeThread.avatarLetter}</div>
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800 }}>{activeThread.name}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--success)' }}>Online support</span>
                  </div>
                </div>

                {/* Messages log */}
                <div className={styles.messagesContainer}>
                  {activeThread.messages.map((m) => {
                    const isUser = m.sender === 'user';
                    return (
                      <div
                        key={m.id}
                        className={`${styles.messageRow} ${isUser ? styles.messageRowUser : ''}`}
                      >
                        <div className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleVendor}`}>
                          <p style={{ margin: 0 }}>{m.text}</p>
                          <span className={styles.bubbleTime}>{m.timestamp}</span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef}></div>
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className={styles.inputForm}>
                  <input
                    type="text"
                    placeholder="Type event service details instructions..."
                    value={typedMessage}
                    onChange={(e) => setTypedMessage(e.target.value)}
                    className={styles.chatInput}
                  />
                  <button type="submit" className={styles.btnSend}>
                    <i className="bx bx-paper-plane"></i>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <i className="bx bx-message-dots" style={{ fontSize: '48px', color: 'var(--text-muted)' }}></i>
                <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>Select a direct thread support to get started.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
