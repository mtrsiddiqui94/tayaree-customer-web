'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './chat.module.css';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'vendor';
  timestamp: string;
  type?: 'text' | 'audio' | 'file';
  fileName?: string;
  fileSize?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [profileName, setProfileName] = useState('Adnan Siddiqui');
  const [profileEmail, setProfileEmail] = useState('adnan@email.com');
  const [showTyping, setShowTyping] = useState(false);
  const [inboxDetails, setInboxDetails] = useState<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const loadInboxContext = async () => {
      try {
        const res = await api.post<{ status: boolean; data: any }>('/api/v1/inbox/detail').catch(() => null);
        if (res && res.status && res.data) {
          setInboxDetails(res.data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const loadProfile = async () => {
      try {
        interface ProfileData { full_name?: string; email?: string; }
        const res = await api.get<{ status: boolean; data: ProfileData }>('/api/v1/profile/me').catch(() => null);
        if (res && res.status && res.data) {
          setProfileName(res.data.full_name || 'Adnan Siddiqui');
          setProfileEmail(res.data.email || 'adnan@email.com');
        }
      } catch (e) {
        console.error(e);
      }
    };

    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login?redirect=/chat');
      return;
    }
    loadProfile();
    loadInboxContext();
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchMessages = async () => {
      try {
        // Poll for new messages
        const res = await api.get<{ status: boolean; data: any }>('/api/v1/inbox/messages').catch(() => null);
        if (res && res.status && res.data && Array.isArray(res.data)) {
          const fetchedMessages = res.data.map((m: any) => ({
            id: m.id || Date.now() + Math.random(),
            sender: m.sender_type === 'vendor' ? 'vendor' : 'user',
            text: m.message,
            timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: m.type || 'text',
          }));
          setMessages(fetchedMessages);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchMessages();
    interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const msgText = typedMessage.trim();
    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      sender: 'user',
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, newMsg]);
    setTypedMessage('');

    try {
      await api.post('/api/v1/inbox/send', {
        message: msgText,
        inbox_id: inboxDetails?.inboxId,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        // Use a local variable to capture duration before it resets
        const duration = recordingDuration;
        
        // Stop all tracks to release mic
        stream.getTracks().forEach(track => track.stop());

        // Only send if it's more than 1 second
        if (duration > 0) {
          await sendAudioMessage(audioBlob, duration);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error('Error accessing microphone', e);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob, duration: number) => {
    if (!inboxDetails?.inboxId) return;

    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      sender: 'user',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'audio',
    };
    setMessages(prev => [...prev, newMsg]);

    try {
      const formData = new FormData();
      formData.append('inbox_id', inboxDetails.inboxId.toString());
      formData.append('duration', duration.toString());
      formData.append('audio', audioBlob, 'audio_message.webm');

      await api.upload('/api/v1/inbox/send-audio', formData);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout breadcrumbTitle="Customer Service">
      <div className={styles.chatRoomPanel}>
            
            {/* Top Red App Bar */}
            <div className={styles.chatRoomBar}>
              <button onClick={() => router.back()} className={styles.chatRoomBack}>
                <i className="bx bx-chevron-left"></i>
              </button>
              <div className={styles.chatRoomAvatar}>Z</div>
              <div className={styles.chatRoomAgentInfo}>
                <h4 className={styles.chatRoomAgentName}>Zara Events &amp; Decor</h4>
                <div className={styles.chatRoomAgentSub}>
                  <span className={styles.onlineBadgeBar}></span> Support Agent · Online
                </div>
              </div>
              <div className={styles.chatRoomActions}>
                <button className={styles.chatRoomActionBtn} title="Call">
                  <i className="bx bx-phone"></i>
                </button>
                <button className={styles.chatRoomActionBtn} title="View Vendor Profile">
                  <i className="bx bx-user"></i>
                </button>
                <button className={styles.chatRoomActionBtn} title="More Options">
                  <i className="bx bx-dots-vertical-rounded"></i>
                </button>
              </div>
            </div>

            {/* Context Info Bar */}
            <div className={styles.chatInfoBar}>
              <div>
                <h5 className={styles.vendorTagName}>Zara Events &amp; Decor</h5>
                <p className={styles.vendorTagCat}>Decoration &amp; Floral · Karachi</p>
              </div>
              <Link href="/orders" className={styles.chatOrderLink}>
                <i className="bx bx-receipt"></i> Order #TY-2847
              </Link>
            </div>

            {/* Message Thread Scroll View */}
            <div className={styles.chatMessages}>
              <div className={styles.dateSep}>
                <span className={styles.dateSepPill}>Yesterday</span>
              </div>

              {messages.map((m) => {
                const isOut = m.sender === 'user';
                return (
                  <div key={m.id} className={`${styles.msgRow} ${isOut ? styles.msgRowOut : styles.msgRowIn}`}>
                    <div className={styles.msgGroup}>
                      {!isOut && <div className={styles.bubbleAvatarSm}>Z</div>}
                      
                      <div className={`${styles.bubble} ${isOut ? styles.bubbleOut : styles.bubbleIn}`}>
                        {m.type === 'audio' ? (
                          <div className={styles.audioBubble}>
                            <button className={`${styles.audioPlayBtn} ${isOut ? styles.out : styles.in}`}>
                              <i className="bx bx-play"></i>
                            </button>
                            <div className={styles.audioInfo}>
                              <input type="range" className={styles.audioScrubber} min="0" max="100" defaultValue="35" readOnly />
                              <div className={styles.audioDurations}>
                                <span className={`${styles.audioDur} ${isOut ? styles.out : ''}`}>0:14</span>
                                <span className={`${styles.audioDur} ${isOut ? styles.out : ''}`}>0:42</span>
                              </div>
                            </div>
                          </div>
                        ) : m.type === 'file' ? (
                          <div className={styles.fileBubble}>
                            <div className={`${styles.fileIconWrap} ${isOut ? styles.out : styles.in}`}>
                              <i className="bx bx-file-pdf"></i>
                            </div>
                            <div className={styles.fileDetails}>
                              <div className={styles.fileName}>{m.fileName}</div>
                              <div className={styles.fileSize}>{m.fileSize}</div>
                            </div>
                            <i className={`bx bx-download ${styles.fileDownload} ${isOut ? styles.out : styles.in}`}></i>
                          </div>
                        ) : (
                          <p style={{ margin: 0 }}>{m.text}</p>
                        )}

                        <div className={styles.bubbleMeta}>
                          <span className={styles.bubbleTime}>{m.timestamp}</span>
                          {isOut && <i className="bx bx-check-double tick"></i>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {showTyping && (
                <div className={`${styles.msgRow} ${styles.msgRowIn}`}>
                  <div className={styles.msgGroup}>
                    <div className={styles.bubbleAvatarSm}>Z</div>
                    <div className={styles.typingIndicator}>
                      <div className={styles.typingDot}></div>
                      <div className={styles.typingDot}></div>
                      <div className={styles.typingDot}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef}></div>
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className={styles.chatInputBar}>
              <button type="button" className={styles.inputIconBtn} title="Attach file">
                <i className="bx bx-paperclip"></i>
              </button>
              <div className={styles.inputWrap}>
                {isRecording ? (
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', color: 'var(--primary-color)' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary-color)',
                      marginRight: '8px',
                      animation: 'pulse 1s infinite'
                    }}></span>
                    Recording... {recordingDuration}s
                  </div>
                ) : (
                  <>
                    <textarea
                      className={styles.chatTextInput}
                      placeholder="Write your message..."
                      rows={1}
                      value={typedMessage}
                      onChange={(e) => setTypedMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button type="button" className={styles.inputIconBtn} title="Send image">
                      <i className="bx bx-image-alt"></i>
                    </button>
                    <button type="button" className={styles.inputIconBtn} title="Emoji">
                      <i className="bx bx-smile"></i>
                    </button>
                  </>
                )}
              </div>
              {typedMessage.trim() ? (
                <button
                  type="submit"
                  className={styles.chatMicBtn}
                  title="Send message"
                >
                  <i className="bx bx-send"></i>
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.chatMicBtn} ${isRecording ? styles.recording : ''}`}
                  title="Hold to record voice message"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  onTouchCancel={stopRecording}
                >
                  <i className="bx bx-microphone"></i>
                </button>
              )}
            </form>
      </div>
    </DashboardLayout>
  );
}
