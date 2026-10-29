import api from '../axios/api';
import endpoints from '../axios/endpoints';

const communityService = {
  /**
   * Fetch all public communities from the backend.
   * Backend response format: { success: true, count: number, communities: Array }
   */
  getCommunities: async () => {
    const response = await api.get(endpoints.COMMUNITIES);
    return response.data;
  },

  /**
   * Create a new community.
   * @param {{ name: string, description?: string, category?: string, visibility?: 'public' | 'private' }} data
   * Backend response format: { success: true, message: string, community: Object }
   */
  createCommunity: async ({ name, description = '', category = 'General', visibility = 'public' }) => {
    const response = await api.post(endpoints.COMMUNITIES, {
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || 'General',
      visibility,
    });
    return response.data;
  },

  /**
   * Join an existing public community by ID.
   * @param {string} communityId - MongoDB ObjectId of the community
   * Backend response format: { success: true, message: string, community: Object }
   */
  joinCommunity: async (communityId) => {
    const response = await api.post(endpoints.JOIN_COMMUNITY(communityId));
    return response.data;
  },
};

export default communityService;
