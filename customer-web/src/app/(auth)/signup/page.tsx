'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import styles from '../auth.module.css';

interface RegisterResponse {
  message: string;
  phone: string;
  phone_country: string;
}

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 10)}`;
};

export default function SignupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  
  // Input States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Field Validation Errors
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [agreeTermsError, setAgreeTermsError] = useState('');

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Validations
  const validateFullName = (value: string): boolean => {
    if (!value.trim()) {
      setFullNameError('Full name is required.');
      return false;
    }
    if (value.trim().length < 3) {
      setFullNameError('Name must be at least 3 characters.');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (value: string): boolean => {
    if (!value.trim()) {
      setEmailError('Email is required.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value.trim())) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgreeTermsError('');

    // Trigger validations
    const isNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);

    if (!agreeTerms) {
      setAgreeTermsError('You must agree to the terms and privacy policy.');
    }

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !agreeTerms) {
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

      await api.post<RegisterResponse>('/api/v1/auth/register', {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: fullPhoneNumber,
        phone_country: 'PK',
        password: password,
        password_confirmation: password,
      });

      // Redirect to OTP verification on success
      showToast('Registration successful! Verification code sent.', 'success');
      router.push(
        `/verify-otp?phone=${encodeURIComponent(
          fullPhoneNumber
        )}&country=PK&flow=signup`
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
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
            Start planning
            <br />
            in minutes.
          </div>
          <div className={styles.brandSub}>
            Create an account to browse thousands of caterers, venues, and
            decorators, request instant quotes, and organize your registry.
          </div>
          <div className={styles.brandFeats}>
            <div className={styles.brandFeat}>
              <i className="bx bx-check-double"></i>100% free planner dashboard
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-message-rounded-check"></i>Direct chat with
              vetted vendors
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-calendar-star"></i>Collaborative guest list
              features
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
            Already have an account?
            <Link href="/login" className={styles.link}>
              Sign in
            </Link>
          </span>
        </div>

        <div className={styles.authBody}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>
              <i className="bx bx-user-plus"></i>
            </div>
            <h1 className={styles.authTitle}>Create your account</h1>
            <p className={styles.authSub}>
              Join Tayaree to plan events and shop with trusted vendors.
            </p>

            <form onSubmit={handleSignup} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>Full Name</label>
                <div
                  className={`${styles.fldWrap} ${
                    fullNameError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-user lead"></i>
                  <input
                    type="text"
                    placeholder="e.g. Adnan Siddiqui"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (fullNameError) validateFullName(e.target.value);
                    }}
                    onBlur={(e) => validateFullName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {fullNameError && (
                  <span className={styles.fldErrorMsg}>{fullNameError}</span>
                )}
              </div>

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Email</label>
                <div
                  className={`${styles.fldWrap} ${
                    emailError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-envelope lead"></i>
                  <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={(e) => validateEmail(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                {emailError && (
                  <span className={styles.fldErrorMsg}>{emailError}</span>
                )}
              </div>

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

              <div className={styles.fld}>
                <label className={styles.fldLbl}>Password</label>
                <div
                  className={`${styles.fldWrap} ${
                    passwordError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-lock-alt lead"></i>
                  <input
                    type={isPasswordVisible ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={(e) => validatePassword(e.target.value)}
                    disabled={isLoading}
                    required
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
              </div>



              <div className={styles.rowBetween}>
                <label className={styles.remember}>
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => {
                      setAgreeTerms(e.target.checked);
                      if (e.target.checked) setAgreeTermsError('');
                    }}
                    disabled={isLoading}
                  />
                  I agree to the <a href="#">Terms</a> &amp;{' '}
                  <Link href="/privacy">Privacy Policy</Link>
                </label>
              </div>
              {agreeTermsError && (
                <div className={styles.fldErrorMsg} style={{ marginBottom: '16px' }}>
                  {agreeTermsError}
                </div>
              )}

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="bx bx-user-plus"></i>Create Account
                  </>
                )}
              </button>
            </form>

            <div className={styles.authOr}>or continue with</div>
            <div className={styles.socialRow}>
              <button className={styles.socialBtn} disabled={isLoading}>
                <i className="bx bxl-google"></i>Google
              </button>
              <button className={styles.socialBtn} disabled={isLoading}>
                <i className="bx bxl-apple"></i>Apple
              </button>
            </div>

            <div className={styles.authFoot}>
              Already have an account? <Link href="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
