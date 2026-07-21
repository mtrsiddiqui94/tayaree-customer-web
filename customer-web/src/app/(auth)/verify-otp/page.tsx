'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/lib/constants';
import styles from '../auth.module.css';

interface VerifyOtpResponse {
  status: boolean;
  message: string;
  data?: {
    _token?: string; // present on reset flow verify success
    phone?: string;
    authorization?: {
      _token: string;
      type: string;
    };
  };
}

function VerifyOtpContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const phone = searchParams.get('phone') || '';
  const country = searchParams.get('country') || 'PK';
  const flow = searchParams.get('flow') || 'signup'; // 'signup' or 'reset'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [countdown, setCountdown] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (countdown === 0) return;
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Focus the first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleOtpChange = (value: string, index: number) => {
    const cleanValue = value.replace(/[^0-9]/g, '').slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = cleanValue;
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const newOtp = [...otp];
      newOtp[index - 1] = '';
      setOtp(newOtp);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const isOtpComplete = otp.every((digit) => digit !== '');
  const otpCode = otp.join('');

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isOtpComplete) return;

    setIsLoading(true);

    const otpType = flow === 'reset' ? 'reset-password' : 'authentication';

    try {
      const response = await api.post<VerifyOtpResponse>(ENDPOINTS.AUTH_OTP_VERIFY, {
        phone: phone,
        phone_country: country,
        otp_code: otpCode,
        otp_type: otpType,
      });

      if (flow === 'signup') {
        if (response.data?.authorization?._token) {
          login(response.data.authorization._token, phone);
          showToast('Account verified successfully!', 'success');
          router.push('/');
        } else {
          showToast('Failed to retrieve authentication token.', 'error');
        }
      } else {
        if (response.data?._token) {
          showToast('OTP verified successfully.', 'success');
          router.push(`/reset-password?token=${encodeURIComponent(response.data._token)}`);
        } else {
          showToast('Verification failed. Reset token not received.', 'error');
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Invalid OTP code. Please check and try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    setIsLoading(true);

    const otpType = flow === 'reset' ? 'reset-password' : 'authentication';

    try {
      const response = await api.post<{ message: string }>(ENDPOINTS.AUTH_OTP_REQUEST, {
        phone: phone,
        phone_country: country,
        is_resend: '1',
        otp_type: otpType,
      });

      showToast(response.message || 'A new verification code has been sent.', 'success');
      setCountdown(30);
      setOtp(Array(6).fill(''));
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to resend verification code. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Mask phone number for UI display (e.g. +92 312 456 7890 -> +92 3•• ••• 7890)
  const maskPhone = (phoneStr: string) => {
    if (!phoneStr) return '';
    const clean = phoneStr.trim();
    if (clean.length > 8) {
      return `${clean.slice(0, 6)}•• ••• ${clean.slice(-4)}`;
    }
    return clean;
  };

  const backUrl = flow === 'reset' ? '/forgot-password' : '/signup';

  return (
    <div className={styles.authSplit}>
      {/* BRAND PANEL */}
      <aside className={styles.authBrand}>
        <Link href="/" className={styles.brandLogo}>
          <div className={styles.brandLogoMark}>T</div>
          <span className={styles.brandLogoName}>Tayaree</span>
        </Link>
        <div className={styles.brandMid}>
          <div className={styles.brandHead}>
            One quick
            <br />
            security check.
          </div>
          <div className={styles.brandSub}>
            Enter the 6-digit code we just sent you. This keeps your account
            safe and confirms it&apos;s really you.
          </div>
          <div className={styles.brandFeats}>
            <div className={styles.brandFeat}>
              <i className="bx bx-shield-quarter"></i>Protects your account
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-time-five"></i>Code expires in 10 minutes
            </div>
          </div>
        </div>
        <div className={styles.brandFoot}>
          © 2026 Tayaree · Events made effortless.
        </div>
      </aside>

      {/* FORM SIDE */}
      <main className={styles.authFormSide}>
        <div className={styles.authTopbar}>
          <Link href="/" className={styles.mLogo}>
            <div className={styles.lm}>T</div>
            <span className={styles.ln}>Tayaree</span>
          </Link>
          <span>
            Need help?
            <Link href="/chat" className={styles.link}>
              Contact support
            </Link>
          </span>
        </div>

        <div className={styles.authBody}>
          <div className={styles.authCard}>
            <Link href={backUrl} className={styles.backLink}>
              <i className="bx bx-chevron-left"></i>Back
            </Link>
            <div className={styles.authIcon}>
              <i className="bx bx-message-square-dots"></i>
            </div>
            <h1 className={styles.authTitle}>Verify your account</h1>
            <p className={styles.authSub}>
              We sent a 6-digit code to{' '}
              <b id="dest">{maskPhone(phone) || 'your phone number'}</b>. Enter it
              below to continue.
            </p>

            <form onSubmit={(e) => e.preventDefault()}>
              <div className={styles.otpRow} id="otpRow">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    className={`${styles.otpInput} ${digit ? styles.filled : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={idx === 0 ? handlePaste : undefined}
                    disabled={isLoading}
                    autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                  />
                ))}
              </div>



              <button
                type="button"
                onClick={() => handleVerify()}
                className={`${styles.btnPrimary} ${!isOtpComplete ? styles.disabled : ''}`}
                disabled={!isOtpComplete || isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Verifying...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-shield"></i>Verify &amp; Continue
                  </>
                )}
              </button>
            </form>

            <div className={styles.otpResend}>
              Didn&apos;t get the code?{' '}
              {countdown > 0 ? (
                <a className={styles.off}>
                  Resend in <b>0:{countdown < 10 ? `0${countdown}` : countdown}</b>
                </a>
              ) : (
                <a onClick={handleResend}>Resend code</a>
              )}
            </div>
            <div className={styles.otpChange}>
              <Link href={backUrl}>
                <i
                  className="bx bx-edit-alt"
                  style={{ fontSize: '13px', verticalAlign: 'middle', marginRight: '4px' }}
                ></i>{' '}
                Change phone number
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className={styles.authSplit} style={{ alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>}>
      <VerifyOtpContent />
    </Suspense>
  );
}
