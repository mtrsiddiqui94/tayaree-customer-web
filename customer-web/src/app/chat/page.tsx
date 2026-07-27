'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './chat.module.css';

interface Message {
  id: string | number;
  text: string;
  sender: 'user' | 'vendor';
  timestamp: string;
  type?: 'text' | 'audio' | 'file';
  fileName?: string;
  fileSize?: string;
  audioUrl?: string;
  audioDuration?: number;
}

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [messages, setMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [inboxDetails, setInboxDetails] = useState<any>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => router.push('/login?redirect=/chat'), 0);
      return;
    }

    async function initChat() {
      setIsLoading(true);
      try {
        const res = await api.post<any>('/api/v1/inbox/detail', {}).catch(() => null);
        if (res) {
          const d = res.data || res;
          setInboxDetails(d);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }

    initChat();
  }, [router]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchMessages() {
      try {
        const res = await api.get<any>('/api/v1/inbox/messages').catch(() => null);
        if (res) {
          const raw = res.data || res;
          if (Array.isArray(raw)) {
            const fetchedMessages: Message[] = raw.map((m: any) => ({
              id: m.id || Date.now() + Math.random(),
              sender: (m.sender_type === 'vendor' || m.senderType === 'vendor' ? 'vendor' : 'user'),
              text: m.message || m.text || '',
              timestamp: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'unset',
              type: m.type || (m.audio_url ? 'audio' : 'text'),
              audioUrl: m.audio_url,
              audioDuration: m.audio_duration
            }));
            setMessages(fetchedMessages);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchMessages();
    interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        inbox_id: inboxDetails?.inboxId || inboxDetails?.inbox_id || inboxDetails?.id,
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

  const getAudioConfig = () => {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
      if (MediaRecorder.isTypeSupported('audio/mp4')) return { mimeType: 'audio/mp4', ext: 'mp4' };
      if (MediaRecorder.isTypeSupported('audio/aac')) return { mimeType: 'audio/aac', ext: 'aac' };
      if (MediaRecorder.isTypeSupported('audio/wav')) return { mimeType: 'audio/wav', ext: 'wav' };
      if (MediaRecorder.isTypeSupported('audio/m4a')) return { mimeType: 'audio/m4a', ext: 'm4a' };
      if (MediaRecorder.isTypeSupported('audio/ogg')) return { mimeType: 'audio/ogg', ext: 'oga' };
    }
    return { mimeType: 'audio/mp4', ext: 'm4a' };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const { mimeType } = getAudioConfig();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const { mimeType: selectedMime, ext } = getAudioConfig();
        const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime || 'audio/mp4' });
        const duration = recordingDuration;
        stream.getTracks().forEach(track => track.stop());

        if (duration > 0) {
          await sendAudioMessage(audioBlob, duration, ext || 'm4a');
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

  const sendAudioMessage = async (audioBlob: Blob, duration: number, fileExt: string = 'm4a') => {
    const inboxId = inboxDetails?.inboxId || inboxDetails?.inbox_id || inboxDetails?.id;

    const tempId = Date.now();
    const newMsg: Message = {
      id: tempId,
      sender: 'user',
      text: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'audio',
      audioDuration: duration
    };
    setMessages(prev => [...prev, newMsg]);

    try {
      const formData = new FormData();
      if (inboxId) formData.append('inbox_id', inboxId.toString());
      formData.append('duration', duration.toString());
      formData.append('audio', audioBlob, `audio_message.${fileExt}`);

      await api.upload('/api/v1/inbox/send-audio', formData);
    } catch (e) {
      console.error(e);
    }
  };

  // Agent / Conversation metadata
  const receiverName = inboxDetails?.receiver?.fullName || inboxDetails?.receiver?.full_name || inboxDetails?.receiver?.name || inboxDetails?.title || 'Customer Support';
  const receiverAvatarLetter = receiverName.charAt(0).toUpperCase();
  const vendorCategory = inboxDetails?.category || inboxDetails?.vendor_type || 'Customer Support · 24/7';
  const orderId = inboxDetails?.order_id || inboxDetails?.orderId;

  return (
    <DashboardLayout breadcrumbTitle="Customer Service">
      <div className={styles.chatRoomPanel}>

        {/* Top Red App Bar */}
        <div className={styles.chatRoomBar}>
          <button onClick={() => router.back()} className={styles.chatRoomBack}>
            <i className="bx bx-chevron-left"></i>
          </button>
          <div className={styles.chatRoomAvatar}>{receiverAvatarLetter}</div>
          <div className={styles.chatRoomAgentInfo}>
            <h4 className={styles.chatRoomAgentName}>{receiverName}</h4>
            <div className={styles.chatRoomAgentSub}>
              <span className={styles.onlineBadgeBar}></span> Support Agent · Online
            </div>
          </div>
          <div className={styles.chatRoomActions}>
            <button className={styles.chatRoomActionBtn} title="Call">
              <i className="bx bx-phone"></i>
            </button>
            <button className={styles.chatRoomActionBtn} title="View Profile">
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
            <h5 className={styles.vendorTagName}>{receiverName}</h5>
            <p className={styles.vendorTagCat}>{vendorCategory}</p>
          </div>
          {orderId && (
            <Link href={`/orders?id=${orderId}`} className={styles.chatOrderLink}>
              <i className="bx bx-receipt"></i> Order #{orderId}
            </Link>
          )}
        </div>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', flex: 1 }}>
            <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
            <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading conversation...</p>
          </div>
        ) : (
          <>
            {/* Message Thread Scroll View */}
            <div className={styles.chatMessages}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <i className="bx bx-conversation" style={{ fontSize: '40px', color: 'var(--text-muted)', marginBottom: '8px' }}></i>
                  <p>Start a conversation with {receiverName}.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOut = m.sender === 'user';
                  return (
                    <div key={m.id} className={`${styles.msgRow} ${isOut ? styles.msgRowOut : styles.msgRowIn}`}>
                      <div className={styles.msgGroup}>
                        {!isOut && <div className={styles.bubbleAvatarSm}>{receiverAvatarLetter}</div>}
                        
                        <div className={`${styles.bubble} ${isOut ? styles.bubbleOut : styles.bubbleIn}`}>
                          {m.type === 'audio' ? (
                            <div className={styles.audioBubble}>
                              <button className={`${styles.audioPlayBtn} ${isOut ? styles.out : styles.in}`}>
                                <i className="bx bx-play"></i>
                              </button>
                              <div className={styles.audioInfo}>
                                <input type="range" className={styles.audioScrubber} min="0" max="100" defaultValue="35" readOnly />
                                <div className={styles.audioDurations}>
                                  <span className={`${styles.audioDur} ${isOut ? styles.out : ''}`}>
                                    {m.audioDuration ? `0:${m.audioDuration.toString().padStart(2, '0')}` : '0:14'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : m.type === 'file' ? (
                            <div className={styles.fileBubble}>
                              <div className={`${styles.fileIconWrap} ${isOut ? styles.out : styles.in}`}>
                                <i className="bx bx-file-pdf"></i>
                              </div>
                              <div className={styles.fileDetails}>
                                <div className={styles.fileName}>{m.fileName || 'Attachment'}</div>
                                <div className={styles.fileSize}>{m.fileSize || 'Document'}</div>
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
                })
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
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1, padding: '0 16px', color: 'var(--primary)' }}>
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--primary)',
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
