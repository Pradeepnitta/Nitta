import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/apiClient';
import './Payments.css';

const BANK_NAMES = [
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India (SBI)',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'Punjab National Bank (PNB)'
];

function Payments() {
    const location = useLocation();
    const { user } = useAuth();
    const checkoutPlan = location.state?.plan;
    const checkoutCycle = location.state?.billingCycle;

    const [activeMethod, setActiveMethod] = useState('razorpay');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [showMockModal, setShowMockModal] = useState(false);
    const [mockOrderDetails, setMockOrderDetails] = useState(null);

    // Card inputs state
    const [cardNo, setCardNo] = useState('');
    const [cardName, setCardName] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvv, setCardCvv] = useState('');

    // UPI inputs state
    const [upiId, setUpiId] = useState('');
    const [selectedUpiApp, setSelectedUpiApp] = useState('');

    // Net Banking inputs state
    const [selectedBank, setSelectedBank] = useState('');
    const [bankUser, setBankUser] = useState('');
    const [bankPass, setBankPass] = useState('');

    // Wallet inputs state
    const [walletType, setWalletType] = useState('paypal');

    // Dynamic Razorpay Script Loading
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Helper to generate mock transaction details
    const generateRandomId = (prefix) => `${prefix}_${Math.random().toString(36).substring(2, 11)}`;

    const handleMockPaymentSuccess = async () => {
        setShowMockModal(false);
        setSubmitting(true);
        setErrorMsg('');

        try {
            const verifyRes = await apiClient.post('/auth/payments/verify', {
                razorpay_order_id: mockOrderDetails.order_id,
                razorpay_payment_id: generateRandomId('pay_mock'),
                razorpay_signature: generateRandomId('sig_mock'),
                planId: mockOrderDetails.planId,
                isMock: true
            });

            if (verifyRes.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                }, 5000);
            } else {
                setErrorMsg(verifyRes.data.message || "Mock payment verification failed");
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || "Failed to verify mock transaction");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRazorpayPay = async () => {
        if (!checkoutPlan) {
            setErrorMsg("No active checkout session or plan selected.");
            return;
        }
        setSubmitting(true);
        setErrorMsg('');

        try {
            const amount = checkoutCycle === 'monthly'
                ? checkoutPlan.price.monthly
                : checkoutPlan.price.annual * 12;

            const orderRes = await apiClient.post('/auth/payments/order', {
                amount,
                planId: checkoutPlan.id
            });

            const { id: order_id, amount: order_amount, currency, key, isMock } = orderRes.data;

            if (isMock) {
                setMockOrderDetails({
                    order_id,
                    amount: order_amount,
                    currency,
                    key,
                    planId: checkoutPlan.id
                });
                setShowMockModal(true);
                setSubmitting(false);
                return;
            }

            const options = {
                key: key,
                amount: order_amount,
                currency: currency,
                name: "Console Pro Upgrade",
                description: `Subscription for ${checkoutPlan.name}`,
                order_id: order_id,
                handler: async function (response) {
                    setSubmitting(true);
                    try {
                        const verifyRes = await apiClient.post('/auth/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: checkoutPlan.id,
                            isMock: false
                        });

                        if (verifyRes.data.success) {
                            setSuccess(true);
                            setTimeout(() => {
                                setSuccess(false);
                            }, 5000);
                        } else {
                            setErrorMsg(verifyRes.data.message || "Payment verification failed");
                        }
                    } catch (error) {
                        setErrorMsg(error.response?.data?.message || "Failed to verify payment transaction");
                    } finally {
                        setSubmitting(false);
                    }
                },
                prefill: {
                    name: user?.name || "",
                    email: user?.email || "",
                },
                theme: {
                    color: "#fbbf24"
                },
                modal: {
                    ondismiss: function () {
                        setSubmitting(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                setErrorMsg(response.error.description || "Razorpay transaction failed");
                setSubmitting(false);
            });
            rzp.open();

        } catch (error) {
            setErrorMsg(error.response?.data?.message || "Failed to contact Razorpay billing server");
            setSubmitting(false);
        }
    };

    // Handle payments submit action
    const handlePayNow = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (activeMethod === 'razorpay') {
            handleRazorpayPay();
            return;
        }

        setSubmitting(true);

        setTimeout(() => {
            setSubmitting(false);
            setSuccess(true);

            // Reset states
            setTimeout(() => {
                setSuccess(false);
                setCardNo('');
                setCardName('');
                setCardExpiry('');
                setCardCvv('');
                setUpiId('');
                setSelectedUpiApp('');
                setSelectedBank('');
                setBankUser('');
                setBankPass('');
            }, 3000);
        }, 2000);
    };

    // Format card input on changes
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 16) value = value.slice(0, 16);
        const matches = value.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            setCardNo(parts.join(' '));
        } else {
            setCardNo(value);
        }
    };

    const handleExpiryChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length > 2) {
            setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
        } else {
            setCardExpiry(value);
        }
    };

    return (
        <DashboardLayout title="Payment Gateway">
            <div className="payments-view-container">
                {checkoutPlan && !success && (
                    <div className="checkout-summary-box">
                        <div className="summary-left">
                            <span className="summary-eyebrow">Order Summary</span>
                            <h2 className="summary-plan-title">{checkoutPlan.name} Upgrade</h2>
                            <p className="summary-cycle-desc">
                                Active Billing Term: <strong>{checkoutCycle === 'monthly' ? 'Monthly Cycle' : 'Annual Cycle (20% Discount Applied)'}</strong>
                            </p>
                        </div>
                        <div className="summary-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <div className="summary-price-block">
                                <span className="sum-currency">$</span>
                                <span className="sum-amount">
                                    {checkoutCycle === 'monthly' ? checkoutPlan.price.monthly : checkoutPlan.price.annual}
                                </span>
                                <span className="sum-period">/ mo</span>
                            </div>
                            <span className="sum-total" style={{ display: 'block', marginBottom: '6px' }}>
                                Total Due: ${checkoutCycle === 'monthly' ? checkoutPlan.price.monthly : checkoutPlan.price.annual * 12}
                            </span>
                            <span className="test-price-tag" style={{ fontSize: '0.78rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.25)', padding: '2px 8px', borderRadius: '8px', fontWeight: '600' }}>
                                Test Mode: Overridden to ₹1.00
                            </span>
                        </div>
                    </div>
                )}

                {success ? (
                    <div className="payment-success-card">
                        <div className="success-icon-wrapper">
                            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="success-checkmark">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <h2>Payment Successful</h2>
                        <p>Thank you! Your transaction was processed and completed safely.</p>
                        <span>Console permissions and memberships updated immediately.</span>
                    </div>
                ) : (
                    <div className="payment-layout-card">
                        {/* Selector Tabs left column */}
                        <div className="payment-selectors-sidebar">
                            <h3 className="selectors-title">Payment Options</h3>
                            <button
                                type="button"
                                className={`selector-btn ${activeMethod === 'razorpay' ? 'active' : ''}`}
                                onClick={() => { setActiveMethod('razorpay'); setErrorMsg(''); }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="selector-icon">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                                <span>Razorpay Checkout</span>
                            </button>

                            <button
                                type="button"
                                className={`selector-btn ${activeMethod === 'card' ? 'active' : ''}`}
                                onClick={() => { setActiveMethod('card'); setErrorMsg(''); }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="selector-icon">
                                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                                <span>Debit / Credit Card</span>
                            </button>

                            <button
                                type="button"
                                className={`selector-btn ${activeMethod === 'upi' ? 'active' : ''}`}
                                onClick={() => { setActiveMethod('upi'); setErrorMsg(''); }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="selector-icon">
                                    <rect x="3" y="11" width="18" height="10" rx="2" />
                                    <path d="M12 2v9M8 5l4-3 4 3" />
                                </svg>
                                <span>UPI Checkout</span>
                            </button>

                            <button
                                type="button"
                                className={`selector-btn ${activeMethod === 'banking' ? 'active' : ''}`}
                                onClick={() => { setActiveMethod('banking'); setErrorMsg(''); }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="selector-icon">
                                    <path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2L2 7h20L12 2z" />
                                </svg>
                                <span>Net Banking</span>
                            </button>

                            <button
                                type="button"
                                className={`selector-btn ${activeMethod === 'wallet' ? 'active' : ''}`}
                                onClick={() => { setActiveMethod('wallet'); setErrorMsg(''); }}
                            >
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="selector-icon">
                                    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h14v4" />
                                    <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
                                    <circle cx="14" cy="12" r="2" />
                                </svg>
                                <span>Digital Wallets</span>
                            </button>
                        </div>

                        {/* Interactive Form fields right column */}
                        <form className="payment-fields-content" onSubmit={handlePayNow}>
                            {errorMsg && (
                                <div className="payment-error-banner">
                                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="error-banner-icon">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Method 5: Razorpay Checkout */}
                            {activeMethod === 'razorpay' && (
                                <div className="razorpay-fields-section">
                                    <div className="razorpay-intro-card">
                                        <div className="razorpay-badge">Secure Integration</div>
                                        <h4 className="razorpay-card-title">Pay via Razorpay</h4>
                                        <p className="razorpay-card-desc">
                                            Initiate payment using India's leading payment solution supporting UPI, Cards, Net Banking, and Wallets.
                                        </p>
                                        <div className="razorpay-info-list">
                                            <div className="info-item">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="info-check-icon">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>Instant Sandbox or Production processing</span>
                                            </div>
                                            <div className="info-item">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="info-check-icon">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>Cryptographic verification & automatic account status activation</span>
                                            </div>
                                            <div className="info-item">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="info-check-icon">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>256-bit SSL encrypted transit</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Method 1: Credit/Debit Card */}
                            {activeMethod === 'card' && (
                                <div className="card-fields-section">
                                    {/* Real-time Visual Card Preview mockup */}
                                    <div className="card-visual-preview">
                                        <div className="preview-chip" />
                                        <div className="preview-number">{cardNo || '•••• •••• •••• ••••'}</div>
                                        <div className="preview-bottom-row">
                                            <div className="preview-holder-block">
                                                <span>CARDHOLDER NAME</span>
                                                <div className="preview-holder-value">{cardName.toUpperCase() || 'YOUR NAME'}</div>
                                            </div>
                                            <div className="preview-expiry-block">
                                                <span>EXPIRES</span>
                                                <div className="preview-expiry-value">{cardExpiry || 'MM/YY'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="fields-grid">
                                        <label className="field-label-block full-width">
                                            Cardholder Name
                                            <input
                                                type="text"
                                                placeholder="John Doe"
                                                value={cardName}
                                                onChange={(e) => setCardName(e.target.value)}
                                                required
                                                className="payment-input"
                                            />
                                        </label>

                                        <label className="field-label-block full-width">
                                            Card Number
                                            <input
                                                type="text"
                                                placeholder="4000 1234 5678 9010"
                                                value={cardNo}
                                                onChange={handleCardNumberChange}
                                                required
                                                className="payment-input"
                                            />
                                        </label>

                                        <label className="field-label-block">
                                            Expiration Date
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={cardExpiry}
                                                onChange={handleExpiryChange}
                                                required
                                                className="payment-input"
                                            />
                                        </label>

                                        <label className="field-label-block">
                                            CVV Code
                                            <input
                                                type="password"
                                                placeholder="•••"
                                                maxLength="3"
                                                value={cardCvv}
                                                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                                required
                                                className="payment-input"
                                            />
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Method 2: UPI */}
                            {activeMethod === 'upi' && (
                                <div className="upi-fields-section">
                                    <div className="upi-apps-icons-grid">
                                        {/* GPay */}
                                        <button
                                            type="button"
                                            className={`upi-app-btn ${selectedUpiApp === 'gpay' ? 'active' : ''}`}
                                            onClick={() => { setSelectedUpiApp('gpay'); setUpiId('username@okaxis'); }}
                                        >
                                            <div className="mock-app-logo gpay">GPay</div>
                                            <span>Google Pay</span>
                                        </button>

                                        {/* PhonePe */}
                                        <button
                                            type="button"
                                            className={`upi-app-btn ${selectedUpiApp === 'phonepe' ? 'active' : ''}`}
                                            onClick={() => { setSelectedUpiApp('phonepe'); setUpiId('username@ybl'); }}
                                        >
                                            <div className="mock-app-logo phonepe">PhonePe</div>
                                            <span>PhonePe</span>
                                        </button>

                                        {/* Paytm */}
                                        <button
                                            type="button"
                                            className={`upi-app-btn ${selectedUpiApp === 'paytm' ? 'active' : ''}`}
                                            onClick={() => { setSelectedUpiApp('paytm'); setUpiId('username@paytm'); }}
                                        >
                                            <div className="mock-app-logo paytm">Paytm</div>
                                            <span>Paytm</span>
                                        </button>

                                        {/* BHIM */}
                                        <button
                                            type="button"
                                            className={`upi-app-btn ${selectedUpiApp === 'bhim' ? 'active' : ''}`}
                                            onClick={() => { setSelectedUpiApp('bhim'); setUpiId('username@upi'); }}
                                        >
                                            <div className="mock-app-logo bhim">BHIM</div>
                                            <span>BHIM App</span>
                                        </button>

                                        {/* PayPal */}
                                        <button
                                            type="button"
                                            className={`upi-app-btn ${selectedUpiApp === 'paypal' ? 'active' : ''}`}
                                            onClick={() => { setSelectedUpiApp('paypal'); setUpiId('username@paypal'); }}
                                        >
                                            <div className="mock-app-logo paypal">PayPal</div>
                                            <span>PayPal</span>
                                        </button>
                                    </div>

                                    <label className="field-label-block full-width">
                                        UPI ID / Virtual Payment Address (VPA)
                                        <input
                                            type="text"
                                            placeholder="username@bankhandle"
                                            value={upiId}
                                            onChange={(e) => setUpiId(e.target.value)}
                                            required
                                            className="payment-input"
                                        />
                                    </label>
                                </div>
                            )}

                            {/* Method 3: Net Banking */}
                            {activeMethod === 'banking' && (
                                <div className="banking-fields-section">
                                    <label className="field-label-block full-width">
                                        Select Your Bank
                                        <select
                                            value={selectedBank}
                                            onChange={(e) => setSelectedBank(e.target.value)}
                                            required
                                            className="payment-select"
                                        >
                                            <option value="">-- Choose a Bank --</option>
                                            {BANK_NAMES.map((name) => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </label>

                                    {/* Credentials input slides in only after bank is selected */}
                                    {selectedBank && (
                                        <div className="banking-credentials-fields">
                                            <h4 className="credentials-title">Secure Login to {selectedBank}</h4>
                                            
                                            <label className="field-label-block full-width">
                                                Net Banking Username
                                                <input
                                                    type="text"
                                                    placeholder="Enter user id"
                                                    value={bankUser}
                                                    onChange={(e) => setBankUser(e.target.value)}
                                                    required
                                                    className="payment-input"
                                                />
                                            </label>

                                            <label className="field-label-block full-width">
                                                Net Banking Password
                                                <input
                                                    type="password"
                                                    placeholder="Enter account password"
                                                    value={bankPass}
                                                    onChange={(e) => setBankPass(e.target.value)}
                                                    required
                                                    className="payment-input"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Method 4: Digital Wallets */}
                            {activeMethod === 'wallet' && (
                                <div className="wallet-fields-section">
                                    <p className="wallet-info-note">
                                        You will be redirected to the secure portal of your selected wallet to complete authentication and authorize this payment.
                                    </p>

                                    <div className="wallet-grid-options">
                                        <label className="wallet-radio-card">
                                            <input
                                                type="radio"
                                                name="walletType"
                                                value="paypal"
                                                checked={walletType === 'paypal'}
                                                onChange={() => setWalletType('paypal')}
                                            />
                                            <span className="wallet-label">
                                                <strong>PayPal</strong> (Fast Checkout)
                                            </span>
                                        </label>

                                        <label className="wallet-radio-card">
                                            <input
                                                type="radio"
                                                name="walletType"
                                                value="applepay"
                                                checked={walletType === 'applepay'}
                                                onChange={() => setWalletType('applepay')}
                                            />
                                            <span className="wallet-label">
                                                <strong>Apple Pay</strong> (Instant Device Pay)
                                            </span>
                                        </label>

                                        <label className="wallet-radio-card">
                                            <input
                                                type="radio"
                                                name="walletType"
                                                value="gpay_wallet"
                                                checked={walletType === 'gpay_wallet'}
                                                onChange={() => setWalletType('gpay_wallet')}
                                            />
                                            <span className="wallet-label">
                                                <strong>Google Pay Wallet</strong> (Saved Cards)
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Payment checkout CTAs */}
                            <div className="payment-checkout-footer">
                                <button
                                    type="submit"
                                    className="primary-button checkout-pay-btn"
                                    disabled={submitting || (activeMethod === 'banking' && !selectedBank)}
                                >
                                    {submitting ? (
                                        <div className="checkout-spinner">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </div>
                                    ) : (
                                        'Process Secure Payment'
                                    )}
                                </button>
                                <span className="ssl-lock-hint">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    256-bit SSL encrypted checkout
                                </span>
                            </div>
                        </form>
                    </div>
                )}
            </div>

            {/* Razorpay Sandbox Simulation Modal */}
            {showMockModal && mockOrderDetails && (
                <div className="mock-razorpay-backdrop">
                    <div className="mock-razorpay-modal">
                        <div className="mock-modal-header">
                            <div className="mock-modal-logo">
                                <span className="logo-r">R</span>
                                <span className="logo-text">razorpay</span>
                            </div>
                            <span className="mock-modal-badge">Sandbox Mode</span>
                        </div>
                        <div className="mock-modal-body">
                            <div className="mock-payment-amount-row">
                                <div className="amount-label">Amount due:</div>
                                <div className="amount-value">
                                    ₹{(mockOrderDetails.amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="mock-payment-info-box">
                                <div className="info-row">
                                    <span>Order ID:</span>
                                    <code className="font-mono-small">{mockOrderDetails.order_id}</code>
                                </div>
                                <div className="info-row">
                                    <span>Plan ID:</span>
                                    <strong>{mockOrderDetails.planId}</strong>
                                </div>
                                <div className="info-row">
                                    <span>Customer:</span>
                                    <span>{user?.name || 'Valued User'} ({user?.email})</span>
                                </div>
                            </div>
                            <p className="mock-modal-explainer">
                                No real Razorpay API keys were detected in the backend <code>.env</code> file. The application is running in mock verification sandbox. Click below to simulate client/server responses.
                            </p>
                        </div>
                        <div className="mock-modal-footer">
                            <button
                                type="button"
                                className="mock-fail-btn"
                                onClick={() => {
                                    setShowMockModal(false);
                                    setErrorMsg("Mock payment cancelled/failed by user");
                                }}
                            >
                                Simulate Failure
                            </button>
                            <button
                                type="button"
                                className="mock-success-btn"
                                onClick={handleMockPaymentSuccess}
                            >
                                Simulate Success
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Payments;
