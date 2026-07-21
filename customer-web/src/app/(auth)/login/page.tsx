'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ENDPOINTS } from '@/lib/constants';
import styles from '../auth.module.css';

interface LoginResponse {
  status: boolean;
  message: string;
  data?: {
    phone: string;
    otp_verification: number;
    authorization?: {
      _token: string;
      type: string;
    };
  };
}

const formatPhoneNumber = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3, 10)}`;
};

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('PK');
  const [phonePrefix, setPhonePrefix] = useState('+92');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Validation States
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const validatePhone = (value: string): boolean => {
    const clean = value.replace(/[^0-9]/g, '').trim();
    if (!clean) {
      setPhoneError('Phone number is required.');
      return false;
    }
    // Remove leading country prefix or zero for format checks
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Trigger field validations
    const isPhoneValid = validatePhone(phone);
    const isPasswordValid = validatePassword(password);

    if (!isPhoneValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      // Clean phone number (strip leading 0 or +92/92 if typed)
      let cleanPhone = phone.trim().replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('92')) {
        cleanPhone = cleanPhone.replace(/^92/, '');
      } else if (cleanPhone.startsWith('0')) {
        cleanPhone = cleanPhone.replace(/^0/, '');
      }

      const fullPhoneNumber = `${phonePrefix}${cleanPhone}`;

      const response = await api.post<LoginResponse>(ENDPOINTS.AUTH_LOGIN, {
        phone: fullPhoneNumber,
        phone_country: phoneCountry,
        password: password,
      });

      if (response.data?.authorization?._token) {
        // Successful login
        login(response.data.authorization._token, response.data.phone);
        showToast('Welcome back! Successfully logged in.', 'success');
        router.push('/');
      } else if (response.data?.otp_verification === 0) {
        // OTP Required
        showToast('OTP verification is required.', 'info');
        router.push(
          `/verify-otp?phone=${encodeURIComponent(
            fullPhoneNumber
          )}&country=${phoneCountry}&flow=signup`
        );
      } else {
        showToast(response.message || 'Login failed. Please try again.', 'error');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Incorrect phone number or password.';
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
            Your event,
            <br />
            all in one place.
          </div>
          <div className={styles.brandSub}>
            Compare vendor quotes, build gift registries, and track every order
            — from the first idea to the big day.
          </div>
          <div className={styles.brandFeats}>
            <div className={styles.brandFeat}>
              <i className="bx bx-receipt"></i>Compare anonymous vendor quotes
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-gift"></i>Build &amp; share gift registries
            </div>
            <div className={styles.brandFeat}>
              <i className="bx bx-package"></i>Track orders, deliveries &amp;
              payments
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
            New to Tayaree?
            <Link href="/signup" className={styles.link}>
              Create account
            </Link>
          </span>
        </div>

        <div className={styles.authBody}>
          <div className={styles.authCard}>
            <div className={styles.authIcon}>
              <i className="bx bx-user-circle"></i>
            </div>
            <h1 className={styles.authTitle}>Welcome back</h1>
            <p className={styles.authSub}>
              Sign in to manage your events, quotes, orders and registries.
            </p>

            <form onSubmit={handleLogin} noValidate>
              <div className={styles.fld}>
                <label className={styles.fldLbl}>Phone Number</label>
                <div
                  className={`${styles.fldWrap} ${
                    phoneError ? styles.fldWrapError : ''
                  }`}
                >
                  <i className="bx bx-phone lead"></i>
                  <span className={styles.fldCc}>{phonePrefix}</span>
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
                    placeholder="Enter your password"
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
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                  Remember me
                </label>
                <Link href="/forgot-password" className={styles.linkR}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="bx bx-loader-alt bx-spin" style={{ marginRight: '6px' }}></i>
                    Signing In...
                  </>
                ) : (
                  <>
                    <i className="bx bx-log-in"></i>Sign In
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
              Don&apos;t have an account? <Link href="/signup">Sign up</Link>
            </div>
            <div className={styles.authLegal}>
              By signing in you agree to our <a href="#">Terms</a> and{' '}
              <Link href="/privacy">Privacy Policy</Link>.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
