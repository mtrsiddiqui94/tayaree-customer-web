'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from '../auth.module.css';

interface OtpRequestResponse {
  message: string;
}

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 10)}`;
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = (value: string): boolean => {
    const clean = value.replace(/[^0-9]/g, '').trim();
    if (!clean) {
      setPhoneError('Phone number is required.');
      return false;
    }
    let localNum = clean;
    if (localNum.startsWith('92')) localNum = localNum.slice(2);
    else if (localNum.startsWith('0')) localNum = localNum.slice(1);

    if (localNum.length < 9 || localNum.length > 10) {
      setPhoneError('Please enter a valid 9 or 10-digit mobile number.');
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger validation
    const isPhoneValid = validatePhone(phone);
    if (!isPhoneValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number (strip leading 0 or +92/92 if typed)
      let cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('92')) {
        cleanPhone = cleanPhone.replace(/^92/, '');
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.replace(/^0/, '');
      }

      const fullPhoneNumber = `+92${cleanPhone}`;

      const response = await api.post<OtpRequestResponse>('/api/v1/auth/otp/request', {
        phone: fullPhoneNumber,
        phone_country: 'PK',
        is_resend: '0',
        otp_type: 'reset-password',
      });

      showToast(response.message || 'Verification code sent successfully.', 'success');

      // Redirect to OTP verification page in reset mode
      router.push(
        `/verify-otp?phone=${encodeURIComponent(
          fullPhoneNumber
        )}&country=PK&flow=reset`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to send verification code. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
            Locked out?
            <br />
            No problem.
          </div>
          <div className={styles.brandSub}>
            We&apos;ll send a one-time verification code to your email or phone so
            you can set a new password securely.
          </div>
          <div className={styles.brandFeats}>
            <div className={styles.brandFeat}>
              <i className="bx bx-shield-quarter"></i>Secure code-based reset
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-time-five"></i>Codes expire in 10 minutes
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
            Remembered it?
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </span>
        </div>

        <div className={styles.authBody}>
          <div className={styles.authCard}>
            <Link href="/login" className={styles.backLink}>
              <i className="bx bx-chevron-left"></i>Back to sign in
            </Link>
            <div className={styles.authIcon}>
              <i className="bx bx-lock-open-alt"></i>
            </div>
            <h1 className={styles.authTitle}>Forgot password?</h1>
            <p className={styles.authSub}>
              Enter the phone linked to your account and we&apos;ll send a
              verification code.
            </p>

            <form onSubmit={handleForgotPassword} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>Phone Number</label>
                <div
                  className={`${styles.fldWrap} ${
                    phoneError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-phone lead"></i>
                  <span className={styles.fldCc}>+92</span>
                  <input
                    type="tel"
                    placeholder="3XX XXXXXXX"
                    value={phone}
                    onChange={(e) => {
                      const formatted = formatPhoneNumber(e.target.value);
                      setPhone(formatted);
                      if (phoneError) validatePhone(formatted);
                    }}
                    onBlur={(e) => validatePhone(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {phoneError && (
                  <span className={styles.fldErrorMsg}>{phoneError}</span>
                )}
              </div>

              <div className={styles.infoNote}>
                <i className="bx bx-info-circle"></i>
                <span>
                  For your security, we&apos;ll never show whether an account exists.
                  If it does, a code is on its way.
                </span>
              </div>



              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Sending Code...
                  </>
                ) : (
                  <>
                    <i className="bx bx-paper-plane"></i>Send Code
                  </>
                )}
              </button>
            </form>

            <div className={styles.authFoot}>
              Need help? <Link href="/chat">Contact support</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
