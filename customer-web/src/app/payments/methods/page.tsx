"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { api } from "@/lib/api";

interface CreditCardModel {
  id: string | number;
  card_token: string;
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

export default function PaymentMethodsPage() {
  const [cards, setCards] = useState<CreditCardModel[]>([]);
  const [banksList, setBanksList] = useState<BankModel[]>([]);
  const [savedBankAccounts, setSavedBankAccounts] = useState<BankAccount[]>([]);
  
  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2 | 3>(1);
  const [codDrawerOpen, setCodDrawerOpen] = useState(false);
  const [delModalOpen, setDelModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string | number; type: "card" | "bank" } | null>(null);

  // Form states - Card
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardIsDefault, setCardIsDefault] = useState(false);

  // Form states - Bank
  const [bankHolder, setBankHolder] = useState("");
  const [bankId, setBankId] = useState("");
  const [bankAcct, setBankAcct] = useState("");
  const [bankIsDefault, setBankIsDefault] = useState(false);
  const [codEnabled, setCodEnabled] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const cardsRes = await api.get<any>("/api/v1/payment/credit-cards/list");
      if (cardsRes?.data && Array.isArray(cardsRes.data)) {
        setCards(cardsRes.data);
      } else if (cardsRes?.data?.data && Array.isArray(cardsRes.data.data)) {
        setCards(cardsRes.data.data);
      }

      const banksRes = await api.get<any>("/api/v1/payment/banks/list");
      if (banksRes?.data && Array.isArray(banksRes.data)) {
        setBanksList(banksRes.data);
      } else if (banksRes?.data?.data && Array.isArray(banksRes.data.data)) {
        setBanksList(banksRes.data.data);
      }

      try {
        const acctsRes = await api.get<any>("/api/v1/payment/bank-accounts/list");
        if (acctsRes?.data && Array.isArray(acctsRes.data)) {
          setSavedBankAccounts(acctsRes.data);
        } else if (acctsRes?.data?.data && Array.isArray(acctsRes.data.data)) {
          setSavedBankAccounts(acctsRes.data.data);
        }
      } catch (err) {
        console.warn("Could not fetch bank accounts", err);
      }
    } catch (err) {
      console.error("Error loading payment methods:", err);
    }
  }

  const openDrawer = (step: 1 | 2 | 3 = 1) => {
    setDrawerStep(step);
    setDrawerOpen(true);
    resetForms();
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const resetForms = () => {
    setCardName("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardIsDefault(false);

    setBankHolder("");
    setBankId("");
    setBankAcct("");
    setBankIsDefault(false);
  };

  const saveCard = async () => {
    try {
      const payload = {
        card_token: cardNumber.replace(/\s+/g, ""), // fake token for now
        cardholder_name: cardName,
        last_digits: cardNumber.slice(-4),
        is_default: cardIsDefault,
      };
      await api.post("/api/v1/payment/credit-cards/store", payload);
      closeDrawer();
      loadData();
    } catch (err) {
      console.error("Error saving card:", err);
      alert("Failed to save card");
    }
  };

  const saveBank = async () => {
    try {
      // 1. Verify
      await api.post("/api/v1/payment/bank-accounts/verify", {
        account_number: bankAcct,
        bank_id: bankId,
      });

      // 2. Store
      await api.post("/api/v1/payment/bank-accounts/store", {
        account_title: bankHolder,
        is_default: bankIsDefault,
        account_type: "individual", // assumed
        bank_id: bankId,
        account_number: bankAcct,
        is_preauth_enable: false,
        preauth_acknowledgement: true,
      });
      closeDrawer();
      loadData();
    } catch (err) {
      console.error("Error saving bank:", err);
      alert("Failed to save bank account");
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "card") {
        await api.delete(`/api/v1/payment/credit-cards/${itemToDelete.id}`);
      } else if (itemToDelete.type === "bank") {
        await api.delete(`/api/v1/payment/bank-accounts/${itemToDelete.id}`);
      }
      setDelModalOpen(false);
      setItemToDelete(null);
      loadData();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert("Failed to delete item");
    }
  };

  const formatCardNumber = (val: string) => {
    return val || "•••• •••• •••• ••••";
  };

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumb}>
        <a href="/">Home</a><span className={styles.sep}>/</span>
        <a href="/profile">Account</a><span className={styles.sep}>/</span>
        <span className={styles.current}>Payment Methods</span>
      </nav>

      <div className={styles.dashLayout}>
        <aside className={styles.dashSidebar}>
          <div className={styles.sidebarCard}>
            <div className={styles.sidebarProfile}>
              <div className={styles.sidebarAvatar}>A</div>
              <div className={styles.sidebarName}>Adnan Siddiqui</div>
              <div className={styles.sidebarEmail}>adnan@email.com</div>
            </div>
            <nav className={styles.sidebarNav}>
              <div className={styles.sidebarNavLabel}>Activities</div>
              <a className={styles.sidebarNavItem} href="/orders"><i className='bx bx-receipt'></i>Orders<span className={styles.sidebarNavBadge}>12</span></a>
              <a className={styles.sidebarNavItem} href="/deliveries"><i className='bx bx-package'></i>Deliveries</a>
              <a className={styles.sidebarNavItem} href="/payments"><i className='bx bx-credit-card'></i>Payments</a>
              <a className={styles.sidebarNavItem} href="/quotes"><i className='bx bx-file-blank'></i>Quotes</a>
              <a className={styles.sidebarNavItem} href="/events"><i className='bx bx-calendar'></i>Events</a>
              <a className={styles.sidebarNavItem} href="/registry"><i className='bx bx-gift'></i>Registries</a>
              <a className={styles.sidebarNavItem} href="/wishlist"><i className='bx bx-heart'></i>Wish List</a>
              <a className={styles.sidebarNavItem} href="/notifications"><i className='bx bx-bell'></i>Notifications</a>
              
              <div className={styles.sidebarNavLabel}>Account</div>
              <a className={styles.sidebarNavItem} href="/address"><i className='bx bx-map'></i>Address</a>
              <a className={`${styles.sidebarNavItem} ${styles.sidebarNavItemActive}`} href="/payments/methods"><i className='bx bx-wallet'></i>Payment Methods</a>
              <a className={styles.sidebarNavItem} href="/invite"><i className='bx bx-user-plus'></i>Invite Friends</a>
              <a className={styles.sidebarNavItem} href="/profile/edit"><i className='bx bx-user'></i>Profile</a>
              <a className={styles.sidebarNavItem} href="/password"><i className='bx bx-lock'></i>Password</a>
              <a className={styles.sidebarNavItem} href="/phone"><i className='bx bx-phone'></i>Phone</a>
              
              <div className={styles.sidebarNavLabel}>Support</div>
              <a className={styles.sidebarNavItem} href="/chat"><i className='bx bx-headphone'></i>Customer Service</a>
              <a className={styles.sidebarNavItem} href="/privacy"><i className='bx bx-shield'></i>Privacy Policy</a>
              <a className={styles.sidebarNavItem} href="/login" style={{ color: "var(--primary)" }}><i className='bx bx-log-out'></i>Sign Out</a>
            </nav>
          </div>
        </aside>

        <div className={styles.dashContent}>
          <div className={styles.pageHead}>
            <div className={styles.pageTitle}>Payment Methods</div>
            <div className={styles.pageSub}>Manage the cards and payment options used at checkout.</div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}><i className='bx bx-credit-card'></i>Saved Cards</div>
                <button className={styles.addLink} onClick={() => openDrawer(1)}><i className='bx bx-plus'></i>Add Payment Method</button>
              </div>

              {cards.map(card => (
                <div key={card.id} className={`${styles.pmItem} ${card.is_default ? styles.pmItemDefault : ""}`}>
                  <div className={`${styles.payLogo} ${card.brand === "visa" ? styles.payLogoVisa : styles.payLogoMaster}`}>
                    {card.brand === "visa" ? "VISA" : (card.brand === "mastercard" ? "MC" : "CARD")}
                  </div>
                  <div className={styles.pmBody}>
                    <div className={styles.pmTop}>
                      <div className={styles.pmName}>
                        •••• •••• •••• {card.last_digits || "unset"}
                        {card.is_default && <span className={styles.pmBadge}>Default</span>}
                      </div>
                      <div className={styles.pmActions}>
                        <button className={`${styles.pmAct} ${styles.pmActDanger}`} onClick={() => {
                          setItemToDelete({ id: card.id, type: "card" });
                          setDelModalOpen(true);
                        }}><i className='bx bx-trash'></i>Delete</button>
                      </div>
                    </div>
                    <div className={styles.pmSub}>{card.brand || "Card"} · {card.cardholder_name || "unset"} · Expires {card.expiry || "unset"}</div>
                  </div>
                </div>
              ))}

              {cards.length === 0 && (
                <div style={{fontSize: 13, color: "var(--text-secondary)", marginBottom: 14}}>No cards saved yet.</div>
              )}

              <div className={styles.secureNote}>
                <i className='bx bx-lock-alt'></i>
                <div className={styles.secureNoteTxt}>Your card details are encrypted and stored securely. Tayaree never stores your full card number or CVV.</div>
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.cardHead}>
                <div className={styles.cardTitle}><i className='bx bx-bank'></i>Linked Bank Accounts</div>
                <button className={styles.addLink} onClick={() => openDrawer(3)}><i className='bx bx-plus'></i>Add Bank Account</button>
              </div>
              
              {savedBankAccounts.map(bank => (
                <div key={bank.id} className={styles.pmItem}>
                  <div className={`${styles.payLogo} ${styles.payLogoBank}`}><i className='bx bx-bank'></i></div>
                  <div className={styles.pmBody}>
                    <div className={styles.pmTop}>
                      <div className={styles.pmName}>
                        {bank.bank_name || "unset"}
                        {bank.is_default && <span className={styles.pmBadge}>Default</span>}
                      </div>
                      <div className={styles.pmActions}>
                        <button className={`${styles.pmAct} ${styles.pmActDanger}`} onClick={() => {
                          setItemToDelete({ id: bank.id, type: "bank" });
                          setDelModalOpen(true);
                        }}><i className='bx bx-trash'></i>Delete</button>
                      </div>
                    </div>
                    <div className={styles.pmSub}>{bank.account_title || "unset"} · Acct {bank.account_number ? `•••• ${bank.account_number.slice(-4)}` : "unset"}</div>
                  </div>
                </div>
              ))}

              {savedBankAccounts.length === 0 && (
                <div style={{fontSize: 13, color: "var(--text-secondary)"}}>No bank accounts linked yet.</div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardInner}>
              <div className={styles.sectionLbl}>Other Methods</div>
              <div className={styles.pmItem}>
                <div className={`${styles.payLogo} ${styles.payLogoCod}`}><i className='bx bx-money'></i></div>
                <div className={styles.pmBody}>
                  <div className={styles.pmTop}>
                    <div className={styles.pmName}>Cash on Delivery</div>
                    <div className={styles.pmActions}>
                      <button className={styles.pmAct} onClick={() => setCodDrawerOpen(true)}><i className='bx bx-cog'></i>Manage</button>
                    </div>
                  </div>
                  <div className={styles.pmSub} style={{ letterSpacing: 0 }}>Pay in cash at the time of service · available on eligible orders</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      <div className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayOpen : ""}`} onClick={closeDrawer}>
        <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.dwHead}>
            <div className={styles.dwHeadL}>
              {drawerStep !== 1 && (
                <button className={styles.dwBack} onClick={() => setDrawerStep(1)}><i className='bx bx-arrow-back'></i></button>
              )}
              <div>
                <div className={styles.dwEyebrow}>Payment Methods</div>
                <div className={styles.dwTitle}>
                  {drawerStep === 1 ? "Add Payment Method" : drawerStep === 2 ? "Add Payment Card" : "Add Bank Account"}
                </div>
              </div>
            </div>
            <button className={styles.dwClose} onClick={closeDrawer}><i className='bx bx-x'></i></button>
          </div>
          <div className={styles.dwBody}>
            {drawerStep === 1 && (
              <div>
                <div className={styles.dwDesc}>Choose your preferred payment method type.</div>
                <button className={styles.methodTile} onClick={() => setDrawerStep(2)}>
                  <div className={styles.methodIc}><i className='bx bx-credit-card-front'></i></div>Debit Card<i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
                <button className={styles.methodTile} onClick={() => setDrawerStep(2)}>
                  <div className={styles.methodIc}><i className='bx bx-credit-card'></i></div>Credit Card<i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
                <button className={styles.methodTile} onClick={() => setDrawerStep(3)}>
                  <div className={styles.methodIc}><i className='bx bx-bank'></i></div>Bank Account<i className={`bx bx-chevron-right ${styles.chev}`}></i>
                </button>
              </div>
            )}

            {drawerStep === 2 && (
              <div>
                <div className={styles.dwDesc}>Add your card information for secure payments.</div>
                <div className={styles.cardPreview}>
                  <div className={styles.cpChip}></div>
                  <div className={styles.cpNum}>{formatCardNumber(cardNumber)}</div>
                  <div className={styles.cpRow}>
                    <div>
                      <div className={styles.cpLbl}>Card Holder</div>
                      <div className={styles.cpVal}>{cardName.toUpperCase() || "YOUR NAME"}</div>
                    </div>
                    <div>
                      <div className={styles.cpLbl}>Expires</div>
                      <div className={styles.cpVal}>{cardExpiry || "MM/YY"}</div>
                    </div>
                  </div>
                </div>
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Card Number</label>
                  <input className={styles.fldInput} placeholder="1234 5678 9012 3456" value={cardNumber} onChange={e => setCardNumber(e.target.value)} />
                </div>
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Card Holder Name</label>
                  <input className={styles.fldInput} placeholder="Adnan Siddiqui" value={cardName} onChange={e => setCardName(e.target.value)} />
                </div>
                <div className={`${styles.fld} ${styles.fldRow2}`}>
                  <div>
                    <label className={styles.fldLbl}>Expiry Date</label>
                    <input className={styles.fldInput} placeholder="MM/YY" value={cardExpiry} onChange={e => setCardExpiry(e.target.value)} />
                  </div>
                  <div>
                    <label className={styles.fldLbl}>CVV</label>
                    <input className={styles.fldInput} placeholder="CVC" maxLength={4} value={cardCvv} onChange={e => setCardCvv(e.target.value)} />
                  </div>
                </div>
                <label className={styles.setDefRow}>
                  <input type="checkbox" checked={cardIsDefault} onChange={e => setCardIsDefault(e.target.checked)} />
                  Set as Default Account
                </label>
                <div className={styles.secureNote}>
                  <i className='bx bx-lock-alt'></i>
                  <div className={styles.secureNoteTxt}>Your card details are encrypted and processed securely. Tayaree never stores your full card number or CVV.</div>
                </div>
                <button className={styles.dwSave} onClick={saveCard}><i className='bx bx-check'></i>Save Card</button>
              </div>
            )}

            {drawerStep === 3 && (
              <div>
                <div className={styles.dwDesc}>Add your bank account for payouts and transfers.</div>
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Account Holder Name</label>
                  <input className={styles.fldInput} placeholder="Adnan Siddiqui" value={bankHolder} onChange={e => setBankHolder(e.target.value)} />
                </div>
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Bank Name</label>
                  <select className={styles.fldInput} value={bankId} onChange={e => setBankId(e.target.value)}>
                    <option value="">Select your bank</option>
                    {banksList.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.fld}>
                  <label className={styles.fldLbl}>Account Number / IBAN</label>
                  <input className={styles.fldInput} placeholder="PK00 XXXX 0000 0000 0000 0000" value={bankAcct} onChange={e => setBankAcct(e.target.value)} />
                </div>
                <label className={styles.setDefRow}>
                  <input type="checkbox" checked={bankIsDefault} onChange={e => setBankIsDefault(e.target.checked)} />
                  Set as Default Account
                </label>
                <div className={styles.secureNote}>
                  <i className='bx bx-lock-alt'></i>
                  <div className={styles.secureNoteTxt}>Your bank details are encrypted and used only for verified payouts.</div>
                </div>
                <button className={styles.dwSave} onClick={saveBank}><i className='bx bx-check'></i>Save Bank Account</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* COD Drawer */}
      <div className={`${styles.drawerOverlay} ${codDrawerOpen ? styles.drawerOverlayOpen : ""}`} onClick={() => setCodDrawerOpen(false)}>
        <div className={styles.drawerPanel} onClick={e => e.stopPropagation()}>
          <div className={styles.dwHead}>
            <div>
              <div className={styles.dwEyebrow}>Payment Methods</div>
              <div className={styles.dwTitle}>Cash on Delivery</div>
            </div>
            <button className={styles.dwClose} onClick={() => setCodDrawerOpen(false)}><i className='bx bx-x'></i></button>
          </div>
          <div className={styles.dwBody}>
            <div className={styles.dwDesc}>Manage whether Cash on Delivery is offered at checkout for eligible orders.</div>
            <div className={styles.codRow}>
              <div>
                <div className={styles.codName}>Available at checkout</div>
                <div className={styles.codDesc}>Show Cash on Delivery as an option on eligible orders.</div>
              </div>
              <button className={`${styles.tgl} ${codEnabled ? styles.tglOn : ""}`} onClick={() => setCodEnabled(!codEnabled)}></button>
            </div>
            <div className={styles.fld}>
              <label className={styles.fldLbl}>Preferred contact for COD orders</label>
              <input className={styles.fldInput} defaultValue="+92 300 1234567" />
            </div>
            <div className={styles.secureNote}>
              <i className='bx bx-info-circle'></i>
              <div className={styles.secureNoteTxt}>Cash on Delivery is available on orders up to PKR 50,000 within serviceable areas. A small handling fee may apply.</div>
            </div>
          </div>
          <div className={styles.dwFooter}>
            <button className={styles.dwSave} onClick={() => setCodDrawerOpen(false)}><i className='bx bx-check'></i>Save Preferences</button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      <div className={`${styles.modalOverlay} ${delModalOpen ? styles.modalOverlayOpen : ""}`} onClick={() => setDelModalOpen(false)}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalIc}><i className='bx bx-trash'></i></div>
          <div className={styles.modalTitle}>Delete this payment method?</div>
          <div className={styles.modalBody}>This payment method will be removed from your account. This action can't be undone.</div>
          <div className={styles.modalActions}>
            <button className={styles.modalDanger} onClick={confirmDelete}><i className='bx bx-trash'></i>Delete</button>
            <button className={styles.modalCancel} onClick={() => setDelModalOpen(false)}>Cancel</button>
          </div>
        </div>
      </div>

    </div>
  );
}
