// Feature flags for functionality scheduled for a later sprint.
//
// These three features are fully built and tested in this codebase, but are
// being held back from the Sprint 1 & 2 GitHub submission on purpose. Flip
// each flag to `true` when you're ready to include it (Sprint 3) — nothing
// else needs to change.
//
// IMPORTANT: booking status transitions and payment status tracking are used
// internally by the Rating & Review system (Feature 10) and the Refund
// Processing Flow (Feature 20), which ARE part of this submission. Turning
// these flags off only hides the front-end entry points listed below — it
// does not remove the underlying status/payment fields those two features
// rely on.
const featureFlags = {
  // Feature 1 — Service Provider Profile Setup (skills, experience, bio,
  // service area, profile photo upload/edit).
  providerProfileSetup: true,

  // Feature 5 — Real-Time Job Status Tracker (provider's manual status
  // buttons, customer's live step-by-step progress view).
  statusTracker: true,

  // Feature 11 — Payment Integration (SSLCommerz "Pay Now" flow, payment
  // history view).
  payment: true,
};

export default featureFlags;
