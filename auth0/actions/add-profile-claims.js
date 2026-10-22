// Auth0 Post-Login Action "Add profile claims". Deployed to the tenant; this
// file is the source of truth. Copies the profile the API saved in app_metadata
// at onboarding into the access token. The namespace must match
// CLAIMS_NAMESPACE in src/auth/jose-token-verifier.ts.
const NAMESPACE = 'https://property-maintenance-api/';
const PROFILE_KEYS = ['userId', 'role', 'administrationId', 'administrationRole'];

exports.onExecutePostLogin = async (event, api) => {
  // The User's email (and later, invitations) come from this claim, so only a
  // verified one is passed on.
  if (event.user.email && event.user.email_verified) {
    api.accessToken.setCustomClaim(`${NAMESPACE}email`, event.user.email);
  }
  const metadata = event.user.app_metadata ?? {};
  for (const key of PROFILE_KEYS) {
    if (metadata[key] !== undefined) {
      api.accessToken.setCustomClaim(NAMESPACE + key, metadata[key]);
    }
  }
};
