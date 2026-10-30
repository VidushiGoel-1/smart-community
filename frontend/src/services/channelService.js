import api from '../axios/api';
import endpoints from '../axios/endpoints';

const channelService = {
  /**
   * Fetch all channels for a given community.
   * Requires user to be a member or owner of the community.
   * Backend response format: { success: true, count: number, channels: Array }
   * @param {string} communityId
   */
  getChannels: async (communityId) => {
    const response = await api.get(endpoints.COMMUNITY_CHANNELS(communityId));
    return response.data;
  },

  /**
   * Create a new channel inside a community.
   * Only the community owner can perform this action.
   * Backend response format: { success: true, message: string, channel: Object }
   * @param {string} communityId
   * @param {{ name: string, description?: string, type?: 'text' | 'announcement' }} data
   */
  createChannel: async (communityId, { name, description = '', type = 'text' }) => {
    const response = await api.post(endpoints.COMMUNITY_CHANNELS(communityId), {
      name: name.trim(),
      description: description.trim(),
      type: ['text', 'announcement'].includes(type) ? type : 'text',
    });
    return response.data;
  },

  /**
   * Get single channel details by channel ID.
   * @param {string} channelId
   */
  getChannelById: async (channelId) => {
    const response = await api.get(endpoints.CHANNEL_BY_ID(channelId));
    return response.data;
  },

  /**
   * Update channel details.
   * Only the community owner can perform this action.
   * Backend response format: { success: true, message: string, channel: Object }
   * @param {string} channelId
   * @param {{ name?: string, description?: string, type?: 'text' | 'announcement' }} updates
   */
  updateChannel: async (channelId, updates) => {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.type !== undefined) payload.type = updates.type;

    const response = await api.patch(endpoints.CHANNEL_BY_ID(channelId), payload);
    return response.data;
  },

  /**
   * Delete a channel.
   * Only the community owner can perform this action.
   * Backend response format: { success: true, message: string }
   * @param {string} channelId
   */
  deleteChannel: async (channelId) => {
    const response = await api.delete(endpoints.CHANNEL_BY_ID(channelId));
    return response.data;
  },
};

export default channelService;
