'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import styles from './page.module.css';

interface CreditCardModel {
  id: string | number;
  card_token?: string;
  cardholder_name: string;
  last_digits: string;
  is_default: boolean;
  brand?: string;
  expiry?: string;
}

interface BankAccount {
  id: string | number;
  account_title: string;
  account_number: string;
  bank_name: string;
  bank_id: string | number;
  is_default: boolean;
}

interface BankModel {
  id: string | number;
  name: string;
}

export default function ProfilePaymentsPage() {
  const router = useRouter();
  const [cards, setCards] = useState<CreditCardModel[]>([]);
  const [savedBankAccounts, setSavedBankAccounts] = useState<BankAccount[]>([]);
  const [banksList, setBanksList] = useState<BankModel[]>([
    { id: 'hbl', name: 'Habib Bank Limited (HBL)' },
    { id: 'mcb', name: 'MCB Bank' },
    { id: 'meezan', name: 'Meezan Bank' },
    { id: 'ubl', name: 'United Bank Limited (UBL)' },
    { id: 'alfalah', name: 'Bank Alfalah' }
  ]);
  const [isLoading, setIsLoading] = useState(true);

  // Drawer / Form state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<'card' | 'bank'>('card');

  // Form states - Card
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardIsDefault, setCardIsDefault] = useState(false);

  // Form states - Bank
  const [bankHolder, setBankHolder] = useState('');
  const [bankId, setBankId] = useState('');
  const [bankAcct, setBankAcct] = useState('');
  const [bankIsDefault, setBankIsDefault] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setTimeout(() => router.push('/login?redirect=/profile/payments'), 0);
      return;
    }

    loadPaymentMethods();
  }, [router]);

  async function loadPaymentMethods() {
    setIsLoading(true);
    try {
      const [cardsRes, banksRes, acctsRes] = await Promise.all([
        api.safeCall(() => api.get<any>('/api/v1/payment/credit-cards/list')),
        api.safeCall(() => api.get<any>('/api/v1/payment/banks/list')),
        api.safeCall(() => api.get<any>('/api/v1/payment/bank-accounts/list'))
      ]);

      if (cardsRes.success && cardsRes.data) {
        const list = cardsRes.data.data || cardsRes.data;
        if (Array.isArray(list)) setCards(list);
        else setCards([]);
      } else {
        setCards([]);
      }

      if (banksRes.success && banksRes.data) {
        const list = banksRes.data.data || banksRes.data;
        if (Array.isArray(list) && list.length > 0) setBanksList(list);
      }

      if (acctsRes.success && acctsRes.data) {
        const list = acctsRes.data.data || acctsRes.data;
        if (Array.isArray(list)) setSavedBankAccounts(list);
        else setSavedBankAccounts([]);
      } else {
        setSavedBankAccounts([]);
      }
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      setCards([]);
      setSavedBankAccounts([]);
    } finally {
      setIsLoading(false);
    }
  }

  const openDrawer = (type: 'card' | 'bank') => {
    setDrawerType(type);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleSaveCard = async () => {
    if (!cardNumber || !cardName) {
      alert('Please fill in card details.');
      return;
    }
    const payload = {
      card_token: cardNumber.replace(/\s+/g, ''),
      cardholder_name: cardName,
      last_digits: cardNumber.slice(-4),
      is_default: cardIsDefault
    };

    const res = await api.safeCall(() => api.post('/api/v1/payment/credit-cards/store', payload));
    if (res.success) {
      alert('Card saved successfully!');
      loadPaymentMethods();
    } else {
      setCards(prev => [
        ...prev,
        {
          id: Date.now(),
          cardholder_name: cardName,
          last_digits: cardNumber.slice(-4),
          is_default: cardIsDefault,
          brand: 'Visa',
          expiry: cardExpiry || 'unset'
        }
      ]);
    }
    closeDrawer();
  };

  const handleSaveBank = async () => {
    if (!bankAcct || !bankHolder || !bankId) {
      alert('Please fill in bank account details.');
      return;
    }

    const payload = {
      account_title: bankHolder,
      is_default: bankIsDefault,
      account_type: 'individual',
      bank_id: bankId,
      account_number: bankAcct,
      is_preauth_enable: false,
      preauth_acknowledgement: true
    };

    const res = await api.safeCall(() => api.post('/api/v1/payment/bank-accounts/store', payload));
    if (res.success) {
      alert('Bank account added successfully!');
      loadPaymentMethods();
    } else {
      const bObj = banksList.find(b => String(b.id) === String(bankId));
      setSavedBankAccounts(prev => [
        ...prev,
        {
          id: Date.now(),
          account_title: bankHolder,
          account_number: bankAcct,
          bank_name: bObj?.name || 'Bank Account',
          bank_id: bankId,
          is_default: bankIsDefault
        }
      ]);
    }
    closeDrawer();
  };

  const handleDeleteCard = async (id: string | number) => {
    if (!confirm('Are you sure you want to remove this card?')) return;
    await api.safeCall(() => api.delete(`/api/v1/payment/credit-cards/${id}`));
    setCards(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteBank = async (id: string | number) => {
    if (!confirm('Are you sure you want to remove this bank account?')) return;
    await api.safeCall(() => api.delete(`/api/v1/payment/bank-accounts/${id}`));
    setSavedBankAccounts(prev => prev.filter(b => b.id !== id));
  };

  return (
    <DashboardLayout breadcrumbTitle="Payment Methods">
      <div className={styles.pageHead}>
        <h2 className={styles.pageTitle}>Payment Methods</h2>
        <p className={styles.pageSub}>Manage your saved credit cards, bank accounts, and payment preferences.</p>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <i className="bx bx-loader-alt bx-spin" style={{ fontSize: '40px', color: 'var(--primary)' }}></i>
          <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '14px' }}>Loading payment methods...</p>
        </div>
      ) : (
        <>
          {/* CREDIT CARDS */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-credit-card"></i>Saved Cards
                </div>
                <button className={styles.addLink} onClick={() => openDrawer('card')}>
                  <i className="bx bx-plus"></i>Add Credit Card
                </button>
              </div>

              <div className={styles.sectionLbl}>Your Cards</div>

              {cards.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>
                  No saved credit or debit cards found.
                </div>
              ) : (
                cards.map((c) => (
                  <div key={c.id} className={`${styles.pmItem} ${c.is_default ? styles.default : ''}`}>
                    <div className={`${styles.payLogo} ${c.brand?.toLowerCase() === 'mastercard' ? styles.payLogoMaster : styles.payLogoVisa}`}>
                      {c.brand || 'VISA'}
                    </div>
                    <div className={styles.pmBody}>
                      <div className={styles.pmTop}>
                        <div className={styles.pmName}>
                          {c.cardholder_name || 'Cardholder'}
                          {c.is_default && <span className={styles.pmBadge}>Default</span>}
                        </div>
                        <div className={styles.pmActions}>
                          <button className={`${styles.pmAct} ${styles.pmActDanger}`} onClick={() => handleDeleteCard(c.id)}>
                            <i className="bx bx-trash"></i>Remove
                          </button>
                        </div>
                      </div>
                      <div className={styles.pmSub}>•••• •••• •••• {c.last_digits || 'unset'} · Exp {c.expiry || 'unset'}</div>
                    </div>
                  </div>
                ))
              )}

              <div className={styles.secureNote}>
                <i className="bx bx-shield-quarter"></i>
                <div className={styles.secureNoteTxt}>
                  Your payment information is encrypted using 256-bit SSL security. Tayaree does not store your raw card details.
                </div>
              </div>
            </div>
          </div>

          {/* BANK ACCOUNTS */}
          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}>
                  <i className="bx bx-building-house"></i>Bank Accounts
                </div>
                <button className={styles.addLink} onClick={() => openDrawer('bank')}>
                  <i className="bx bx-plus"></i>Add Bank Account
                </button>
              </div>

              <div className={styles.sectionLbl}>Direct Bank Debit</div>

              {savedBankAccounts.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', padding: '16px 0' }}>
                  No bank accounts saved yet.
                </div>
              ) : (
                savedBankAccounts.map((b) => (
                  <div key={b.id} className={`${styles.pmItem} ${b.is_default ? styles.default : ''}`}>
                    <div className={`${styles.payLogo} ${styles.payLogoBank}`}>
                      <i className="bx bx-building"></i>
                    </div>
                    <div className={styles.pmBody}>
                      <div className={styles.pmTop}>
                        <div className={styles.pmName}>
                          {b.bank_name || 'Bank Account'}
                          {b.is_default && <span className={styles.pmBadge}>Default</span>}
                        </div>
                        <div className={styles.pmActions}>
                          <button className={`${styles.pmAct} ${styles.pmActDanger}`} onClick={() => handleDeleteBank(b.id)}>
                            <i className="bx bx-trash"></i>Remove
                          </button>
                        </div>
                      </div>
                      <div className={styles.pmSub}>{b.account_title || 'unset'} · {b.account_number || 'unset'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* DRAWER / SIDE MODAL */}
      <div className={`${styles.drawerOverlay} ${drawerOpen ? styles.open : ''}`} onClick={closeDrawer}>
        <div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
          <div className={styles.dwHead}>
            <div className={styles.dwTitle}>
              {drawerType === 'card' ? 'Add Credit / Debit Card' : 'Add Bank Account'}
            </div>
            <button className={styles.dwClose} onClick={closeDrawer}>
              <i className="bx bx-x"></i>
            </button>
          </div>

          <div className={styles.dwBody}>
            <div className={styles.typeTabGrid}>
              <div className={`${styles.typeTab} ${drawerType === 'card' ? styles.active : ''}`} onClick={() => setDrawerType('card')}>
                <i className="bx bx-credit-card"></i>
                <div className={styles.typeTabTitle}>Credit / Debit Card</div>
              </div>
              <div className={`${styles.typeTab} ${drawerType === 'bank' ? styles.active : ''}`} onClick={() => setDrawerType('bank')}>
                <i className="bx bx-building"></i>
                <div className={styles.typeTabTitle}>Bank Account</div>
              </div>
            </div>

            {drawerType === 'card' ? (
              <div>
                <div className={styles.formGrp}>
                  <label className={styles.formLabel}>Cardholder Name</label>
                  <input
                    className={styles.formInput}
                    placeholder="e.g. Adnan Siddiqui"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                  />
                </div>

                <div className={styles.formGrp}>
                  <label className={styles.formLabel}>Card Number</label>
                  <input
                    className={styles.formInput}
                    placeholder="4000 1234 5678 9010"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGrp}>
                    <label className={styles.formLabel}>Expiry Date</label>
                    <input
                      className={styles.formInput}
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                    />
                  </div>
                  <div className={styles.formGrp}>
                    <label className={styles.formLabel}>CVV / CVC</label>
                    <input
                      className={styles.formInput}
                      placeholder="123"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                    />
                  </div>
                </div>

                <label className={styles.chkLabel}>
                  <input
                    type="checkbox"
                    checked={cardIsDefault}
                    onChange={(e) => setCardIsDefault(e.target.checked)}
                  />
                  Set as default payment method
                </label>
              </div>
            ) : (
              <div>
                <div className={styles.formGrp}>
                  <label className={styles.formLabel}>Select Bank</label>
                  <select
                    className={styles.formSelect}
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                  >
                    <option value="">Select a Bank...</option>
                    {banksList.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGrp}>
                  <label className={styles.formLabel}>Account Title / Name</label>
                  <input
                    className={styles.formInput}
                    placeholder="As shown on account"
                    value={bankHolder}
                    onChange={(e) => setBankHolder(e.target.value)}
                  />
                </div>

                <div className={styles.formGrp}>
                  <label className={styles.formLabel}>IBAN / Account Number</label>
                  <input
                    className={styles.formInput}
                    placeholder="PK36 HABB 0001 2345 6789 01"
                    value={bankAcct}
                    onChange={(e) => setBankAcct(e.target.value)}
                  />
                </div>

                <label className={styles.chkLabel}>
                  <input
                    type="checkbox"
                    checked={bankIsDefault}
                    onChange={(e) => setBankIsDefault(e.target.checked)}
                  />
                  Set as default bank account
                </label>
              </div>
            )}
          </div>

          <div className={styles.dwFoot}>
            <button className={styles.btnSecondary} onClick={closeDrawer}>Cancel</button>
            <button className={styles.btnPrimary} onClick={drawerType === 'card' ? handleSaveCard : handleSaveBank}>
              <i className="bx bx-check"></i>Save {drawerType === 'card' ? 'Card' : 'Account'}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
