const endpoints = {
  REGISTER: '/api/auth/register',
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  VERIFY_OTP: '/api/auth/verify-otp',
  RESEND_OTP: '/api/auth/resend-otp',

  // Communities
  COMMUNITIES: '/api/communities',
  JOIN_COMMUNITY: (communityId) => `/api/communities/${communityId}/join`,

  // Channels
  COMMUNITY_CHANNELS: (communityId) => `/api/channels/communities/${communityId}/channels`,
  CHANNEL_BY_ID: (channelId) => `/api/channels/${channelId}`,
};

export default endpoints;