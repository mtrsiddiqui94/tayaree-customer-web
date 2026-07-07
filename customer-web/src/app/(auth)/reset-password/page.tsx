'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from '../auth.module.css';

interface ResetPasswordResponse {
  message: string;
  [key: string]: any;
}

function ResetPasswordContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  // Inputs
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [pwStrength, setPwStrength] = useState(0);
  const [strengthLabel, setStrengthLabel] = useState('8+ characters');
  const [passwordsMatch, setPasswordsMatch] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Field specific validation errors
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if no token is present
  useEffect(() => {
    if (!token) {
      setError('Invalid or expired password reset link. Please request a new code.');
    }
  }, [token]);

  // Calculate password strength
  useEffect(() => {
    if (!password) {
      setPwStrength(0);
      setStrengthLabel('8+ characters');
      return;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[0-9]/.test(password) && /[a-zA-Z]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password) && password.length >= 10) score++;

    const finalScore = Math.max(1, score);
    setPwStrength(finalScore);

    const labels = [
      '8+ characters',
      'a weak password',
      'a fair password',
      'a strong password',
    ];
    setStrengthLabel(labels[finalScore] || '8+ characters');
  }, [password]);

  // Check password matching
  useEffect(() => {
    if (!confirmPassword) {
      setPasswordsMatch(null);
      return;
    }
    setPasswordsMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setIsConfirmPasswordVisible(!isConfirmPasswordVisible);
  };

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required.');
      return false;
    }
    if (value.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password.');
      return false;
    }
    if (value !== password) {
      setConfirmPasswordError('Passwords do not match.');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Trigger validations
    const isPasswordValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword);

    if (!isPasswordValid || !isConfirmValid) {
      return;
    }

    if (!token) {
      showToast('Password reset token is missing. Please go back and try again.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post<ResetPasswordResponse>('/api/v1/auth/reset-password', {
        _token: token,
        password: password,
        password_confirmation: confirmPassword,
      });

      showToast(response.message || 'Password has been reset successfully!', 'success');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password. Please try again.', 'error');
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
            Almost there.
            <br />
            Set a new password.
          </div>
          <div className={styles.brandSub}>
            Choose a strong password you haven't used before. You'll use it to
            sign in from now on.
          </div>
          <div className={styles.brandFeats}>
            <div className={styles.brandFeat}>
              <i className="bx bx-check-shield"></i>Identity verified
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-lock-alt"></i>Encrypted &amp; stored securely
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
              <i className="bx bx-lock-alt"></i>
            </div>
            <h1 className={styles.authTitle}>Set a new password</h1>
            <p className={styles.authSub}>
              Create a new password for your account. Make it at least 8 characters.
            </p>

            <form onSubmit={handleResetPassword} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>New Password</label>
                <div
                  className={`${styles.fldWrap} ${
                    passwordError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-lock-alt lead"></i>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Enter a new password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={(e) => validatePassword(e.target.value)}
                    required
                    disabled={isLoading || !token}
                  />
                  <i
                    className={`bx fld-eye ${
                      isPasswordVisible ? 'bx-show' : 'bx-hide'
                    }`}
                    onClick={togglePasswordVisibility}
                  ></i>
                </div>
                {passwordError && (
                  <span className={styles.fldErrorMsg}>{passwordError}</span>
                )}
                
                <div className={styles.pwStrength}>
                  <div className={styles.pwBars}>
                    <div
                      className={`${styles.pwBar} ${
                        pwStrength >= 1 ? styles[`on${pwStrength}`] : ''
                      }`}
                    ></div>
                    <div
                      className={`${styles.pwBar} ${
                        pwStrength >= 2 ? styles[`on${pwStrength}`] : ''
                      }`}
                    ></div>
                    <div
                      className={`${styles.pwBar} ${
                        pwStrength >= 3 ? styles[`on${pwStrength}`] : ''
                      }`}
                    ></div>
                  </div>
                  <div className={styles.pwHint}>
                    <i className="bx bx-info-circle"></i>
                    <span>
                      Use <b>{strengthLabel}</b> with a number &amp; a symbol
                      for a strong password.
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Confirm Password</label>
                <div
                  className={`${styles.fldWrap} ${
                    confirmPasswordError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-lock-alt lead"></i>
                  <input
                    type={isConfirmPasswordVisible ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError)
                        validateConfirmPassword(e.target.value);
                    }}
                    onBlur={(e) => validateConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading || !token}
                  />
                  <i
                    className={`bx fld-eye ${
                      isConfirmPasswordVisible ? 'bx-show' : 'bx-hide'
                    }`}
                    onClick={toggleConfirmPasswordVisibility}
                  ></i>
                </div>
                {confirmPasswordError && (
                  <span className={styles.fldErrorMsg}>
                    {confirmPasswordError}
                  </span>
                )}
                
                {passwordsMatch !== null && (
                  <div
                    className={`${styles.matchNote} ${
                      passwordsMatch ? styles.ok : styles.bad
                    }`}
                  >
                    {passwordsMatch ? (
                      <>
                        <i className="bx bx-check-circle"></i>Passwords match
                      </>
                    ) : (
                      <>
                        <i className="bx bx-x-circle"></i>Passwords don't match yet
                      </>
                    )}
                  </div>
                )}
              </div>



              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading || !token || passwordsMatch === false}
              >
                {isLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-shield"></i>Reset Password
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className={styles.authSplit} style={{ alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
