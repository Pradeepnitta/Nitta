import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import './Membership.css';

function Membership() {
    const navigate = useNavigate();
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' or 'annual'
    const [activePlan, setActivePlan] = useState('free');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedPlanForConfirm, setSelectedPlanForConfirm] = useState(null);

    const plans = [
        {
            id: 'free',
            name: 'Basic Starter',
            description: 'Essential features to explore the dashboard capabilities.',
            price: { monthly: 0, annual: 0 },
            features: [
                '1 active user profile',
                '3 workspace projects logs',
                'Basic search filter history',
                'Community help board access'
            ],
            badge: null,
            ctaText: 'Current Plan',
            actionClass: 'secondary-btn'
        },
        {
            id: 'pro',
            name: 'Professional Console',
            description: 'Advanced metrics and custom integration paths for teams.',
            price: { monthly: 19, annual: 15 },
            features: [
                'Up to 10 team seats',
                'Unlimited dashboard workspaces',
                'Spotlight Search command shortcuts',
                'Priority support (2h SLA)',
                'API integration hooks',
                'Detailed analytics export'
            ],
            badge: 'Most Popular',
            ctaText: 'Upgrade to Pro',
            actionClass: 'primary-btn highlight'
        },
        {
            id: 'premium',
            name: 'Enterprise Sync',
            description: 'Dedicated resources, high-grade security, and custom SLA.',
            price: { monthly: 49, annual: 39 },
            features: [
                'Unlimited active user seats',
                'Dedicated account coordinator',
                '99.9% API uptime guarantee',
                'Custom SSO / SAML integration',
                'Unlimited logs backup history',
                'Quarterly audits review'
            ],
            badge: 'Scale Team',
            ctaText: 'Contact Sales',
            actionClass: 'secondary-btn'
        }
    ];

    const handlePlanSelect = (plan) => {
        if (plan.id === 'free') {
            setActivePlan('free');
            return;
        }
        setSelectedPlanForConfirm(plan);
        setShowConfirmModal(true);
    };

    return (
        <DashboardLayout title="Membership Plans">
            <section className="membership-section">
                <header className="membership-header">
                    <p className="eyebrow">Select your tier</p>
                    <h1 className="membership-title">Unlock Full Console Capabilities</h1>
                    <p className="membership-subtitle">
                        Choose a plan that scales with your team. Save up to 20% by subscribing to our annual cycle.
                    </p>

                    {/* Translucent Billing Cycle Toggle Switch */}
                    <div className="billing-toggle-container">
                        <button
                            className={`toggle-option ${billingCycle === 'monthly' ? 'active' : ''}`}
                            onClick={() => setBillingCycle('monthly')}
                        >
                            Monthly
                        </button>
                        <button
                            className={`toggle-option ${billingCycle === 'annual' ? 'active' : ''}`}
                            onClick={() => setBillingCycle('annual')}
                        >
                            Annual <span className="discount-tag">Save 20%</span>
                        </button>
                    </div>
                </header>

                {/* Pricing Grid */}
                <div className="pricing-grid">
                    {plans.map((plan) => {
                        const cost = billingCycle === 'monthly' ? plan.price.monthly : plan.price.annual;
                        const isCurrent = activePlan === plan.id;
                        const isPro = plan.id === 'pro';

                        return (
                            <div
                                key={plan.id}
                                className={`pricing-card ${isPro ? 'featured' : ''} ${isCurrent ? 'active-tier' : ''}`}
                            >
                                {plan.badge && <span className="card-badge">{plan.badge}</span>}

                                <div className="card-header">
                                    <h3 className="plan-name">{plan.name}</h3>
                                    <p className="plan-desc">{plan.description}</p>
                                    <div className="plan-price-block">
                                        <span className="price-currency">$</span>
                                        <span className="price-amount">{cost}</span>
                                        <span className="price-period">/ {billingCycle === 'monthly' ? 'mo' : 'mo (billed annually)'}</span>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <h4 className="features-title">Features included:</h4>
                                    <ul className="plan-features-list">
                                        {plan.features.map((feature, idx) => (
                                            <li key={idx} className="feature-item">
                                                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="checkmark-icon">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div className="card-footer">
                                    <button
                                        type="button"
                                        className={`plan-cta-button ${plan.actionClass} ${isCurrent ? 'current-active' : ''}`}
                                        onClick={() => handlePlanSelect(plan)}
                                        disabled={isCurrent}
                                    >
                                        {isCurrent ? 'Your Plan' : plan.ctaText}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="membership-faq">
                    <h3>Frequently Asked Questions</h3>
                    <div className="faq-grid">
                        <div>
                            <h4>Can I cancel my subscription anytime?</h4>
                            <p>Yes, subscriptions can be cancelled in settings. Your privileges will remain active until the end of the billing term.</p>
                        </div>
                        <div>
                            <h4>Is there a free trial for Pro options?</h4>
                            <p>Yes, all users register under the Basic Starter tier and can request a 14-day Pro trial without providing credit details.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Premium Confirmation Dialog Modal */}
            {showConfirmModal && selectedPlanForConfirm && (
                <div className="confirm-modal-backdrop">
                    <div className="confirm-modal-card">
                        <h3 className="confirm-modal-title">Confirm Subscription Upgrade</h3>
                        <p className="confirm-modal-subtitle">
                            You are upgrading to the <strong>{selectedPlanForConfirm.name}</strong> tier.
                        </p>
                        
                        <div className="confirm-details-box">
                            <div className="confirm-detail-row">
                                <span>Rate Plan:</span>
                                <strong>${billingCycle === 'monthly' ? selectedPlanForConfirm.price.monthly : selectedPlanForConfirm.price.annual}/month</strong>
                            </div>
                            <div className="confirm-detail-row">
                                <span>Billing Cycle:</span>
                                <strong>{billingCycle === 'monthly' ? 'Billed Monthly' : 'Billed Annually (20% Off)'}</strong>
                            </div>
                            <div className="confirm-detail-row total">
                                <span>Initial Charge:</span>
                                <strong>${billingCycle === 'monthly' ? selectedPlanForConfirm.price.monthly : selectedPlanForConfirm.price.annual * 12}</strong>
                            </div>
                        </div>

                        <div className="confirm-modal-actions">
                            <button
                                type="button"
                                className="confirm-modal-cancel-btn"
                                onClick={() => { setShowConfirmModal(false); setSelectedPlanForConfirm(null); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="confirm-modal-pay-btn"
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    navigate('/payments', {
                                        state: {
                                            plan: selectedPlanForConfirm,
                                            billingCycle: billingCycle
                                        }
                                    });
                                }}
                            >
                                Confirm & Pay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

export default Membership;
