# Example "Sellable" Specification File Structure

```text
spec/
├── domains/
│   ├── commerce/
│   │   ├── index.md
│   │   ├── adr/
│   │   │   ├── 2026-01-12-commerce-boundaries.md
│   │   │   └── 2026-01-28-build-vs-buy-payments.md
│   │   └── services/
│   │       ├── checkout-api/
│   │       │   ├── index.md
│   │       │   ├── adr/
│   │       │   │   └── 2026-02-02-checkout-session-strategy.md
│   │       │   └── features/
│   │       │       ├── draft/
│   │       │       │   └── guest-checkout-v2.md
│   │       │       ├── testing/
│   │       │       │   └── one-click-checkout.md
│   │       │       ├── actual/
│   │       │       │   ├── smart-cart-recovery.md
│   │       │       │   └── adr/
│   │       │       │       └── 2026-02-01-smart-cart-recovery-tradeoffs.md
│   │       │       └── deprecated/
│   │       │           └── legacy-checkout-flow.md
│   │       └── pricing-engine/
│   │           ├── index.md
│   │           ├── adr/
│   │           │   └── 2026-01-25-dynamic-pricing-safety-rails.md
│   │           └── features/
│   │               ├── draft/
│   │               │   └── b2b-contract-pricing.md
│   │               ├── testing/
│   │               │   └── promo-stack-limiter.md
│   │               └── actual/
│   │                   └── margin-protection-rules.md
│   └── growth/
│       ├── index.md
│       ├── adr/
│       │   └── 2026-01-19-growth-experimentation-model.md
│       └── services/
│           ├── identity-gateway/
│           │   ├── index.md
│           │   ├── adr/
│           │   │   └── 2026-01-18-session-token-rotation.md
│           │   └── features/
│           │       ├── draft/
│           │       │   └── passwordless-login.md
│           │       └── actual/
│           │           ├── risk-based-authentication.md
│           │           └── adr/
│           │               └── 2026-01-23-risk-score-threshold-policy.md
│           └── notification-hub/
│               ├── index.md
│               ├── adr/
│               │   └── 2026-01-21-multi-channel-delivery-policy.md
│               └── features/
│                   ├── testing/
│                   │   └── send-time-optimization.md
│                   └── actual/
│                       └── transactional-notification-sla.md
└── features/
    ├── draft/
    │   └── partner-marketplace-launch.md
    ├── testing/
    │   └── referral-program-v2.md
    ├── actual/
    │   ├── loyalty-tier-program.md
    │   └── adr/
    │       └── 2026-01-27-loyalty-points-expiration-policy.md
    └── deprecated/
        └── manual-campaign-workflow.md
```
