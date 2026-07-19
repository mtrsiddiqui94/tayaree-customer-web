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
  type?: 'text' | 'audio' | 'file';
  fileName?: string;
  fileSize?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: 1,
    sender: 'vendor',
    text: "Assalam o Alaikum! Thank you for choosing Zara Events & Decor. I am your dedicated support agent — here to make your event truly special. How can I assist you today?",
    timestamp: "10:02 AM",
    type: 'text'
  },
  {
    id: 2,
    sender: 'user',
    text: "Walaikum Assalam! I placed an order for our mehndi decoration last week. I wanted to confirm the floral arch design we discussed.",
    timestamp: "10:05 AM",
    type: 'text'
  },
  {
    id: 3,
    sender: 'vendor',
    text: "Of course! I can see your order #TY-2847 for the mehndi event at Karachi Marriott on July 10th. We have noted the Rajasthani-style floral arch in your preferences. Let me pull up the exact spec now.",
    timestamp: "10:08 AM",
    type: 'text'
  },
  {
    id: 4,
    sender: 'user',
    text: "Audio message (0:42)",
    timestamp: "10:11 AM",
    type: 'audio'
  },
  {
    id: 5,
    sender: 'vendor',
    text: "I listened to your voice note. The pink and gold roses with marigold accents sound absolutely lovely! We can definitely accommodate that. Let me send you our catalogue reference right away.",
    timestamp: "10:15 AM",
    type: 'text'
  },
  {
    id: 6,
    sender: 'vendor',
    text: "Floral_Catalogue_2024.pdf",
    timestamp: "10:16 AM",
    type: 'file',
    fileName: "Floral_Catalogue_2024.pdf",
    fileSize: "3.2 MB · PDF"
  },
  {
    id: 7,
    sender: 'user',
    text: "I reviewed the catalogue — design #14 (Rose Arch Premium) is exactly what we want! Can it be ready by 5 PM on July 10th for the mehndi night setup?",
    timestamp: "9:30 AM",
    type: 'text'
  },
  {
    id: 8,
    sender: 'vendor',
    text: "Design #14 is an excellent choice, mashallah! Our team will arrive at the venue by 2 PM for setup. By 5 PM everything will be picture-perfect for your mehndi night.",
    timestamp: "9:45 AM",
    type: 'text'
  },
  {
    id: 9,
    sender: 'user',
    text: "Wonderful! Also, can we add a photo booth backdrop to the package? Our budget is around PKR 15,000 extra for that.",
    timestamp: "10:52 AM",
    type: 'text'
  },
  {
    id: 10,
    sender: 'vendor',
    text: "We have a beautiful PKR 14,500 photo booth backdrop — includes a fairy-light frame and a floor-to-ceiling flower wall panel. I will add it to your updated order quote right now.",
    timestamp: "11:01 AM",
    type: 'text'
  },
  {
    id: 11,
    sender: 'vendor',
    text: "Sure, we can arrange the floral arch by Friday. Let me confirm with the team and send you the updated invoice including the backdrop. Expect a reply within the hour!",
    timestamp: "2:14 PM",
    type: 'text'
  }
];

export default function ChatPage() {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // States
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [typedMessage, setTypedMessage] = useState('');
  const [profileName, setProfileName] = useState('Adnan Siddiqui');
  const [profileEmail, setProfileEmail] = useState('adnan@email.com');
  const [showTyping, setShowTyping] = useState(true);

  useEffect(() => {
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
  }, [router]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping]);


  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const newMsg: Message = {
      id: Date.now(),
      sender: 'user',
      text: typedMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type: 'text'
    };

    setMessages(prev => [...prev, newMsg]);
    setTypedMessage('');
    setShowTyping(true);

    // Automated mock reply setup
    setTimeout(() => {
      setShowTyping(false);
      const replyMsg: Message = {
        id: Date.now() + 1,
        sender: 'vendor',
        text: "Ji bilkul! We have updated the details in your booking file. I will generate the revised order catalog link for you now.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'text'
      };
      setMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  return (
    <>
      <Header />

      <main className={styles.page}>
        {/* Breadcrumb */}
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link>
          <span>&rsaquo;</span>
          <Link href="/profile">Account</Link>
          <span>&rsaquo;</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Customer Service</span>
        </div>

        {/* Dashboard Frame Grid Layout */}
        <div className={styles.chatLayout}>
          
          {/* LEFT: Dashboard sidebar navigation drawer panel */}
          <aside className={styles.sidebar}>
            <div className={styles.sidebarCard}>
              <div className={styles.sidebarProfile}>
                <div className={styles.sidebarAvatar}>
                  {profileName.charAt(0).toUpperCase()}
                </div>
                <h4 className={styles.sidebarName}>{profileName}</h4>
                <p className={styles.sidebarEmail}>{profileEmail}</p>
              </div>

              <nav className={styles.sidebarNav}>
                <div className={styles.sidebarNavLabel}>Activities</div>
                <Link className={styles.sidebarNavItem} href="/orders">
                  <i className="bx bx-receipt"></i> Orders <span className={styles.sidebarNavBadge}>12</span>
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile/deliveries">
                  <i className="bx bx-package"></i> Deliveries
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile/payments">
                  <i className="bx bx-credit-card"></i> Payments
                </Link>
                <Link className={styles.sidebarNavItem} href="/quotes">
                  <i className="bx bx-file-blank"></i> Quotes
                </Link>
                <Link className={styles.sidebarNavItem} href="/events">
                  <i className="bx bx-calendar"></i> Events
                </Link>
                <Link className={styles.sidebarNavItem} href="/registry">
                  <i className="bx bx-gift"></i> Registries
                </Link>
                <Link className={styles.sidebarNavItem} href="/wishlist">
                  <i className="bx bx-heart"></i> Wish List
                </Link>
                <Link className={styles.sidebarNavItem} href="/notifications">
                  <i className="bx bx-bell"></i> Notifications
                </Link>

                <div className={styles.sidebarNavLabel}>Account</div>
                <Link className={styles.sidebarNavItem} href="/profile/address">
                  <i className="bx bx-map"></i> Address
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile/payments">
                  <i className="bx bx-wallet"></i> Payment Methods
                </Link>
                <Link className={styles.sidebarNavItem} href="/referrals">
                  <i className="bx bx-user-plus"></i> Invite Friends
                </Link>
                <Link className={styles.sidebarNavItem} href="/profile">
                  <i className="bx bx-user"></i> Profile Details
                </Link>

                <div className={styles.sidebarNavLabel}>Support</div>
                <Link className={`${styles.sidebarNavItem} ${styles.sidebarNavItemActive}`} href="/chat">
                  <i className="bx bx-headphone"></i> Customer Service
                </Link>
              </nav>
            </div>
          </aside>

          {/* RIGHT: Active Chat Room Panel */}
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
              </div>
              <button
                type="submit"
                className={styles.chatMicBtn}
                title={typedMessage.trim() ? "Send message" : "Hold to record voice message"}
              >
                {typedMessage.trim() ? (
                  <i className="bx bx-send"></i>
                ) : (
                  <i className="bx bx-microphone"></i>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
