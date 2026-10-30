import { useState, useMemo, useEffect, useCallback } from 'react';
import './Dashboard.css';
import topLogo from '../assets/yappy-logo.png';
import authService from '../services/authService';
import communityService from '../services/communityService';
import channelService from '../services/channelService';
import {
  initialCurrentUser,
  initialCommunities,
  initialDiscoverCommunities,
  initialChannelMessages,
  initialDirectMessages,
  initialModerationItems,
  initialAuditLogs,
  initialNotifications
} from '../services/mockData';

let idCounter = 1000;
const generateId = (prefix = 'id') => `${prefix}_${++idCounter}_${Math.random().toString(36).slice(2, 7)}`;

const SERVER_TEMPLATES = [
  {
    key: 'Gaming',
    icon: '🎮',
    title: 'Gaming',
    desc: 'For clips, gameplay, gaming sessions, and hanging out with your squad',
    category: 'Gaming',
    defaultAvatar: '🎮'
  },
  {
    key: 'Friends',
    icon: '👥',
    title: 'Friends',
    desc: 'For close friend groups, inside jokes, and daily casual chatter',
    category: 'General',
    defaultAvatar: '👥'
  },
  {
    key: 'Study Group',
    icon: '📚',
    title: 'Study Group',
    desc: 'For homework help, study sessions, and notes sharing',
    category: 'Education',
    defaultAvatar: '📚'
  },
  {
    key: 'School Club',
    icon: '🏫',
    title: 'School Club',
    desc: 'For student clubs, campus organizations, and events',
    category: 'Education',
    defaultAvatar: '🏫'
  }
];

const AVATAR_PRESETS = [
  { emoji: '🎮', label: 'Gaming', bg: '#EDE9FE', border: '#C4B5FD' },
  { emoji: '💻', label: 'Tech', bg: '#E0E7FF', border: '#A5B4FC' },
  { emoji: '👥', label: 'Friends', bg: '#D1FAE5', border: '#6EE7B7' },
  { emoji: '📚', label: 'Study', bg: '#FEF3C7', border: '#FCD34D' },
  { emoji: '🏫', label: 'School', bg: '#FEE2E2', border: '#FCA5A5' },
  { emoji: '🎨', label: 'Art', bg: '#FCE7F3', border: '#F9A8D4' },
  { emoji: '🚀', label: 'Launch', bg: '#E2E8F0', border: '#CBD5E1' },
  { emoji: '💬', label: 'Chat', bg: '#EDE9FE', border: '#C4B5FD' },
  { emoji: '✨', label: 'Magic', bg: '#FEF3C7', border: '#FCD34D' },
  { emoji: '🎵', label: 'Music', bg: '#FEE2E2', border: '#FCA5A5' },
  { emoji: '🛡️', label: 'Security', bg: '#D1FAE5', border: '#6EE7B7' },
  { emoji: '☕', label: 'Lounge', bg: '#FFEDD5', border: '#FDBA74' },
];

// Helper: Map backend community response to dashboard structure
const mapBackendCommunity = (comm, currentUserId) => {
  const isOwner = Boolean(currentUserId && String(comm.owner) === String(currentUserId));
  const isMember = Boolean(comm.isMember || isOwner);

  const category = comm.category || 'General';
  let icon = '👥';
  let iconBg = '#F0E7FF';
  let iconColor = '#8A2BE2';

  if (category === 'Development') {
    icon = '</>';
    iconBg = '#F0E7FF';
    iconColor = '#8A2BE2';
  } else if (category === 'Design') {
    icon = '🎨';
    iconBg = '#FAF8F3';
    iconColor = '#FF8FA3';
  } else if (category === 'AI/ML') {
    icon = '🧠';
    iconBg = '#FAF8F3';
    iconColor = '#FF8FA3';
  } else if (category === 'Gaming') {
    icon = '🎮';
    iconBg = '#EDE9FE';
    iconColor = '#8B5CF6';
  } else if (category === 'Education') {
    icon = '📚';
    iconBg = '#FEF3C7';
    iconColor = '#D97706';
  } else if (category === 'Tech') {
    icon = '💻';
    iconBg = '#E0E7FF';
    iconColor = '#4F46E5';
  }

  return {
    id: comm._id,
    _id: comm._id,
    name: comm.name,
    slug: comm.name.toLowerCase().replace(/\s+/g, '-'),
    icon: comm.icon || icon,
    iconBg: comm.iconBg || iconBg,
    iconColor: comm.iconColor || iconColor,
    category,
    description: comm.description || '',
    membersCount: comm.memberCount || 1,
    userRole: isOwner ? 'Owner' : (isMember ? 'Member' : 'Viewer'),
    isJoined: isMember,
    owner: comm.owner,
    channels: comm.channels || [],
    members: comm.members || [
      ...(isOwner ? [{ id: currentUserId, role: 'Owner', name: 'Owner', status: 'Online' }] : [])
    ],
    createdAt: comm.createdAt,
  };
};

// Helper: Map backend channel response to dashboard structure
const mapBackendChannel = (ch) => {
  return {
    id: ch._id,
    _id: ch._id,
    name: ch.name,
    topic: ch.description || 'Welcome to the channel!',
    description: ch.description || '',
    type: ch.type || 'text',
    isAnnouncement: ch.type === 'announcement',
    isPrivate: false,
    community: ch.community,
    createdBy: ch.createdBy,
    createdAt: ch.createdAt,
  };
};

const Dashboard = ({ onFormSwitch }) => {
  // Navigation & View State
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const tabParam = new URLSearchParams(window.location.search).get('tab');
      if (tabParam) return tabParam;
    }
    return 'dashboard';
  });
  // Navigation Menu State (Desktop Collapsible Sidebar + Mobile/Tablet Drawer)
  const [isNavOpen, setIsNavOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 1024;
    }
    return true;
  });

  // Keep navigation state responsive to screen size changes
  useEffect(() => {
    let prevIsDesktop = typeof window !== 'undefined' ? window.innerWidth > 1024 : true;
    const handleResize = () => {
      const isDesktop = window.innerWidth > 1024;
      if (isDesktop !== prevIsDesktop) {
        setIsNavOpen(isDesktop);
        prevIsDesktop = isDesktop;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleNav = () => {
    setIsNavOpen(prev => !prev);
  };

  const handleCloseNav = () => {
    setIsNavOpen(false);
  };

  const handleNavClick = (tabName) => {
    setActiveTab(tabName);
    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setIsNavOpen(false);
    }
  };

  // App Data State (Synced with local auth if user previously logged in)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = authService.getUser();
    const tokenUid = authService.getCurrentUserId();
    if (saved && (saved.name || saved.email)) {
      const email = saved.email || initialCurrentUser.email;
      const name = saved.name || email.split('@')[0];
      const initials = name.slice(0, 2).toUpperCase();
      return {
        ...initialCurrentUser,
        id: tokenUid || saved.id || 'usr_101',
        name,
        email,
        username: email.split('@')[0],
        avatarText: initials,
      };
    }
    return {
      ...initialCurrentUser,
      id: tokenUid || initialCurrentUser.id,
    };
  });
  const [communities, setCommunities] = useState(initialCommunities);
  const [discoverList, setDiscoverList] = useState(initialDiscoverCommunities);
  const [channelMessages, setChannelMessages] = useState(initialChannelMessages);
  const [directMessages, setDirectMessages] = useState(initialDirectMessages);
  const [moderationItems, setModerationItems] = useState(initialModerationItems);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [notifications, setNotifications] = useState(initialNotifications);

  // Communities Backend Integration State
  const [communitiesLoading, setCommunitiesLoading] = useState(false);
  const [communitiesError, setCommunitiesError] = useState(null);
  const [isCreatingCommunity, setIsCreatingCommunity] = useState(false);
  const [createCommunityError, setCreateCommunityError] = useState(null);
  const [joiningCommunityId, setJoiningCommunityId] = useState(null);

  // Channels Backend Integration State
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError] = useState(null);
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [createChannelError, setCreateChannelError] = useState(null);
  const [isEditChannelModalOpen, setIsEditChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [editChannelForm, setEditChannelForm] = useState({ name: '', topic: '', type: 'text' });
  const [isUpdatingChannel, setIsUpdatingChannel] = useState(false);
  const [updateChannelError, setUpdateChannelError] = useState(null);
  const [isDeleteChannelModalOpen, setIsDeleteChannelModalOpen] = useState(false);
  const [deletingChannel, setDeletingChannel] = useState(null);
  const [isDeletingChannel, setIsDeletingChannel] = useState(false);
  const [deleteChannelError, setDeleteChannelError] = useState(null);

  // Active Contexts
  const [activeCommunity, setActiveCommunity] = useState(initialCommunities[0]);
  const [activeChannelId, setActiveChannelId] = useState(initialCommunities[0]?.channels[0]?.id || '');
  const [activeDmId, setActiveDmId] = useState(initialDirectMessages[0]?.id || '');
  const [showMembersPanel, setShowMembersPanel] = useState(true);

  // Fetch Communities from Backend
  const fetchCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    setCommunitiesError(null);
    try {
      const data = await communityService.getCommunities();
      if (data?.success && Array.isArray(data.communities)) {
        const currentUid = authService.getCurrentUserId() || currentUser.id;
        const mapped = data.communities.map((c) => mapBackendCommunity(c, currentUid));
        const joined = mapped.filter((c) => c.isJoined);

        setCommunities(joined);
        setDiscoverList(mapped);

        setActiveCommunity((prev) => {
          if (!prev || !prev._id) {
            return joined[0] || mapped[0] || null;
          }
          const exists = mapped.find((c) => c.id === prev.id || c._id === prev._id);
          return exists || prev;
        });
      }
    } catch (err) {
      console.warn('Failed to load communities from backend, retaining fallback state:', err);
      setCommunitiesError(
        err.friendlyMessage || err.response?.data?.message || 'Could not load communities from backend.'
      );
    } finally {
      setCommunitiesLoading(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(async () => {
      if (isCancelled) return;
      await fetchCommunities();
    });
    return () => {
      isCancelled = true;
    };
  }, [fetchCommunities]);

  // Fetch Channels for active community from Backend
  const fetchChannelsForCommunity = useCallback(async (communityId) => {
    if (!communityId) return;
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const data = await channelService.getChannels(communityId);
      if (data?.success && Array.isArray(data.channels)) {
        const mappedChannels = data.channels.map(mapBackendChannel);
        setActiveCommunity((prev) => (prev ? { ...prev, channels: mappedChannels } : prev));
        setCommunities((prev) =>
          prev.map((c) => (c.id === communityId || c._id === communityId ? { ...c, channels: mappedChannels } : c))
        );
        if (mappedChannels.length > 0) {
          setActiveChannelId((prevId) => {
            const exists = mappedChannels.some((ch) => ch.id === prevId);
            return exists ? prevId : mappedChannels[0].id;
          });
        } else {
          setActiveChannelId('');
        }
      }
    } catch (err) {
      console.warn('Failed to load channels for community:', err);
      setChannelsError(err.friendlyMessage || err.response?.data?.message || 'Failed to load channels');
    } finally {
      setChannelsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeCommunity) return;
    const commId = activeCommunity._id || activeCommunity.id;
    const isBackendComm = Boolean(activeCommunity._id || /^[0-9a-fA-F]{24}$/.test(commId));
    if (isBackendComm && activeCommunity.isJoined) {
      let isCancelled = false;
      Promise.resolve().then(async () => {
        if (isCancelled) return;
        await fetchChannelsForCommunity(commId);
      });
      return () => {
        isCancelled = true;
      };
    }
  }, [activeCommunity, fetchChannelsForCommunity]);

  // Direct Messages Workspace State (Simplified & PDF-Compliant)
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [dmMessageSearchQuery, setDmMessageSearchQuery] = useState('');
  const [dmReplyingTo, setDmReplyingTo] = useState(null);
  const [dmAttachedFile, setDmAttachedFile] = useState(null);
  const [editingDmMessageId, setEditingDmMessageId] = useState(null);
  const [editingDmContent, setEditingDmContent] = useState('');
  const [mobileDmView, setMobileDmView] = useState('chat'); // 'list' | 'chat' for mobile/tablet
  const [isNewDmModalOpen, setIsNewDmModalOpen] = useState(false);
  const [newDmType, setNewDmType] = useState('direct'); // 'direct' | 'group'
  const [newDmRecipient, setNewDmRecipient] = useState('');
  const [newDmGroupName, setNewDmGroupName] = useState('');
  const [newDmGroupMembers, setNewDmGroupMembers] = useState('');
  const [newDmError, setNewDmError] = useState('');

  // Moderator Hub Filter & Search State
  const [modFilterTab, setModFilterTab] = useState('all'); // 'all' | 'high' | 'medium' | 'spam' | 'harassment'
  const [modSearchQuery, setModSearchQuery] = useState('');

  // Chat Input & Interaction State
  const [chatInputText, setChatInputText] = useState('');
  const [dmInputText, setDmInputText] = useState('');
  const [replyingToMessage, setReplyingToMessage] = useState(null);
  const [attachedFile, setAttachedFile] = useState(null);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [showPinnedOnly, setShowPinnedOnly] = useState(false);

  // Global Header Search & Filter
  const [globalSearch, setGlobalSearch] = useState('');
  const [discoverCategory, setDiscoverCategory] = useState('All');

  // Modals & Feedback
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createServerStep, setCreateServerStep] = useState(1); // 1 = templates, 2 = customize
  const [selectedServerTemplate, setSelectedServerTemplate] = useState('General');
  const [selectedServerAvatar, setSelectedServerAvatar] = useState('🎮');

  const [isCreateChannelModalOpen, setIsCreateChannelModalOpen] = useState(false);
  const [newChannelForm, setNewChannelForm] = useState({
    name: '',
    topic: '',
    isPrivate: false
  });

  const [isGuidelinesModalOpen, setIsGuidelinesModalOpen] = useState(false);
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
  const [communityGuidelines, setCommunityGuidelines] = useState(
    '1. Be respectful and constructive with all members.\n' +
    '2. Keep messages relevant to the specific channel topic.\n' +
    '3. Zero tolerance for harassment, hate speech, or abusive behavior.\n' +
    '4. Do not spam, post unsolicited promotions, or share malicious links.\n' +
    '5. Respect community moderation policies and administrator guidance.'
  );

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [newCommunityForm, setNewCommunityForm] = useState({
    name: '',
    category: 'Development',
    description: '',
    isPrivate: false
  });
  const [toastMessage, setToastMessage] = useState('');

  // Member Management State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({
    name: '',
    username: '',
    role: 'Member',
    email: ''
  });
  const [addMemberError, setAddMemberError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3200);
  };

  // Helper: Open a community workspace
  const handleOpenCommunity = (community) => {
    setActiveCommunity(community);
    if (community.channels && community.channels.length > 0) {
      setActiveChannelId(community.channels[0].id);
    } else {
      setActiveChannelId('');
    }
    setActiveTab('community-view');
    setReplyingToMessage(null);
    setAttachedFile(null);
    const commId = community._id || community.id;
    if (community._id || /^[0-9a-fA-F]{24}$/.test(commId)) {
      fetchChannelsForCommunity(commId);
    }
  };

  // Helper: Join a discoverable community
  const handleJoinCommunity = async (communityToJoin) => {
    const commId = communityToJoin._id || communityToJoin.id;
    const isAlreadyJoined = communities.some(
      (c) => c.id === commId || c._id === commId || (c.isJoined && c.id === communityToJoin.id)
    );
    if (isAlreadyJoined) {
      triggerToast(`You are already a member of ${communityToJoin.name}!`);
      return;
    }

    const isBackend = communityToJoin._id || /^[0-9a-fA-F]{24}$/.test(commId);
    setJoiningCommunityId(commId);

    if (isBackend) {
      try {
        const res = await communityService.joinCommunity(commId);
        const updatedCount = res?.community?.memberCount || (communityToJoin.membersCount || 0) + 1;
        const currentUid = authService.getCurrentUserId() || currentUser.id;
        const updatedCommunity = {
          ...communityToJoin,
          userRole: 'Member',
          isJoined: true,
          membersCount: updatedCount,
          members: [
            ...(communityToJoin.members || []),
            { id: currentUid, name: currentUser.name, username: currentUser.username, role: 'Member', status: 'Online', avatarText: currentUser.avatarText }
          ]
        };
        setCommunities((prev) => [...prev.filter((c) => c.id !== commId && c._id !== commId), updatedCommunity]);
        setDiscoverList((prev) =>
          prev.map((c) =>
            c.id === commId || c._id === commId ? { ...c, isJoined: true, membersCount: updatedCount } : c
          )
        );
        triggerToast(`🎉 ${res?.message || `Joined "${communityToJoin.name}" successfully!`}`);
      } catch (err) {
        const msg = err.friendlyMessage || err.response?.data?.message || 'Failed to join community';
        triggerToast(`⚠️ ${msg}`);
      } finally {
        setJoiningCommunityId(null);
      }
    } else {
      // Mock fallback
      const updatedCommunity = {
        ...communityToJoin,
        userRole: 'Member',
        isJoined: true,
        membersCount: communityToJoin.membersCount + 1,
        channels: communityToJoin.channels || [
          { id: `ch_${communityToJoin.id}_gen`, name: 'general', isPrivate: false, topic: 'General discussions' }
        ],
        members: [
          ...(communityToJoin.members || []),
          { id: currentUser.id, name: currentUser.name, username: currentUser.username, role: 'Member', status: 'Online', avatarText: currentUser.avatarText }
        ]
      };

      setCommunities((prev) => [...prev, updatedCommunity]);
      setDiscoverList((prev) =>
        prev.map((c) => (c.id === communityToJoin.id ? { ...c, isJoined: true, membersCount: c.membersCount + 1 } : c))
      );
      triggerToast(`🎉 Joined "${communityToJoin.name}" successfully!`);
      setJoiningCommunityId(null);
    }
  };

  // Default channel preview helper for templates
  const getTemplateDefaultChannels = (templateName) => {
    if (templateName === 'Gaming') {
      return ['general', 'clips-and-highlights', 'lfg-party'];
    } else if (templateName === 'Study Group') {
      return ['general', 'notes-resources', 'homework-help'];
    } else if (templateName === 'School Club') {
      return ['announcements', 'event-planning', 'general'];
    } else if (templateName === 'Friends') {
      return ['general', 'announcements', 'lounge'];
    }
    return ['general', 'announcements', 'lounge'];
  };

  // Template selection matching Server.png
  const handleSelectTemplate = (templateName) => {
    setSelectedServerTemplate(templateName);
    const suggestedCategory =
      templateName === 'Gaming' ? 'Gaming' :
        templateName === 'Study Group' ? 'Education' :
          templateName === 'School Club' ? 'Education' : 'General';

    const defaultAvatar =
      templateName === 'Gaming' ? '🎮' :
        templateName === 'Study Group' ? '📚' :
          templateName === 'School Club' ? '🏫' :
            templateName === 'Friends' ? '👥' : '💻';

    setSelectedServerAvatar(defaultAvatar);

    setNewCommunityForm(prev => ({
      ...prev,
      name: `${currentUser.name}'s ${templateName === 'General' ? 'Server' : templateName + ' Server'}`,
      category: suggestedCategory
    }));
    setCreateServerStep(2);
  };

  // Helper: Create Community (Matching Server (1).png customization)
  const handleCreateCommunitySubmit = async (e) => {
    e.preventDefault();
    const rawName = newCommunityForm.name.trim();
    if (!rawName) return;

    if (rawName.length < 3 || rawName.length > 80) {
      setCreateCommunityError('Community name must be between 3 and 80 characters.');
      return;
    }

    setIsCreatingCommunity(true);
    setCreateCommunityError(null);

    try {
      const res = await communityService.createCommunity({
        name: rawName,
        description: newCommunityForm.description.trim() || `${selectedServerTemplate} community created on Yappy.`,
        category: newCommunityForm.category || 'General',
        visibility: 'public',
      });

      if (res?.success && res.community) {
        const currentUid = authService.getCurrentUserId() || currentUser.id;
        const mapped = mapBackendCommunity(res.community, currentUid);
        mapped.icon = selectedServerAvatar;

        // Automatically create initial default channel '#general' on backend
        try {
          const chanRes = await channelService.createChannel(res.community._id, {
            name: 'general',
            description: 'General discussions',
            type: 'text',
          });
          if (chanRes?.success && chanRes.channel) {
            mapped.channels = [mapBackendChannel(chanRes.channel)];
          }
        } catch (chanErr) {
          console.warn('Could not auto-create general channel:', chanErr);
        }

        setCommunities((prev) => [mapped, ...prev]);
        setDiscoverList((prev) => [mapped, ...prev]);
        setIsCreateModalOpen(false);
        setCreateServerStep(1);
        setNewCommunityForm({ name: '', category: 'Development', description: '', isPrivate: false });
        handleOpenCommunity(mapped);
        triggerToast(`🚀 Server "${mapped.name}" created!`);
      }
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || 'Failed to create community.';
      setCreateCommunityError(msg);
    } finally {
      setIsCreatingCommunity(false);
    }
  };

  // Helper: Create Text Channel in Community Workspace
  const handleCreateChannelSubmit = async (e) => {
    e.preventDefault();
    const rawName = newChannelForm.name.trim();
    if (!rawName) return;

    const cleanChannelName = rawName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (cleanChannelName.length < 2 || cleanChannelName.length > 80) {
      setCreateChannelError('Channel name must be between 2 and 80 characters.');
      return;
    }

    setIsCreatingChannel(true);
    setCreateChannelError(null);

    const commId = activeCommunity?._id || activeCommunity?.id;
    const isBackend = activeCommunity?._id || /^[0-9a-fA-F]{24}$/.test(commId);

    if (isBackend) {
      try {
        const res = await channelService.createChannel(commId, {
          name: cleanChannelName,
          description: newChannelForm.topic?.trim() || '',
          type: newChannelForm.isAnnouncement ? 'announcement' : 'text',
        });

        if (res?.success && res.channel) {
          const mappedChan = mapBackendChannel(res.channel);
          const updatedChannels = [...(activeCommunity?.channels || []), mappedChan];

          setActiveCommunity((prev) => ({
            ...prev,
            channels: updatedChannels,
          }));

          setCommunities((prev) =>
            prev.map((c) => {
              if (c.id === commId || c._id === commId) {
                return { ...c, channels: updatedChannels };
              }
              return c;
            })
          );

          setActiveChannelId(mappedChan.id);
          setIsCreateChannelModalOpen(false);
          setNewChannelForm({ name: '', topic: '', isPrivate: false, isAnnouncement: false });
          triggerToast(`🎉 Created #${mappedChan.name} channel!`);
        }
      } catch (err) {
        const msg = err.friendlyMessage || err.response?.data?.message || 'Failed to create channel.';
        setCreateChannelError(msg);
      } finally {
        setIsCreatingChannel(false);
      }
    } else {
      // Mock fallback
      const newChanId = generateId('ch');
      const newChannelObj = {
        id: newChanId,
        name: cleanChannelName,
        isPrivate: Boolean(newChannelForm.isPrivate),
        topic: newChannelForm.topic.trim() || 'Welcome to the new channel!',
      };

      const updatedChannels = [...(activeCommunity?.channels || []), newChannelObj];

      setActiveCommunity((prev) => ({
        ...prev,
        channels: updatedChannels,
      }));

      setCommunities((prev) =>
        prev.map((c) => {
          if (c.id === activeCommunity.id) {
            return { ...c, channels: updatedChannels };
          }
          return c;
        })
      );

      setActiveChannelId(newChanId);
      setIsCreateChannelModalOpen(false);
      setNewChannelForm({ name: '', topic: '', isPrivate: false, isAnnouncement: false });
      triggerToast(`Created #${cleanChannelName} channel!`);
      setIsCreatingChannel(false);
    }
  };

  // Helper: Open Edit Channel Modal
  const handleOpenEditChannel = (channel) => {
    setEditingChannel(channel);
    setEditChannelForm({
      name: channel.name,
      topic: channel.description || channel.topic || '',
      type: channel.type || (channel.isAnnouncement ? 'announcement' : 'text'),
    });
    setUpdateChannelError(null);
    setIsEditChannelModalOpen(true);
  };

  // Helper: Submit Update Channel
  const handleUpdateChannelSubmit = async (e) => {
    e.preventDefault();
    if (!editingChannel) return;
    const cleanName = editChannelForm.name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    if (cleanName.length < 2 || cleanName.length > 80) {
      setUpdateChannelError('Channel name must be between 2 and 80 characters.');
      return;
    }

    setIsUpdatingChannel(true);
    setUpdateChannelError(null);

    const channelId = editingChannel._id || editingChannel.id;
    const isBackend = editingChannel._id || /^[0-9a-fA-F]{24}$/.test(channelId);

    if (isBackend) {
      try {
        const res = await channelService.updateChannel(channelId, {
          name: cleanName,
          description: editChannelForm.topic.trim(),
          type: editChannelForm.type,
        });

        if (res?.success && res.channel) {
          const updated = mapBackendChannel(res.channel);
          const updatedChannels = (activeCommunity?.channels || []).map((ch) =>
            ch.id === channelId || ch._id === channelId ? updated : ch
          );

          setActiveCommunity((prev) => ({ ...prev, channels: updatedChannels }));
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === activeCommunity?.id || c._id === activeCommunity?._id ? { ...c, channels: updatedChannels } : c
            )
          );

          setIsEditChannelModalOpen(false);
          setEditingChannel(null);
          triggerToast(`✅ Updated #${updated.name} successfully!`);
        }
      } catch (err) {
        setUpdateChannelError(err.friendlyMessage || err.response?.data?.message || 'Failed to update channel.');
      } finally {
        setIsUpdatingChannel(false);
      }
    } else {
      // Mock fallback
      const updatedChannels = (activeCommunity?.channels || []).map((ch) =>
        ch.id === channelId
          ? { ...ch, name: cleanName, topic: editChannelForm.topic.trim(), isAnnouncement: editChannelForm.type === 'announcement' }
          : ch
      );
      setActiveCommunity((prev) => ({ ...prev, channels: updatedChannels }));
      setCommunities((prev) =>
        prev.map((c) => (c.id === activeCommunity?.id ? { ...c, channels: updatedChannels } : c))
      );
      setIsEditChannelModalOpen(false);
      setEditingChannel(null);
      setIsUpdatingChannel(false);
      triggerToast(`✅ Updated #${cleanName} successfully!`);
    }
  };

  // Helper: Open Delete Channel Modal
  const handleOpenDeleteChannel = (channel) => {
    setDeletingChannel(channel);
    setDeleteChannelError(null);
    setIsDeleteChannelModalOpen(true);
  };

  // Helper: Confirm Delete Channel
  const handleDeleteChannelConfirm = async () => {
    if (!deletingChannel) return;
    setIsDeletingChannel(true);
    setDeleteChannelError(null);

    const channelId = deletingChannel._id || deletingChannel.id;
    const isBackend = deletingChannel._id || /^[0-9a-fA-F]{24}$/.test(channelId);

    if (isBackend) {
      try {
        const res = await channelService.deleteChannel(channelId);
        if (res?.success) {
          const updatedChannels = (activeCommunity?.channels || []).filter(
            (ch) => ch.id !== channelId && ch._id !== channelId
          );

          setActiveCommunity((prev) => ({ ...prev, channels: updatedChannels }));
          setCommunities((prev) =>
            prev.map((c) =>
              c.id === activeCommunity?.id || c._id === activeCommunity?._id ? { ...c, channels: updatedChannels } : c
            )
          );

          if (activeChannelId === channelId) {
            setActiveChannelId(updatedChannels[0]?.id || '');
          }

          setIsDeleteChannelModalOpen(false);
          setDeletingChannel(null);
          triggerToast(`🗑️ Channel deleted successfully.`);
        }
      } catch (err) {
        setDeleteChannelError(err.friendlyMessage || err.response?.data?.message || 'Failed to delete channel.');
      } finally {
        setIsDeletingChannel(false);
      }
    } else {
      // Mock fallback
      const updatedChannels = (activeCommunity?.channels || []).filter((ch) => ch.id !== channelId);
      setActiveCommunity((prev) => ({ ...prev, channels: updatedChannels }));
      setCommunities((prev) =>
        prev.map((c) => (c.id === activeCommunity?.id ? { ...c, channels: updatedChannels } : c))
      );
      if (activeChannelId === channelId) {
        setActiveChannelId(updatedChannels[0]?.id || '');
      }
      setIsDeleteChannelModalOpen(false);
      setDeletingChannel(null);
      setIsDeletingChannel(false);
      triggerToast(`🗑️ Channel deleted successfully.`);
    }
  };



  // Helper: Join via Invite Code
  const handleJoinWithCodeSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    const cleanCode = joinCodeInput.trim().toUpperCase();
    const newId = generateId('comm_code');
    const joinedComm = {
      id: newId,
      name: `Community (${cleanCode})`,
      slug: cleanCode.toLowerCase(),
      icon: '✨',
      iconBg: '#FAF8F3',
      iconColor: '#80D8B0',
      category: 'Special Interest',
      description: `Joined via invitation code: ${cleanCode}`,
      membersCount: 42,
      userRole: 'Member',
      isJoined: true,
      channels: [
        { id: generateId('ch'), name: 'general', isPrivate: false, topic: 'Community chat' }
      ],
      members: [
        { id: currentUser.id, name: currentUser.name, username: currentUser.username, role: 'Member', status: 'Online', avatarText: currentUser.avatarText }
      ]
    };

    setCommunities(prev => [...prev, joinedComm]);
    setIsJoinModalOpen(false);
    setJoinCodeInput('');
    handleOpenCommunity(joinedComm);
    triggerToast(`✅ Joined community with code "${cleanCode}"!`);
  };

  // Helper: Copy community invite code/link
  const handleCopyInviteCode = () => {
    const code = activeCommunity?.inviteCode || (activeCommunity?.slug ? `${activeCommunity.slug.toUpperCase()}-2026` : 'COMM-INVITE');
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).catch(() => { });
    }
    setInviteCopied(true);
    triggerToast(`Copied invite code: ${code}`);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  // Community Member Permissions
  const userMemberRecord = activeCommunity?.members?.find(
    m => m.id === currentUser.id || m.username === currentUser.username
  );
  const effectiveCommunityRole = userMemberRecord?.role || activeCommunity?.userRole || 'Member';
  const currentUserId = currentUser.id || authService.getCurrentUserId();
  const isCommunityOwner = Boolean(
    (currentUserId && activeCommunity?.owner && String(activeCommunity.owner) === String(currentUserId)) ||
    activeCommunity?.userRole === 'Owner' ||
    effectiveCommunityRole === 'Owner'
  );
  const isCommunityAdmin = effectiveCommunityRole === 'Admin';
  const canManageMembers = isCommunityOwner || isCommunityAdmin || currentUser?.role === 'Community Lead';

  const canRemoveMember = (targetMember) => {
    if (!targetMember) return false;
    // Cannot remove oneself from the member list
    if (targetMember.id === currentUser.id || targetMember.username === currentUser.username) return false;
    // Cannot remove community Owner
    if (targetMember.role === 'Owner') return false;
    // Community Owner can remove Admins and Members
    if (isCommunityOwner) return true;
    // Community Admin can remove regular Members
    if (isCommunityAdmin && targetMember.role === 'Member') return true;
    // Community Lead fallback for moderation
    if (currentUser?.role === 'Community Lead' && targetMember.role === 'Member') return true;
    return false;
  };

  // Helper: Add member submit
  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    setAddMemberError('');

    if (!canManageMembers) {
      setAddMemberError('You do not have permission to add members to this community.');
      return;
    }

    const name = addMemberForm.name.trim();
    const rawUsername = addMemberForm.username.trim();

    if (!name) {
      setAddMemberError('Please enter the member\'s full name.');
      return;
    }

    if (!rawUsername) {
      setAddMemberError('Please enter a username.');
      return;
    }

    const cleanUsername = rawUsername.replace(/^@/, '').toLowerCase();

    // Check duplicate in activeCommunity.members
    const existingMembers = activeCommunity?.members || [];
    const isDuplicateUsername = existingMembers.some(
      m => m.username?.toLowerCase() === cleanUsername
    );
    if (isDuplicateUsername) {
      setAddMemberError(`A member with username @${cleanUsername} is already in this community.`);
      return;
    }

    const isDuplicateName = existingMembers.some(
      m => m.name?.trim().toLowerCase() === name.toLowerCase()
    );
    if (isDuplicateName) {
      setAddMemberError(`A member named "${name}" is already in this community.`);
      return;
    }

    // Role restrictions: Non-owner cannot add another Admin
    let assignedRole = addMemberForm.role || 'Member';
    if (!isCommunityOwner && assignedRole === 'Owner') {
      assignedRole = 'Member';
    }

    const initials = name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() || 'U';
    const newMember = {
      id: generateId('m'),
      name,
      username: cleanUsername,
      role: assignedRole,
      status: 'Online',
      avatarText: initials,
      email: addMemberForm.email?.trim() || `${cleanUsername}@example.com`
    };

    const updatedMembers = [...existingMembers, newMember];
    const newCount = updatedMembers.length;

    // Update active community immediately
    setActiveCommunity(prev => ({
      ...prev,
      members: updatedMembers,
      membersCount: newCount
    }));

    // Update communities collection immediately
    setCommunities(prev => prev.map(c => {
      if (c.id === activeCommunity.id) {
        return {
          ...c,
          members: updatedMembers,
          membersCount: newCount
        };
      }
      return c;
    }));

    setIsAddMemberModalOpen(false);
    setAddMemberForm({ name: '', username: '', role: 'Member', email: '' });
    setAddMemberError('');
    triggerToast(`🎉 Successfully added ${name} (@${cleanUsername}) as ${assignedRole}!`);
  };

  // Helper: Confirm remove member
  const handleConfirmRemoveMember = () => {
    if (!memberToRemove) return;

    if (!canRemoveMember(memberToRemove)) {
      triggerToast('Permission denied: You cannot remove this member.');
      setMemberToRemove(null);
      return;
    }

    const existingMembers = activeCommunity?.members || [];
    const updatedMembers = existingMembers.filter(m => m.id !== memberToRemove.id);
    const newCount = updatedMembers.length;

    // Update active community immediately
    setActiveCommunity(prev => ({
      ...prev,
      members: updatedMembers,
      membersCount: newCount
    }));

    // Update communities collection immediately
    setCommunities(prev => prev.map(c => {
      if (c.id === activeCommunity.id) {
        return {
          ...c,
          members: updatedMembers,
          membersCount: newCount
        };
      }
      return c;
    }));

    const removedName = memberToRemove.name;
    const removedUsername = memberToRemove.username;
    setMemberToRemove(null);
    triggerToast(`Removed ${removedName} (@${removedUsername}) from ${activeCommunity.name}.`);
  };

  // Channel Messages Handling
  const currentChannelMessages = useMemo(() => {
    const list = channelMessages[activeChannelId] || [];
    if (showPinnedOnly) {
      return list.filter(m => m.isPinned);
    }
    if (channelSearchQuery.trim()) {
      return list.filter(m => m.content.toLowerCase().includes(channelSearchQuery.toLowerCase()));
    }
    return list;
  }, [channelMessages, activeChannelId, showPinnedOnly, channelSearchQuery]);

  const handleSendChannelMessage = (e) => {
    e.preventDefault();
    if (!chatInputText.trim() && !attachedFile) return;

    const newMessage = {
      id: generateId('msg'),
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: activeCommunity?.userRole || 'Member',
      avatarText: currentUser.avatarText,
      timestamp: 'Just now',
      content: chatInputText.trim(),
      reactions: {},
      userReactions: [],
      isPinned: false,
      replyTo: replyingToMessage ? replyingToMessage.id : null,
      attachments: attachedFile ? [{ name: attachedFile.name, size: `${Math.round(attachedFile.size / 1024)} KB` }] : []
    };

    setChannelMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMessage]
    }));

    setChatInputText('');
    setAttachedFile(null);
    setReplyingToMessage(null);
  };

  const handleToggleReaction = (msgId, emoji) => {
    setChannelMessages(prev => {
      const channelList = prev[activeChannelId] || [];
      const updated = channelList.map(msg => {
        if (msg.id !== msgId) return msg;

        const userReactions = Array.isArray(msg.userReactions) ? [...msg.userReactions] : [];
        const hasReacted = userReactions.includes(emoji);
        const currentReactions = { ...(msg.reactions || {}) };

        if (hasReacted) {
          // Remove user's reaction
          const nextUserReactions = userReactions.filter(e => e !== emoji);
          const currentCount = currentReactions[emoji] || 1;
          const nextCount = Math.max(0, currentCount - 1);
          if (nextCount === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = nextCount;
          }
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions
          };
        } else {
          // Add user's reaction
          const nextUserReactions = [...userReactions, emoji];
          const currentCount = currentReactions[emoji] || 0;
          currentReactions[emoji] = currentCount + 1;
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions
          };
        }
      });
      return { ...prev, [activeChannelId]: updated };
    });
  };

  const handleDeleteMessage = (msgId) => {
    setChannelMessages(prev => ({
      ...prev,
      [activeChannelId]: (prev[activeChannelId] || []).filter(m => m.id !== msgId)
    }));
    triggerToast('Message deleted.');
  };

  // Direct Messages Handling
  const activeDm = directMessages.find(d => d.id === activeDmId) || directMessages[0];

  // Memoized DM search filter
  const filteredDirectMessages = useMemo(() => {
    if (!dmSearchQuery.trim()) return directMessages;
    const q = dmSearchQuery.toLowerCase();
    return directMessages.filter(dm =>
      dm.name.toLowerCase().includes(q) ||
      (dm.username && dm.username.toLowerCase().includes(q))
    );
  }, [directMessages, dmSearchQuery]);

  // Filter messages within the currently active DM conversation
  const activeDmMessages = useMemo(() => {
    const msgs = activeDm?.messages || [];
    if (!dmMessageSearchQuery.trim()) return msgs;
    const q = dmMessageSearchQuery.toLowerCase();
    return msgs.filter(m =>
      m.content.toLowerCase().includes(q) ||
      (m.senderName && m.senderName.toLowerCase().includes(q))
    );
  }, [activeDm, dmMessageSearchQuery]);

  const renderMessageTextWithMentions = (text) => {
    if (!text) return null;
    const parts = text.split(/(@[a-zA-Z0-9_-]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="dm-mention-tag">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  // Moderator Hub Filter & Search
  const filteredModerationItems = useMemo(() => {
    return moderationItems.filter(item => {
      if (modFilterTab === 'high' && item.aiSeverity?.toLowerCase() !== 'high') return false;
      if (modFilterTab === 'medium' && item.aiSeverity?.toLowerCase() !== 'medium') return false;
      if (modFilterTab === 'spam' && !item.classification?.toLowerCase().includes('spam')) return false;
      if (modFilterTab === 'harassment' && !item.classification?.toLowerCase().includes('harassment')) return false;
      if (modSearchQuery.trim()) {
        const q = modSearchQuery.toLowerCase();
        const matchText = item.messageText?.toLowerCase().includes(q);
        const matchSender = item.senderName?.toLowerCase().includes(q) || item.senderUsername?.toLowerCase().includes(q);
        const matchChannel = item.channelName?.toLowerCase().includes(q);
        if (!matchText && !matchSender && !matchChannel) return false;
      }
      return true;
    });
  }, [moderationItems, modFilterTab, modSearchQuery]);

  const modFilterCounts = useMemo(() => {
    const searchFilter = (item) => {
      if (!modSearchQuery.trim()) return true;
      const q = modSearchQuery.toLowerCase();
      return (
        item.messageText?.toLowerCase().includes(q) ||
        item.senderName?.toLowerCase().includes(q) ||
        item.senderUsername?.toLowerCase().includes(q) ||
        item.channelName?.toLowerCase().includes(q)
      );
    };

    const searchable = moderationItems.filter(searchFilter);
    return {
      all: searchable.length,
      high: searchable.filter(i => i.aiSeverity?.toLowerCase() === 'high').length,
      medium: searchable.filter(i => i.aiSeverity?.toLowerCase() === 'medium').length,
      spam: searchable.filter(i => i.classification?.toLowerCase().includes('spam')).length,
      harassment: searchable.filter(i => i.classification?.toLowerCase().includes('harassment')).length,
    };
  }, [moderationItems, modSearchQuery]);

  const handleSendDm = (e) => {
    e.preventDefault();
    if (!dmInputText.trim() && !dmAttachedFile) return;
    if (!activeDm) return;

    const newDmMessage = {
      id: generateId('dmsg'),
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: 'Just now',
      content: dmInputText.trim(),
      reactions: {},
      userReactions: [],
      replyTo: dmReplyingTo ? dmReplyingTo.id : null,
      replySnippet: dmReplyingTo ? { senderName: dmReplyingTo.senderName, content: dmReplyingTo.content } : null,
      attachments: dmAttachedFile
        ? [{ name: dmAttachedFile.name, size: `${Math.round(dmAttachedFile.size / 1024) || 1} KB` }]
        : [],
      status: 'delivered'
    };

    setDirectMessages(prev => prev.map(dm => {
      if (dm.id !== activeDm.id) return dm;
      return {
        ...dm,
        messages: [...dm.messages, newDmMessage]
      };
    }));

    setDmInputText('');
    setDmAttachedFile(null);
    setDmReplyingTo(null);
  };

  const handleToggleDmReaction = (msgId, emoji) => {
    if (!activeDm) return;
    setDirectMessages(prev => prev.map(dm => {
      if (dm.id !== activeDm.id) return dm;
      const updatedMessages = dm.messages.map(msg => {
        if (msg.id !== msgId) return msg;
        const userReactions = Array.isArray(msg.userReactions) ? [...msg.userReactions] : [];
        const hasReacted = userReactions.includes(emoji);
        const currentReactions = { ...(msg.reactions || {}) };

        if (hasReacted) {
          const nextUserReactions = userReactions.filter(e => e !== emoji);
          const currentCount = currentReactions[emoji] || 1;
          const nextCount = Math.max(0, currentCount - 1);
          if (nextCount === 0) {
            delete currentReactions[emoji];
          } else {
            currentReactions[emoji] = nextCount;
          }
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions
          };
        } else {
          const nextUserReactions = [...userReactions, emoji];
          const currentCount = currentReactions[emoji] || 0;
          currentReactions[emoji] = currentCount + 1;
          return {
            ...msg,
            reactions: currentReactions,
            userReactions: nextUserReactions
          };
        }
      });
      return { ...dm, messages: updatedMessages };
    }));
  };

  const handleStartEditDmMessage = (msg) => {
    setEditingDmMessageId(msg.id);
    setEditingDmContent(msg.content);
  };

  const handleSaveEditDmMessage = (msgId) => {
    if (!editingDmContent.trim() || !activeDm) return;
    setDirectMessages(prev => prev.map(dm => {
      if (dm.id !== activeDm.id) return dm;
      const updatedMessages = dm.messages.map(msg => {
        if (msg.id !== msgId) return msg;
        return {
          ...msg,
          content: editingDmContent.trim(),
          isEdited: true
        };
      });
      return { ...dm, messages: updatedMessages };
    }));
    setEditingDmMessageId(null);
    setEditingDmContent('');
    triggerToast('Message updated.');
  };

  const handleDeleteDmMessage = (msgId) => {
    if (!activeDm) return;
    setDirectMessages(prev => prev.map(dm => {
      if (dm.id !== activeDm.id) return dm;
      return {
        ...dm,
        messages: dm.messages.filter(m => m.id !== msgId)
      };
    }));
    triggerToast('Message deleted.');
  };

  const handleCreateConversation = (e) => {
    e.preventDefault();
    setNewDmError('');

    if (newDmType === 'direct') {
      const recipient = newDmRecipient.trim();
      if (!recipient) {
        setNewDmError('Please enter a username or name.');
        return;
      }
      const cleanUser = recipient.replace(/^@/, '');
      const existing = directMessages.find(d =>
        !d.isGroup && (
          (d.username && d.username.toLowerCase() === cleanUser.toLowerCase()) ||
          d.name.toLowerCase() === cleanUser.toLowerCase()
        )
      );
      if (existing) {
        setActiveDmId(existing.id);
        setIsNewDmModalOpen(false);
        setNewDmRecipient('');
        setMobileDmView('chat');
        triggerToast(`Switched to conversation with ${existing.name}.`);
        return;
      }

      const initials = cleanUser.slice(0, 2).toUpperCase() || 'U';
      const newDm = {
        id: generateId('dm'),
        isGroup: false,
        name: recipient,
        username: cleanUser.toLowerCase(),
        role: 'Member',
        avatarText: initials,
        status: 'Online',
        unreadCount: 0,
        messages: []
      };

      setDirectMessages(prev => [newDm, ...prev]);
      setActiveDmId(newDm.id);
      setIsNewDmModalOpen(false);
      setNewDmRecipient('');
      setMobileDmView('chat');
      triggerToast(`Started direct conversation with ${recipient}!`);
    } else {
      const groupName = newDmGroupName.trim();
      if (!groupName) {
        setNewDmError('Please enter a group conversation name.');
        return;
      }
      const rawMembers = newDmGroupMembers.trim();
      const membersList = rawMembers
        ? rawMembers.split(',').map(m => m.trim().replace(/^@/, '')).filter(Boolean)
        : [];

      const participants = [currentUser.name, ...membersList];
      const newGroupDm = {
        id: generateId('dm_grp'),
        isGroup: true,
        name: groupName,
        participants,
        avatarText: '👥',
        unreadCount: 0,
        messages: []
      };

      setDirectMessages(prev => [newGroupDm, ...prev]);
      setActiveDmId(newGroupDm.id);
      setIsNewDmModalOpen(false);
      setNewDmGroupName('');
      setNewDmGroupMembers('');
      setMobileDmView('chat');
      triggerToast(`Created group conversation "${groupName}"!`);
    }
  };

  // Moderation Actions (Pure ID generation)
  const handleModerationAction = (item, action) => {
    setModerationItems(prev => prev.filter(m => m.id !== item.id));

    const newLog = {
      id: generateId('log'),
      timestamp: 'Just now',
      moderator: currentUser.name,
      action: action === 'approve' ? 'Approved Message' : action === 'delete' ? 'Deleted Message' : action === 'warn' ? 'Warned User' : 'Banned User',
      target: `@${item.senderUsername}`,
      reason: `Action on flagged message (${item.classification})`
    };

    setAuditLogs(prev => [newLog, ...prev]);
    triggerToast(`Moderation: ${newLog.action} applied to @${item.senderUsername}`);
  };

  // Notification Handling
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    triggerToast('All notifications marked as read.');
  };

  // Profile Save
  const handleSaveProfile = (updatedProfile) => {
    setCurrentUser(prev => ({ ...prev, ...updatedProfile }));
    triggerToast('✅ Profile settings saved successfully!');
  };

  // Active channel helper
  const currentActiveChannel = activeCommunity?.channels?.find(ch => ch.id === activeChannelId) || activeCommunity?.channels?.[0];

  return (
    <div className="dashboard-container">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="dashboard-toast" role="alert">
          {toastMessage}
        </div>
      )}

      {/* Mobile & Tablet Drawer Backdrop Overlay */}
      {isNavOpen && (
        <div
          className="drawer-overlay"
          onClick={handleCloseNav}
          aria-hidden="true"
        />
      )}

      {/* =========================================================
          LEFT NAVIGATION SIDEBAR (Collapsible Desktop + Mobile Drawer)
          ========================================================= */}
      <aside
        className={`sidebar ${isNavOpen ? 'expanded mobile-open' : 'collapsed'}`}
        aria-label="Sidebar Navigation"
      >
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src={topLogo} alt="YAPPY" className="sidebar-logo-img" />
          </div>
          {/* Close Icon (✕) inside sidebar */}
          <button
            type="button"
            className="sidebar-close-btn"
            onClick={handleCloseNav}
            title="Close Navigation"
            aria-label="Close Navigation"
          >
            ✕
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="nav-menu">
          <button
            type="button"
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleNavClick('dashboard')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Dashboard</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'my-communities' || activeTab === 'community-view' ? 'active' : ''}`}
            onClick={() => handleNavClick('my-communities')}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">My Communities</span>
            <span className="nav-badge">{communities.length}</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => handleNavClick('discover')}
          >
            <span className="nav-icon">🧭</span>
            <span className="nav-label">Discover</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => handleNavClick('messages')}
          >
            <span className="nav-icon">💬</span>
            <span className="nav-label">Direct Messages</span>
            <span className="nav-badge">3</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => handleNavClick('notifications')}
          >
            <span className="nav-icon">🔔</span>
            <span className="nav-label">Notifications</span>
            {unreadNotificationsCount > 0 && (
              <span className="nav-badge unread">{unreadNotificationsCount}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'moderation' ? 'active' : ''}`}
            onClick={() => handleNavClick('moderation')}
          >
            <span className="nav-icon">🛡️</span>
            <span className="nav-label">Moderator Hub</span>
            {moderationItems.length > 0 && (
              <span className="nav-badge alert">{moderationItems.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => handleNavClick('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>

        {/* User Account & Logout in Sidebar Footer */}
        <div className="sidebar-profile">
          <div className="avatar-chip">
            <span className="avatar-text">{currentUser.avatarText}</span>
            <span className={`status-dot ${currentUser.status.toLowerCase().replace(/\s+/g, '-')}`} />
          </div>
          <div className="profile-details">
            <div className="profile-name">{currentUser.name}</div>
            <div className="profile-role">{currentUser.role}</div>
          </div>
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={async () => {
              try {
                await authService.logout();
              } catch (e) {
                console.warn('Logout notification error:', e);
              }
              if (onFormSwitch) onFormSwitch('login');
            }}
            title="Log Out"
            aria-label="Log Out"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* =========================================================
          MAIN CONTENT AREA
          ========================================================= */}
      <main className="main-area">
        {/* Top Header */}
        <header className="top-nav">
          <div className="top-nav-left">
            {/* Hamburger menu icon (☰) shown ONLY when navigation is closed */}
            {!isNavOpen && (
              <button
                type="button"
                className="hamburger-btn"
                onClick={handleToggleNav}
                title="Open Navigation"
                aria-label="Open Navigation"
                aria-expanded="false"
              >
                ☰
              </button>
            )}

            {/* Header Search Input */}
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search communities, members, topics..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                aria-label="Global search"
              />
              {globalSearch && (
                <button
                  type="button"
                  className="clear-search-btn"
                  onClick={() => setGlobalSearch('')}
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <div className="top-nav-actions">
            {/* Quick Action Button in Header */}
            <button
              type="button"
              className="btn-header-action"
              onClick={() => setIsCreateModalOpen(true)}
            >
              + Create
            </button>

            {/* Notifications Bell */}
            <button
              type="button"
              className="top-icon-btn"
              onClick={() => setActiveTab('notifications')}
              title="Notifications"
              aria-label="Notifications"
            >
              🔔
              {unreadNotificationsCount > 0 && (
                <span className="icon-badge">{unreadNotificationsCount}</span>
              )}
            </button>

            {/* Header Profile Chip */}
            <div
              className="header-profile-chip"
              onClick={() => setActiveTab('settings')}
              role="button"
              tabIndex={0}
              title="View Profile Settings"
            >
              <div className="avatar-chip small">
                <span className="avatar-text">{currentUser.avatarText}</span>
              </div>
              <div className="header-user-info">
                <span className="header-user-name">{currentUser.name}</span>
                <span className="header-user-sub">{currentUser.college}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Main Views */}
        <div className="content-wrapper">
          {/* 1. DASHBOARD OVERVIEW VIEW */}
          {activeTab === 'dashboard' && (
            <div className="overview-layout">
              <div className="overview-main">
                {/* Welcome Banner */}
                <div className="welcome-banner">
                  <div className="banner-text">
                    <h1>Good Morning, {currentUser.name}!</h1>
                    <p>Explore communities, participate in discussions, and connect with peers safely.</p>
                  </div>
                  <div className="banner-stats-pill">
                    <span>🌟 {communities.length} Communities Joined</span>
                  </div>
                </div>

                {/* MY COMMUNITIES PREVIEW SECTION */}
                <section className="dashboard-section">
                  <div className="section-header">
                    <h2>My Communities</h2>
                    <button
                      type="button"
                      className="view-all-btn"
                      onClick={() => setActiveTab('my-communities')}
                    >
                      View All →
                    </button>
                  </div>

                  <div className="card-grid">
                    {communitiesLoading ? (
                      <div className="communities-loading-state" style={{ gridColumn: '1 / -1', padding: '2rem 1rem' }}>
                        <div className="mini-spinner"></div>
                        <span>Loading communities...</span>
                      </div>
                    ) : communities.length === 0 ? (
                      <div className="communities-empty-state" style={{ gridColumn: '1 / -1', padding: '2rem 1rem' }}>
                        <p>No communities joined yet.</p>
                      </div>
                    ) : (
                      communities
                        .filter(c => !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()))
                        .slice(0, 3)
                        .map(comm => (
                          <div key={comm.id} className="community-card">
                            <div
                              className="card-icon"
                              style={{ backgroundColor: comm.iconBg, color: comm.iconColor }}
                            >
                              {comm.icon}
                            </div>
                            <h3 className="card-title">{comm.name}</h3>
                            <p className="card-desc">{comm.description}</p>
                            <div className="card-footer">
                              <span className="member-count">👥 {comm.membersCount} members</span>
                              <div className="card-actions">
                                <span className="badge-role">{comm.userRole}</span>
                                <button
                                  type="button"
                                  className="btn-card-open"
                                  onClick={() => handleOpenCommunity(comm)}
                                >
                                  Enter →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </section>

                {/* DISCOVER COMMUNITIES PREVIEW SECTION */}
                <section className="dashboard-section">
                  <div className="section-header">
                    <h2>Discover Communities</h2>
                    <button
                      type="button"
                      className="view-all-btn"
                      onClick={() => setActiveTab('discover')}
                    >
                      Explore All →
                    </button>
                  </div>

                  <div className="card-grid">
                    {communitiesLoading ? (
                      <div className="communities-loading-state" style={{ gridColumn: '1 / -1', padding: '2rem 1rem' }}>
                        <div className="mini-spinner"></div>
                        <span>Loading communities...</span>
                      </div>
                    ) : discoverList.length === 0 ? (
                      <div className="communities-empty-state" style={{ gridColumn: '1 / -1', padding: '2rem 1rem' }}>
                        <p>No communities found to explore.</p>
                      </div>
                    ) : (
                      discoverList
                        .filter(c => !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()))
                        .slice(0, 3)
                        .map(item => {
                          const isJoined = communities.some(c => c.id === item.id || c._id === item.id || (item._id && c._id === item._id));
                          const isJoining = joiningCommunityId === (item._id || item.id);
                          return (
                            <div key={item.id} className="community-card">
                              <div
                                className="card-icon"
                                style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                              >
                                {item.icon}
                              </div>
                              <h3 className="card-title">{item.name}</h3>
                              <p className="card-desc">{item.description}</p>
                              <div className="card-footer">
                                <span className="member-count">👥 {item.membersCount} members</span>
                                <button
                                  type="button"
                                  className={`badge-action ${isJoined ? 'joined' : 'join'}`}
                                  disabled={isJoined || isJoining}
                                  onClick={() => handleJoinCommunity(item)}
                                >
                                  {isJoining ? 'Joining...' : (isJoined ? 'Joined ✓' : 'Join')}
                                </button>
                              </div>
                            </div>
                          );
                        })
                    )}
                  </div>
                </section>
              </div>

              {/* Overview Sidebar Widgets */}
              <div className="overview-sidebar">
                {/* Quick Actions Widget */}
                <div className="widget-card">
                  <h3 className="widget-title">Quick Actions</h3>
                  <button
                    type="button"
                    className="btn-widget primary"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    + Create Community
                  </button>
                  <button
                    type="button"
                    className="btn-widget secondary"
                    onClick={() => setIsJoinModalOpen(true)}
                  >
                    🔗 Join with Invite Code
                  </button>
                </div>

                {/* Community Stats Widget */}
                <div className="widget-card">
                  <div className="section-header" style={{ marginBottom: '1rem' }}>
                    <h3 className="widget-title" style={{ margin: 0 }}>Community Stats</h3>
                  </div>
                  <div className="stats-list">
                    <div className="stat-row">
                      <span className="stat-label">Joined Communities</span>
                      <span className="stat-value">{communities.length}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Active DMs</span>
                      <span className="stat-value">{directMessages.length}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Pending Flags</span>
                      <span className="stat-value alert">{moderationItems.length}</span>
                    </div>
                    <div className="stat-row">
                      <span className="stat-label">Your Role</span>
                      <span className="badge-role">{currentUser.role}</span>
                    </div>
                  </div>
                </div>

                {/* Moderation Hub Quick Card */}
                <div className="widget-card mod-preview">
                  <div className="mod-preview-header">
                    <span className="mod-shield">🛡️</span>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>AI Moderation Hub</h4>
                      <p style={{ margin: 0, fontSize: '0.75rem', color: '#777B85' }}>Human-in-the-loop review</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#777B85', margin: '0.75rem 0' }}>
                    {moderationItems.length} messages awaiting your classification review.
                  </p>
                  <button
                    type="button"
                    className="btn-widget tertiary"
                    onClick={() => setActiveTab('moderation')}
                  >
                    Open Moderator Queue →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. MY COMMUNITIES VIEW */}
          {activeTab === 'my-communities' && (
            <div className="my-communities-view">
              <div className="view-banner-header">
                <div>
                  <h2>My Communities ({communities.length})</h2>
                  <p>Communities you have joined or created. Select any community to open its channels.</p>
                </div>
                <div className="banner-actions">
                  <button
                    type="button"
                    className="btn-primary-purple"
                    onClick={() => setIsCreateModalOpen(true)}
                  >
                    + Create Community
                  </button>
                  <button
                    type="button"
                    className="btn-secondary-outline"
                    onClick={() => setIsJoinModalOpen(true)}
                  >
                    Join with Code
                  </button>
                </div>
              </div>

              <div className="card-grid">
                {communitiesLoading ? (
                  <div className="communities-loading-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="spinner-large"></div>
                    <p>Loading communities from server...</p>
                  </div>
                ) : communitiesError && communities.length === 0 ? (
                  <div className="communities-error-state" style={{ gridColumn: '1 / -1' }}>
                    <p>⚠️ {communitiesError}</p>
                    <button type="button" className="btn-retry-action" onClick={fetchCommunities}>
                      Retry Loading
                    </button>
                  </div>
                ) : communities.length === 0 ? (
                  <div className="communities-empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-icon">🌐</div>
                    <h3>No communities joined yet</h3>
                    <p>Explore interest hubs in Discover Communities or create your own space!</p>
                    <div className="empty-actions">
                      <button type="button" className="btn-primary-purple" onClick={() => setIsCreateModalOpen(true)}>
                        + Create Community
                      </button>
                      <button type="button" className="btn-secondary-outline" onClick={() => setActiveTab('discover')}>
                        Explore Discover
                      </button>
                    </div>
                  </div>
                ) : (
                  communities
                    .filter(c => !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()))
                    .map(comm => (
                      <div key={comm.id} className="community-card large">
                        <div className="card-header-row">
                          <div
                            className="card-icon"
                            style={{ backgroundColor: comm.iconBg, color: comm.iconColor }}
                          >
                            {comm.icon}
                          </div>
                          <span className="badge-role">{comm.userRole}</span>
                        </div>
                        <h3 className="card-title">{comm.name}</h3>
                        <p className="card-desc">{comm.description}</p>
                        <div className="channels-pill-preview">
                          {comm.channels?.slice(0, 3).map(ch => (
                            <span key={ch.id} className="ch-pill">
                              {ch.isPrivate ? '🔒' : '#'}{ch.name}
                            </span>
                          ))}
                          {comm.channels?.length > 3 && (
                            <span className="ch-pill more">+{comm.channels.length - 3} more</span>
                          )}
                        </div>
                        <div className="card-footer">
                          <span className="member-count">👥 {comm.membersCount} members</span>
                          <button
                            type="button"
                            className="btn-card-open"
                            onClick={() => handleOpenCommunity(comm)}
                          >
                            Enter Community →
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {/* 3. DISCOVER COMMUNITIES VIEW */}
          {activeTab === 'discover' && (
            <div className="discover-view">
              <div className="view-banner-header">
                <div>
                  <h2>Discover Communities</h2>
                  <p>Explore interest-based student and professional hubs. Click Join to become a member.</p>
                </div>
                <div className="category-filter-bar">
                  {['All', 'Development', 'Design', 'AI/ML', 'Tech', 'Education'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`cat-pill ${discoverCategory === cat ? 'active' : ''}`}
                      onClick={() => setDiscoverCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-grid">
                {communitiesLoading ? (
                  <div className="communities-loading-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="spinner-large"></div>
                    <p>Discovering available communities...</p>
                  </div>
                ) : communitiesError && discoverList.length === 0 ? (
                  <div className="communities-error-state" style={{ gridColumn: '1 / -1' }}>
                    <p>⚠️ {communitiesError}</p>
                    <button type="button" className="btn-retry-action" onClick={fetchCommunities}>
                      Retry Loading
                    </button>
                  </div>
                ) : discoverList.filter(item => discoverCategory === 'All' || item.category === discoverCategory).length === 0 ? (
                  <div className="communities-empty-state" style={{ gridColumn: '1 / -1' }}>
                    <div className="empty-icon">🔍</div>
                    <h3>No communities found</h3>
                    <p>No communities match the current filter. Try selecting "All" or create a new community!</p>
                  </div>
                ) : (
                  discoverList
                    .filter(item => discoverCategory === 'All' || item.category === discoverCategory)
                    .filter(item => !globalSearch || item.name.toLowerCase().includes(globalSearch.toLowerCase()) || item.description.toLowerCase().includes(globalSearch.toLowerCase()))
                    .map(item => {
                      const isJoined = communities.some(c => c.id === item.id || c._id === item.id || (item._id && c._id === item._id));
                      const isJoining = joiningCommunityId === (item._id || item.id);
                      return (
                        <div key={item.id} className="community-card large">
                          <div className="card-header-row">
                            <div
                              className="card-icon"
                              style={{ backgroundColor: item.iconBg, color: item.iconColor }}
                            >
                              {item.icon}
                            </div>
                            <span className="cat-badge">{item.category}</span>
                          </div>
                          <h3 className="card-title">{item.name}</h3>
                          <p className="card-desc">{item.description}</p>
                          <div className="card-footer">
                            <span className="member-count">👥 {item.membersCount} members</span>
                            <button
                              type="button"
                              className={`badge-action ${isJoined ? 'joined' : 'join'}`}
                              disabled={isJoined || isJoining}
                              onClick={() => handleJoinCommunity(item)}
                            >
                              {isJoining ? 'Joining...' : (isJoined ? 'Joined ✓' : 'Join Community')}
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* 4. COMMUNITY WORKSPACE & CHANNELS VIEW (Discord-Inspired) */}
          {activeTab === 'community-view' && activeCommunity && (
            <div className="community-workspace">
              {/* Left Channel Navigation Column */}
              <div className="channels-sidebar">
                <div className="community-sidebar-header">
                  <div className="comm-title-wrap">
                    <span className="comm-icon-mini" style={{ backgroundColor: activeCommunity.iconBg, color: activeCommunity.iconColor }}>
                      {activeCommunity.icon}
                    </span>
                    <h3 className="comm-sidebar-name">{activeCommunity.name}</h3>
                  </div>
                  <button
                    type="button"
                    className="comm-back-btn"
                    onClick={() => setActiveTab('my-communities')}
                    title="Back to Communities"
                  >
                    ←
                  </button>
                </div>

                <div className="channels-list">
                  <div className="channel-group-header">
                    <span className="channel-group-label">TEXT CHANNELS</span>
                    {canManageMembers && (
                      <button
                        type="button"
                        className="btn-add-channel-icon"
                        onClick={() => {
                          setCreateChannelError(null);
                          setIsCreateChannelModalOpen(true);
                        }}
                        title="Create Channel"
                        aria-label="Create Channel"
                      >
                        +
                      </button>
                    )}
                  </div>

                  {channelsLoading && (
                    <div className="channels-loading-state">
                      <div className="mini-spinner"></div>
                      <span>Loading channels...</span>
                    </div>
                  )}

                  {channelsError && !channelsLoading && (
                    <div className="channels-error-state">
                      <span>{channelsError}</span>
                      <button
                        type="button"
                        className="btn-retry-channels"
                        onClick={() => {
                          const commId = activeCommunity._id || activeCommunity.id;
                          fetchChannelsForCommunity(commId);
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  )}

                  {!channelsLoading && (!activeCommunity.channels || activeCommunity.channels.length === 0) && (
                    <div className="channels-empty-state">
                      <p>No channels in this community yet.</p>
                      {isCommunityOwner && (
                        <button
                          type="button"
                          className="btn-create-first-chan"
                          onClick={() => {
                            setCreateChannelError(null);
                            setIsCreateChannelModalOpen(true);
                          }}
                        >
                          + Create Channel
                        </button>
                      )}
                    </div>
                  )}

                  {!channelsLoading && activeCommunity.channels?.map(channel => (
                    <div
                      key={channel.id}
                      className={`channel-item-row ${activeChannelId === channel.id ? 'active' : ''}`}
                    >
                      <button
                        type="button"
                        className={`channel-item ${activeChannelId === channel.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveChannelId(channel.id);
                          setReplyingToMessage(null);
                        }}
                      >
                        <span className="channel-hash">{channel.isPrivate ? '🔒' : '#'}</span>
                        <span className="channel-name">{channel.name}</span>
                        {channel.isAnnouncement && <span className="announcement-tag">📢</span>}
                      </button>
                      {isCommunityOwner && (
                        <div className="channel-item-actions">
                          <button
                            type="button"
                            className="btn-chan-action"
                            title="Edit Channel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditChannel(channel);
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="btn-chan-action delete"
                            title="Delete Channel"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDeleteChannel(channel);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="channel-footer-actions">
                  <button
                    type="button"
                    className="btn-toggle-members"
                    onClick={() => setShowMembersPanel(!showMembersPanel)}
                  >
                    {showMembersPanel ? 'Hide Members 👥' : 'Show Members 👥'}
                  </button>
                </div>
              </div>

              {/* Center Main Chat Panel */}
              <div className="main-chat-panel">
                {/* Channel Header */}
                <div className="chat-header">
                  <div className="chat-header-left">
                    <span className="chat-header-hash">{currentActiveChannel?.isPrivate ? '🔒' : '#'}</span>
                    <span className="chat-header-title">{currentActiveChannel?.name}</span>
                    <span className="chat-header-topic">{currentActiveChannel?.topic}</span>
                  </div>

                  <div className="chat-header-actions">
                    {/* Server Guidelines button */}
                    <button
                      type="button"
                      className="btn-header-secondary"
                      onClick={() => setIsGuidelinesModalOpen(true)}
                      title="View Guidelines & Rules"
                    >
                      📜 Rules
                    </button>

                    {/* Server Analytics button */}
                    {canManageMembers && (
                      <button
                        type="button"
                        className="btn-header-secondary"
                        onClick={() => setIsAnalyticsModalOpen(true)}
                        title="View Server Analytics"
                      >
                        📊 Analytics
                      </button>
                    )}

                    {/* Search inside channel */}
                    <div className="channel-search-box">
                      <input
                        type="text"
                        placeholder="Search channel..."
                        value={channelSearchQuery}
                        onChange={(e) => setChannelSearchQuery(e.target.value)}
                      />
                      {channelSearchQuery && (
                        <button type="button" onClick={() => setChannelSearchQuery('')}>×</button>
                      )}
                    </div>

                    {/* Filter Pinned Messages */}
                    <button
                      type="button"
                      className={`btn-pinned-toggle ${showPinnedOnly ? 'active' : ''}`}
                      onClick={() => setShowPinnedOnly(!showPinnedOnly)}
                      title="Toggle Pinned Messages"
                    >
                      📌 {showPinnedOnly ? 'All' : 'Pinned'}
                    </button>
                  </div>
                </div>

                {/* Message History Feed */}
                <div className="message-history">
                  {currentChannelMessages.length === 0 ? (
                    <div className="empty-chat-state">
                      <span className="empty-icon">💬</span>
                      <h4>No messages in #{currentActiveChannel?.name} yet</h4>
                      <p>Be the first to break the ice and start a conversation!</p>
                    </div>
                  ) : (
                    currentChannelMessages.map(msg => (
                      <div key={msg.id} className={`chat-message-row ${msg.isPinned ? 'pinned-msg' : ''}`}>
                        <div className="msg-avatar">
                          <span>{msg.avatarText}</span>
                        </div>
                        <div className="msg-body">
                          <div className="msg-meta">
                            <span className="msg-sender">{msg.senderName}</span>
                            <span className="msg-role-badge">{msg.senderRole}</span>
                            <span className="msg-time">{msg.timestamp}</span>
                            {msg.isPinned && <span className="pinned-badge">📌 Pinned</span>}
                          </div>

                          {/* Reply quote banner if replying */}
                          {msg.replyTo && (
                            <div className="reply-quote-bar">
                              ↳ Replying to message #{msg.replyTo}
                            </div>
                          )}

                          <div className="msg-text">{msg.content}</div>

                          {/* Attachments preview */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="attachments-wrapper">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className="attachment-chip">
                                  📄 {att.name} <span className="att-size">({att.size})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Emoji Reactions Bar */}
                          <div className="reactions-container">
                            {Object.entries(msg.reactions || {}).map(([emoji, count]) => {
                              const hasUserReacted = Array.isArray(msg.userReactions) && msg.userReactions.includes(emoji);
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  className={`reaction-bubble ${hasUserReacted ? 'user-reacted' : ''}`}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  aria-pressed={hasUserReacted}
                                  title={hasUserReacted ? `Remove ${emoji} reaction` : `React with ${emoji}`}
                                >
                                  <span className="reaction-emoji">{emoji}</span>
                                  <span className="reaction-count">{count}</span>
                                </button>
                              );
                            })}
                            {/* Quick Add Reaction Buttons */}
                            <div className="quick-react-buttons">
                              {['👍', '❤️', '🔥', '🚀', '💡'].map(emoji => {
                                const hasUserReacted = Array.isArray(msg.userReactions) && msg.userReactions.includes(emoji);
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className={`btn-add-react ${hasUserReacted ? 'user-reacted' : ''}`}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                    title={hasUserReacted ? `Remove ${emoji}` : `React with ${emoji}`}
                                    aria-pressed={hasUserReacted}
                                  >
                                    {emoji}
                                  </button>
                                );
                              })}
                              <button
                                type="button"
                                className="btn-reply-action"
                                onClick={() => setReplyingToMessage(msg)}
                                title="Reply to message"
                              >
                                ↩ Reply
                              </button>
                              {msg.senderId === currentUser.id && (
                                <button
                                  type="button"
                                  className="btn-delete-action"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  title="Delete your message"
                                >
                                  🗑
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Indicator Bar */}
                {replyingToMessage && (
                  <div className="replying-banner">
                    <span>Replying to <strong>{replyingToMessage.senderName}</strong>: "{replyingToMessage.content.slice(0, 50)}..."</span>
                    <button type="button" onClick={() => setReplyingToMessage(null)}>×</button>
                  </div>
                )}

                {/* File Attachment Preview Bar */}
                {attachedFile && (
                  <div className="attached-file-banner">
                    <span>📎 Attached: {attachedFile.name}</span>
                    <button type="button" onClick={() => setAttachedFile(null)}>×</button>
                  </div>
                )}

                {/* Message Input Footer */}
                <form className="chat-input-form" onSubmit={handleSendChannelMessage}>
                  <label className="btn-attachment" title="Attach file or image">
                    📎
                    <input
                      type="file"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachedFile(e.target.files[0]);
                          triggerToast(`Attached: ${e.target.files[0].name}`);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    className="btn-mention-trigger"
                    onClick={() => setChatInputText(prev => prev + ' @')}
                    title="Mention someone"
                  >
                    @
                  </button>

                  <input
                    type="text"
                    className="chat-text-input"
                    placeholder={`Message #${currentActiveChannel?.name}...`}
                    value={chatInputText}
                    onChange={(e) => setChatInputText(e.target.value)}
                  />

                  <button
                    type="submit"
                    className="btn-chat-send"
                    disabled={!chatInputText.trim() && !attachedFile}
                  >
                    Send ✈
                  </button>
                </form>
              </div>

              {/* Right Members List Panel */}
              {showMembersPanel && (
                <div className="members-panel">
                  <div className="members-header">
                    <div className="members-header-title">
                      <span>MEMBERS</span>
                      <span className="members-header-badge">{activeCommunity.members?.length || 0}</span>
                    </div>
                    {canManageMembers && (
                      <button
                        type="button"
                        className="btn-members-add"
                        onClick={() => {
                          setAddMemberError('');
                          setAddMemberForm({ name: '', username: '', role: 'Member', email: '' });
                          setIsAddMemberModalOpen(true);
                        }}
                        title="Add or invite member"
                        aria-label="Add Member"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                  <div className="members-list">
                    {activeCommunity.members?.map(m => (
                      <div key={m.id} className="member-row">
                        <div className="member-avatar">
                          <span>{m.avatarText}</span>
                          <span className={`status-dot ${m.status?.toLowerCase() || 'online'}`} />
                        </div>
                        <div className="member-info">
                          <span className="member-name">{m.name}</span>
                          <span className="member-role-label">{m.role}</span>
                        </div>
                        {canRemoveMember(m) && (
                          <button
                            type="button"
                            className="btn-remove-member"
                            onClick={() => setMemberToRemove(m)}
                            title={`Remove ${m.name} (@${m.username})`}
                            aria-label={`Remove ${m.name}`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. DIRECT MESSAGES VIEW (PDF-Compliant Clean 2-Column Layout) */}
          {activeTab === 'messages' && (
            <div className={`dm-workspace ${mobileDmView === 'chat' ? 'show-chat-mobile' : 'show-list-mobile'}`}>
              {/* Left DM Conversations List */}
              <div className="dm-conversations-list">
                <div className="dm-sidebar-header">
                  <h3>Direct Messages</h3>
                  <button
                    type="button"
                    className="btn-new-dm"
                    onClick={() => {
                      setNewDmError('');
                      setIsNewDmModalOpen(true);
                    }}
                    title="Start new conversation or group"
                    aria-label="Start new conversation or group"
                  >
                    ✏️
                  </button>
                </div>

                <div className="dm-search-wrap">
                  <span className="dm-search-icon">🔍</span>
                  <input
                    type="text"
                    placeholder="Find conversation..."
                    value={dmSearchQuery}
                    onChange={(e) => setDmSearchQuery(e.target.value)}
                    aria-label="Find conversation"
                  />
                  {dmSearchQuery && (
                    <button
                      type="button"
                      className="dm-search-clear"
                      onClick={() => setDmSearchQuery('')}
                      aria-label="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="dm-list-items">
                  {filteredDirectMessages.length === 0 ? (
                    <div className="dm-empty-filter">
                      <span>No conversations match "{dmSearchQuery}"</span>
                    </div>
                  ) : (
                    filteredDirectMessages.map(dm => (
                      <div
                        key={dm.id}
                        className={`dm-list-item ${activeDm?.id === dm.id ? 'active' : ''}`}
                        onClick={() => {
                          setActiveDmId(dm.id);
                          setMobileDmView('chat');
                          setDmMessageSearchQuery('');
                          setDmReplyingTo(null);
                        }}
                      >
                        <div className="dm-avatar">
                          <span>{dm.avatarText}</span>
                          {!dm.isGroup && <span className={`status-dot ${dm.status?.toLowerCase() || 'offline'}`} />}
                        </div>
                        <div className="dm-item-details">
                          <div className="dm-item-name-row">
                            <span className="dm-item-name">{dm.name}</span>
                            {dm.unreadCount > 0 && <span className="dm-unread-badge">{dm.unreadCount}</span>}
                          </div>
                          <span className="dm-last-snippet">
                            {dm.messages[dm.messages.length - 1]?.content || (dm.isGroup ? `${dm.participants?.length || 2} members` : 'Start conversation')}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right DM Chat Area (Direct and Clean - Friends bloat removed) */}
              <div className="dm-chat-area">
                {activeDm ? (
                  <>
                    <div className="dm-header">
                      <div className="dm-header-left">
                        {/* Mobile back to conversation list button */}
                        <button
                          type="button"
                          className="btn-dm-back-mobile"
                          onClick={() => setMobileDmView('list')}
                          aria-label="Back to conversations"
                          title="Back to conversations"
                        >
                          ←
                        </button>
                        <span className="dm-avatar-small">{activeDm.avatarText}</span>
                        <div className="dm-header-info">
                          <div className="dm-header-title">{activeDm.name}</div>
                          <div className="dm-header-sub">
                            {activeDm.isGroup
                              ? `Group • ${activeDm.participants.join(', ')}`
                              : `@${activeDm.username} • ${activeDm.status || 'Offline'}`}
                          </div>
                        </div>
                      </div>

                      {/* In-Chat Message Search */}
                      <div className="dm-header-right">
                        <div className="dm-msg-search-box">
                          <span className="dm-msg-search-icon">🔍</span>
                          <input
                            type="text"
                            placeholder="Search in chat..."
                            value={dmMessageSearchQuery}
                            onChange={(e) => setDmMessageSearchQuery(e.target.value)}
                            aria-label="Search messages in conversation"
                          />
                          {dmMessageSearchQuery && (
                            <button
                              type="button"
                              className="dm-search-clear"
                              onClick={() => setDmMessageSearchQuery('')}
                              aria-label="Clear in-chat search"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* In-chat search status indicator banner */}
                    {dmMessageSearchQuery && (
                      <div className="dm-search-results-banner">
                        <span>Showing search results for "<strong>{dmMessageSearchQuery}</strong>" ({activeDmMessages.length} found)</span>
                        <button type="button" onClick={() => setDmMessageSearchQuery('')}>Clear</button>
                      </div>
                    )}

                    {/* DM Messages Feed */}
                    <div className="dm-messages-feed">
                      {activeDmMessages.length === 0 ? (
                        <div className="dm-messages-empty">
                          {dmMessageSearchQuery ? (
                            <p>No messages match your search query "{dmMessageSearchQuery}".</p>
                          ) : (
                            <div className="dm-conversation-start-card">
                              <span className="dm-start-avatar">{activeDm.avatarText}</span>
                              <h4>{activeDm.name}</h4>
                              <p>
                                {activeDm.isGroup
                                  ? `This is the start of the ${activeDm.name} group conversation.`
                                  : `This is the beginning of your direct message history with @${activeDm.username}.`}
                              </p>
                              <span className="dm-start-sub">Send a friendly greeting or share an attachment below.</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        activeDmMessages.map(m => {
                          const isOwn = m.senderId === currentUser.id;
                          const parentMessage = m.replyTo
                            ? activeDm.messages.find(orig => orig.id === m.replyTo) || m.replySnippet
                            : null;
                          const isEditingThis = editingDmMessageId === m.id;

                          return (
                            <div
                              key={m.id}
                              className={`dm-message-row ${isOwn ? 'sent' : 'received'}`}
                            >
                              <div className="dm-bubble">
                                {/* Replied-to Quote Snippet */}
                                {parentMessage && (
                                  <div className="dm-quoted-reply">
                                    <span className="dm-quoted-reply-icon">↳</span>
                                    <span className="dm-quoted-sender">@{parentMessage.senderName}</span>
                                    <span className="dm-quoted-text">
                                      {typeof parentMessage.content === 'string' ? parentMessage.content.slice(0, 70) : ''}
                                    </span>
                                  </div>
                                )}

                                <div className="dm-sender-tag">
                                  <span className="dm-sender-name">{m.senderName}</span>
                                  <span className="dm-timestamp">{m.timestamp}</span>
                                  {m.isEdited && <span className="dm-edited-tag">(edited)</span>}
                                  {isOwn && (
                                    <span className="dm-delivery-status" title="Delivered">
                                      ✓✓ Delivered
                                    </span>
                                  )}
                                </div>

                                {isEditingThis ? (
                                  <div className="dm-inline-edit-box">
                                    <input
                                      type="text"
                                      className="dm-inline-edit-input"
                                      value={editingDmContent}
                                      onChange={(e) => setEditingDmContent(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEditDmMessage(m.id);
                                        if (e.key === 'Escape') setEditingDmMessageId(null);
                                      }}
                                      autoFocus
                                    />
                                    <div className="dm-inline-edit-buttons">
                                      <button
                                        type="button"
                                        className="btn-dm-save-edit"
                                        onClick={() => handleSaveEditDmMessage(m.id)}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        className="btn-dm-cancel-edit"
                                        onClick={() => setEditingDmMessageId(null)}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                    <span className="dm-edit-key-hint">Press Enter to save, Escape to cancel</span>
                                  </div>
                                ) : (
                                  <div className="dm-content-text">
                                    {renderMessageTextWithMentions(m.content)}
                                  </div>
                                )}

                                {/* Attachments */}
                                {m.attachments && m.attachments.length > 0 && (
                                  <div className="dm-attachments-container">
                                    {m.attachments.map((att, idx) => (
                                      <div key={idx} className="dm-attachment-badge">
                                        <span className="att-file-icon">📎</span>
                                        <div className="att-meta">
                                          <span className="att-file-name">{att.name}</span>
                                          <span className="att-file-size">{att.size}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Reaction Pills */}
                                {m.reactions && Object.keys(m.reactions).length > 0 && (
                                  <div className="dm-reactions-row">
                                    {Object.entries(m.reactions).map(([emoji, count]) => {
                                      const userReacted = Array.isArray(m.userReactions) && m.userReactions.includes(emoji);
                                      return (
                                        <button
                                          key={emoji}
                                          type="button"
                                          className={`dm-reaction-pill ${userReacted ? 'active' : ''}`}
                                          onClick={() => handleToggleDmReaction(m.id, emoji)}
                                          title={`React with ${emoji}`}
                                        >
                                          <span className="dm-reaction-emoji">{emoji}</span>
                                          <span className="dm-reaction-count">{count}</span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Hover Action Bar */}
                                <div className="dm-msg-hover-toolbar">
                                  <button
                                    type="button"
                                    className="dm-toolbar-btn"
                                    onClick={() => setDmReplyingTo(m)}
                                    title="Reply"
                                    aria-label="Reply to message"
                                  >
                                    ↩️
                                  </button>
                                  <button
                                    type="button"
                                    className="dm-toolbar-btn"
                                    onClick={() => handleToggleDmReaction(m.id, '👍')}
                                    title="Thumbs up"
                                    aria-label="React thumbs up"
                                  >
                                    👍
                                  </button>
                                  <button
                                    type="button"
                                    className="dm-toolbar-btn"
                                    onClick={() => handleToggleDmReaction(m.id, '❤️')}
                                    title="Heart"
                                    aria-label="React heart"
                                  >
                                    ❤️
                                  </button>
                                  <button
                                    type="button"
                                    className="dm-toolbar-btn"
                                    onClick={() => handleToggleDmReaction(m.id, '🔥')}
                                    title="Fire"
                                    aria-label="React fire"
                                  >
                                    🔥
                                  </button>
                                  {isOwn && (
                                    <>
                                      <button
                                        type="button"
                                        className="dm-toolbar-btn"
                                        onClick={() => handleStartEditDmMessage(m)}
                                        title="Edit message"
                                        aria-label="Edit message"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        type="button"
                                        className="dm-toolbar-btn danger"
                                        onClick={() => handleDeleteDmMessage(m.id)}
                                        title="Delete message"
                                        aria-label="Delete message"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Reply Preview Banner */}
                    {dmReplyingTo && (
                      <div className="dm-reply-preview-bar">
                        <div className="dm-reply-preview-content">
                          <span className="reply-preview-icon">↩️</span>
                          <span>
                            Replying to <strong>@{dmReplyingTo.senderName}</strong>: "{dmReplyingTo.content.slice(0, 60)}{dmReplyingTo.content.length > 60 ? '...' : ''}"
                          </span>
                        </div>
                        <button
                          type="button"
                          className="btn-close-reply"
                          onClick={() => setDmReplyingTo(null)}
                          aria-label="Cancel reply"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Attachment Preview Banner */}
                    {dmAttachedFile && (
                      <div className="dm-file-preview-bar">
                        <div className="dm-file-preview-content">
                          <span className="file-preview-icon">📎</span>
                          <span className="file-preview-name">{dmAttachedFile.name} ({Math.round(dmAttachedFile.size / 1024)} KB)</span>
                        </div>
                        <button
                          type="button"
                          className="btn-close-file-preview"
                          onClick={() => setDmAttachedFile(null)}
                          aria-label="Remove attachment"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* DM Input Form */}
                    <form className="dm-input-form" onSubmit={handleSendDm}>
                      <label className="btn-dm-attach-file" title="Attach a file">
                        <input
                          type="file"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setDmAttachedFile(e.target.files[0]);
                            }
                          }}
                        />
                        📎
                      </label>
                      <input
                        type="text"
                        placeholder={`Message ${activeDm.name}... (type @ to mention)`}
                        value={dmInputText}
                        onChange={(e) => setDmInputText(e.target.value)}
                      />
                      <button type="submit" disabled={!dmInputText.trim() && !dmAttachedFile}>
                        Send ✈
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="dm-no-active-conversation">
                    <span className="empty-icon">💬</span>
                    <h4>Select a conversation</h4>
                    <p>Choose an existing thread from the left or start a new direct message or group conversation.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 6. MODERATOR DASHBOARD VIEW */}
          {activeTab === 'moderation' && (
            <div className="moderation-view">
              <div className="view-banner-header">
                <div>
                  <h2>AI-Assisted Moderator Hub</h2>
                  <p>Smart Community review queue: inspect flagged content, confidence scores, and take decisive action.</p>
                </div>
                <div className="mod-stats-summary">
                  <div className="mod-stat-card">
                    <span className="num alert">{moderationItems.length}</span>
                    <span className="label">Pending Review</span>
                  </div>
                  <div className="mod-stat-card">
                    <span className="num">14</span>
                    <span className="label">Auto-Blocked</span>
                  </div>
                  <div className="mod-stat-card">
                    <span className="num">96%</span>
                    <span className="label">AI Accuracy</span>
                  </div>
                </div>
              </div>

              {/* Flagged Items Review Queue */}
              <div className="mod-queue-section">
                <div className="mod-queue-header-row">
                  <h3>Flagged Messages Queue ({filteredModerationItems.length})</h3>
                  <div className="mod-search-input-wrap">
                    <span className="mod-search-icon" aria-hidden="true">🔍</span>
                    <input
                      type="text"
                      placeholder="Filter by keyword, user, or channel..."
                      value={modSearchQuery}
                      onChange={(e) => setModSearchQuery(e.target.value)}
                      aria-label="Filter moderation queue"
                    />
                    {modSearchQuery && (
                      <button
                        type="button"
                        className="mod-search-clear"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModSearchQuery('');
                        }}
                        aria-label="Clear filter"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>

                <div className="mod-filters-bar" role="group" aria-label="Moderation queue filters">
                  <button
                    type="button"
                    className={`mod-filter-tab ${modFilterTab === 'all' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModFilterTab('all');
                    }}
                    aria-pressed={modFilterTab === 'all'}
                  >
                    <span>All Items</span>
                    <span className="mod-filter-badge">{modFilterCounts.all}</span>
                  </button>
                  <button
                    type="button"
                    className={`mod-filter-tab ${modFilterTab === 'high' ? 'active high' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModFilterTab(prev => (prev === 'high' ? 'all' : 'high'));
                    }}
                    aria-pressed={modFilterTab === 'high'}
                  >
                    <span>🔴 High Severity</span>
                    <span className="mod-filter-badge">{modFilterCounts.high}</span>
                  </button>
                  <button
                    type="button"
                    className={`mod-filter-tab ${modFilterTab === 'medium' ? 'active medium' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModFilterTab(prev => (prev === 'medium' ? 'all' : 'medium'));
                    }}
                    aria-pressed={modFilterTab === 'medium'}
                  >
                    <span>🟡 Medium Severity</span>
                    <span className="mod-filter-badge">{modFilterCounts.medium}</span>
                  </button>
                  <button
                    type="button"
                    className={`mod-filter-tab ${modFilterTab === 'spam' ? 'active spam' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModFilterTab(prev => (prev === 'spam' ? 'all' : 'spam'));
                    }}
                    aria-pressed={modFilterTab === 'spam'}
                  >
                    <span>🚫 Spam & Phishing</span>
                    <span className="mod-filter-badge">{modFilterCounts.spam}</span>
                  </button>
                  <button
                    type="button"
                    className={`mod-filter-tab ${modFilterTab === 'harassment' ? 'active harassment' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModFilterTab(prev => (prev === 'harassment' ? 'all' : 'harassment'));
                    }}
                    aria-pressed={modFilterTab === 'harassment'}
                  >
                    <span>⚠️ Harassment</span>
                    <span className="mod-filter-badge">{modFilterCounts.harassment}</span>
                  </button>
                </div>

                {filteredModerationItems.length === 0 ? (
                  <div className="empty-mod-state">
                    <span>{modFilterTab !== 'all' || modSearchQuery ? '🔍' : '🎉'}</span>
                    <h4>
                      {modFilterTab !== 'all' || modSearchQuery
                        ? 'No messages match this filter'
                        : 'All caught up!'}
                    </h4>
                    <p>
                      {modFilterTab !== 'all' || modSearchQuery
                        ? `No flagged messages match ${
                            modFilterTab === 'high'
                              ? 'High Severity'
                              : modFilterTab === 'medium'
                              ? 'Medium Severity'
                              : modFilterTab === 'spam'
                              ? 'Spam & Phishing'
                              : modFilterTab === 'harassment'
                              ? 'Harassment'
                              : 'the current search query'
                          }${modSearchQuery ? ` ("${modSearchQuery}")` : ''}.`
                        : 'No flagged messages currently require review. Community is safe and clean.'}
                    </p>
                    {(modFilterTab !== 'all' || modSearchQuery) && (
                      <button
                        type="button"
                        className="btn-mod-reset-filter"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModFilterTab('all');
                          setModSearchQuery('');
                        }}
                      >
                        Reset to All Items
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="mod-items-list">
                    {filteredModerationItems.map(item => (
                      <div key={item.id} className={`mod-card ${item.aiSeverity.toLowerCase()}`}>
                        <div className="mod-card-header">
                          <div className="mod-sender-info">
                            <div className="mod-user-avatar-badge">👤</div>
                            <div>
                              <strong>{item.senderName}</strong> <span className="username-tag">(@{item.senderUsername})</span>
                              <div className="mod-context">{item.communityName} • {item.channelName} • {item.reportedAt}</div>
                            </div>
                          </div>
                          <div className="mod-ai-tags">
                            <span className={`ai-severity-badge ${item.aiSeverity.toLowerCase()}`}>
                              {item.aiSeverity} Severity
                            </span>
                            <span className="ai-score-badge">
                              {item.confidence}% Confidence
                            </span>
                            <span className="ai-class-badge">{item.classification}</span>
                          </div>
                        </div>

                        <div className="mod-message-quote">
                          "{item.messageText}"
                        </div>

                        <div className="mod-actions-bar">
                          <button
                            type="button"
                            className="btn-mod approve"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModerationAction(item, 'approve');
                            }}
                          >
                            ✓ Approve (Safe)
                          </button>
                          <button
                            type="button"
                            className="btn-mod delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModerationAction(item, 'delete');
                            }}
                          >
                            🗑 Delete Message
                          </button>
                          <button
                            type="button"
                            className="btn-mod warn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModerationAction(item, 'warn');
                            }}
                          >
                            ⚠️ Warn User
                          </button>
                          <button
                            type="button"
                            className="btn-mod ban"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleModerationAction(item, 'ban');
                            }}
                          >
                            🚫 Ban Member
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Logs Table */}
              <div className="mod-audit-section">
                <h3>Recent Moderation Audit Logs</h3>
                <div className="audit-table-wrapper">
                  <table className="audit-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Moderator</th>
                        <th>Action</th>
                        <th>Target User</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => {
                        const actionLower = log.action.toLowerCase();
                        const tagClass = actionLower.includes('approve')
                          ? 'approved'
                          : actionLower.includes('delete')
                            ? 'deleted'
                            : actionLower.includes('warn')
                              ? 'warned'
                              : 'banned';
                        return (
                          <tr key={log.id}>
                            <td>{log.timestamp}</td>
                            <td><strong>{log.moderator}</strong></td>
                            <td><span className={`audit-action-tag ${tagClass}`}>{log.action}</span></td>
                            <td><code>{log.target}</code></td>
                            <td>{log.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 7. NOTIFICATIONS VIEW */}
          {activeTab === 'notifications' && (
            <div className="notifications-view">
              <div className="view-banner-header">
                <div>
                  <h2>Notifications</h2>
                  <p>Stay informed about mentions, replies, invitations, and alerts.</p>
                </div>
                <button
                  type="button"
                  className="btn-secondary-outline"
                  onClick={handleMarkAllNotificationsRead}
                >
                  Mark All as Read
                </button>
              </div>

              <div className="notifications-feed">
                {notifications.map(notif => (
                  <div key={notif.id} className={`notification-card ${notif.isRead ? 'read' : 'unread'}`}>
                    <div className="notif-icon-col">
                      {notif.type === 'mention' && '💬'}
                      {notif.type === 'dm' && '✉️'}
                      {notif.type === 'invite' && '🎉'}
                      {notif.type === 'moderation' && '🛡️'}
                    </div>
                    <div className="notif-body">
                      <div className="notif-title-row">
                        <span className="notif-title">{notif.title}</span>
                        <span className="notif-time">{notif.time}</span>
                      </div>
                      <p className="notif-desc">{notif.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. PROFILE & SETTINGS VIEW */}
          {activeTab === 'settings' && (
            <div className="settings-view">
              <div className="view-banner-header">
                <div>
                  <h2>Account & Community Settings</h2>
                  <p>Manage your profile info, notification preferences, and privacy controls.</p>
                </div>
              </div>

              <div className="settings-grid">
                {/* Profile Form */}
                <div className="settings-card">
                  <h3>Edit Profile</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSaveProfile(currentUser);
                    }}
                  >
                    <div className="settings-input-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={currentUser.name}
                        onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                      />
                    </div>

                    <div className="settings-input-group">
                      <label>Username</label>
                      <input
                        type="text"
                        value={currentUser.username}
                        onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
                      />
                    </div>

                    <div className="settings-input-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={currentUser.email}
                        onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                      />
                    </div>

                    <div className="settings-input-group">
                      <label>College / Course</label>
                      <input
                        type="text"
                        value={currentUser.college}
                        onChange={(e) => setCurrentUser({ ...currentUser, college: e.target.value })}
                      />
                    </div>

                    <div className="settings-input-group">
                      <label>Bio / About Me</label>
                      <textarea
                        rows={3}
                        value={currentUser.bio}
                        onChange={(e) => setCurrentUser({ ...currentUser, bio: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn-save-settings">
                      Save Profile Changes
                    </button>
                  </form>
                </div>

                {/* Notifications & Privacy Settings */}
                <div className="settings-side-col">
                  <div className="settings-card">
                    <h3>Notification Preferences</h3>
                    <div className="toggle-list">
                      <label className="toggle-row">
                        <span>Direct Message Notifications</span>
                        <input
                          type="checkbox"
                          checked={currentUser.notificationPreferences.directMessages}
                          onChange={(e) => setCurrentUser({
                            ...currentUser,
                            notificationPreferences: { ...currentUser.notificationPreferences, directMessages: e.target.checked }
                          })}
                        />
                      </label>
                      <label className="toggle-row">
                        <span>@Mention Alerts</span>
                        <input
                          type="checkbox"
                          checked={currentUser.notificationPreferences.channelMentions}
                          onChange={(e) => setCurrentUser({
                            ...currentUser,
                            notificationPreferences: { ...currentUser.notificationPreferences, channelMentions: e.target.checked }
                          })}
                        />
                      </label>
                      <label className="toggle-row">
                        <span>Community Announcements</span>
                        <input
                          type="checkbox"
                          checked={currentUser.notificationPreferences.communityAnnouncements}
                          onChange={(e) => setCurrentUser({
                            ...currentUser,
                            notificationPreferences: { ...currentUser.notificationPreferences, communityAnnouncements: e.target.checked }
                          })}
                        />
                      </label>
                      <label className="toggle-row">
                        <span>Sound Alerts</span>
                        <input
                          type="checkbox"
                          checked={currentUser.notificationPreferences.soundAlerts}
                          onChange={(e) => setCurrentUser({
                            ...currentUser,
                            notificationPreferences: { ...currentUser.notificationPreferences, soundAlerts: e.target.checked }
                          })}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="settings-card">
                    <h3>Privacy & Security</h3>
                    <div className="settings-input-group">
                      <label>Who can send you Direct Messages?</label>
                      <select
                        value={currentUser.privacySettings.dmPermission}
                        onChange={(e) => setCurrentUser({
                          ...currentUser,
                          privacySettings: { ...currentUser.privacySettings, dmPermission: e.target.value }
                        })}
                      >
                        <option value="Everyone">Everyone</option>
                        <option value="Community Members">Community Members</option>
                        <option value="Nobody">Nobody</option>
                      </select>
                    </div>
                    <label className="toggle-row">
                      <span>Show Online Status</span>
                      <input
                        type="checkbox"
                        checked={currentUser.privacySettings.showOnlineStatus}
                        onChange={(e) => setCurrentUser({
                          ...currentUser,
                          privacySettings: { ...currentUser.privacySettings, showOnlineStatus: e.target.checked }
                        })}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* =========================================================
          MODALS: 2-Step Create Server, Create Channel, Guidelines, Analytics
          ========================================================= */}
      {/* 1. CREATE SERVER MODAL (2-Step matching Server.png & Server (1).png) */}
      {isCreateModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => { setIsCreateModalOpen(false); setCreateServerStep(1); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="server-modal-title"
        >
          <div className="dashboard-modal-card server-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="server-modal-header">
              <button
                type="button"
                className="btn-server-modal-close"
                onClick={() => { setIsCreateModalOpen(false); setCreateServerStep(1); }}
                aria-label="Close dialog"
              >
                ✕
              </button>

              <div className="server-step-indicator-wrap">
                <span className="server-step-badge">
                  {createServerStep === 1 ? 'Step 1 of 2: Choose Template' : 'Step 2 of 2: Server Details'}
                </span>
              </div>

              {createServerStep === 1 ? (
                <>
                  <h3 id="server-modal-title" className="server-modal-title">Create Your Server</h3>
                  <p className="server-modal-subtitle">
                    Your server is where you and your friends hang out. Make yours and start talking.
                  </p>
                </>
              ) : (
                <>
                  <h3 id="server-modal-title" className="server-modal-title">Customize Your Server</h3>
                  <p className="server-modal-subtitle">
                    Give your community a home of its own with a name and an avatar.
                  </p>
                </>
              )}
            </div>

            {createServerStep === 1 ? (
              <div className="server-step1-body">
                <div className="server-template-list">
                  {/* Create My Own Card */}
                  <button
                    type="button"
                    className={`server-template-card ${selectedServerTemplate === 'General' ? 'selected' : ''}`}
                    onClick={() => handleSelectTemplate('General')}
                  >
                    <div className="server-template-card-left">
                      <div className="server-template-icon-wrap" aria-hidden="true">
                        💻
                      </div>
                      <div className="server-template-text">
                        <span className="server-template-title">Create My Own</span>
                        <span className="server-template-desc">Start from scratch with a custom blank canvas</span>
                      </div>
                    </div>
                    <span className="server-template-chevron" aria-hidden="true">›</span>
                  </button>

                  <div className="server-template-category-divider">
                    <span>START FROM A TEMPLATE</span>
                  </div>

                  {/* Template Cards */}
                  {SERVER_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.key}
                      type="button"
                      className={`server-template-card ${selectedServerTemplate === tmpl.key ? 'selected' : ''}`}
                      onClick={() => handleSelectTemplate(tmpl.key)}
                    >
                      <div className="server-template-card-left">
                        <div className="server-template-icon-wrap" aria-hidden="true">
                          {tmpl.icon}
                        </div>
                        <div className="server-template-text">
                          <span className="server-template-title">{tmpl.title}</span>
                          <span className="server-template-desc">{tmpl.desc}</span>
                        </div>
                      </div>
                      <span className="server-template-chevron" aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>

                <div className="server-invite-footer-card">
                  <div className="server-invite-footer-text">Have an invite already?</div>
                  <button
                    type="button"
                    className="btn-server-join-gray"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      setCreateServerStep(1);
                      setIsJoinModalOpen(true);
                    }}
                  >
                    Join a Server
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateCommunitySubmit} className="server-step2-form">
                {/* Active Template Bar */}
                <div className="server-template-active-bar">
                  <span className="server-template-active-label">
                    Selected Template: <strong>{selectedServerTemplate === 'General' ? 'Custom / Create My Own' : selectedServerTemplate}</strong>
                  </span>
                  <button
                    type="button"
                    className="btn-server-change-template"
                    onClick={() => setCreateServerStep(1)}
                  >
                    Change Template
                  </button>
                </div>

                {/* Avatar Preview */}
                <div className="server-avatar-center-wrap">
                  <div
                    className="server-avatar-preview-circle"
                    title="Selected server avatar"
                    aria-label={`Current avatar is ${selectedServerAvatar}`}
                  >
                    <span className="server-avatar-main-emoji">{selectedServerAvatar}</span>
                    <span className="server-avatar-plus-badge" title="Preset selected" aria-hidden="true">
                      +
                    </span>
                  </div>
                  <span className="server-avatar-caption">Selected Server Icon</span>
                </div>

                {/* Avatar Presets */}
                <div className="server-avatar-selector-section">
                  <div className="server-field-header">
                    <span className="server-field-label">CHOOSE PRESET AVATAR</span>
                    <span className="server-field-count">12 icons</span>
                  </div>
                  <div className="server-avatar-grid-chips" role="radiogroup" aria-label="Server avatars">
                    {AVATAR_PRESETS.map((item) => {
                      const isSelected = selectedServerAvatar === item.emoji;
                      return (
                        <button
                          key={item.emoji}
                          type="button"
                          className={`server-avatar-chip ${isSelected ? 'selected' : ''}`}
                          style={{
                            backgroundColor: item.bg,
                            borderColor: isSelected ? 'var(--color-ink-black)' : item.border
                          }}
                          onClick={() => setSelectedServerAvatar(item.emoji)}
                          title={`${item.label} (${item.emoji})`}
                          aria-label={`Select ${item.label} avatar`}
                          aria-checked={isSelected}
                          role="radio"
                        >
                          <span className="server-avatar-chip-emoji">{item.emoji}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Server Name Field */}
                <div className="server-field-group">
                  <label htmlFor="server-name-input" className="server-field-label">
                    SERVER NAME <span className="server-required-star">*</span>
                  </label>
                  <input
                    id="server-name-input"
                    type="text"
                    className="server-name-input-control"
                    placeholder="Enter server name"
                    required
                    maxLength={60}
                    value={newCommunityForm.name}
                    onChange={(e) => setNewCommunityForm(prev => ({ ...prev, name: e.target.value }))}
                    autoFocus
                  />
                  {!newCommunityForm.name.trim() && (
                    <span className="server-field-validation-msg">Server name is required.</span>
                  )}
                </div>

                {/* Starter Channels Preview */}
                <div className="server-starter-channels-box">
                  <div className="server-starter-channels-header">
                    <span className="server-starter-channels-label">DEFAULT CHANNELS PREVIEW</span>
                    <span className="server-starter-channels-count">
                      {getTemplateDefaultChannels(selectedServerTemplate).length} channels
                    </span>
                  </div>
                  <div className="server-starter-channels-pills">
                    {getTemplateDefaultChannels(selectedServerTemplate).map((chName) => (
                      <span key={chName} className="server-channel-pill">
                        <span className="server-channel-hash">#</span>
                        <span className="server-channel-name">{chName}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Guidelines Disclaimer */}
                <p className="server-guidelines-disclaimer">
                  By creating a server, you agree to Yappy's{' '}
                  <button
                    type="button"
                    className="server-guidelines-link-btn"
                    onClick={() => setIsGuidelinesModalOpen(true)}
                  >
                    Community Guidelines
                  </button>
                  .
                </p>

                {/* Footer Action Buttons */}
                {createCommunityError && (
                  <div className="modal-error-banner" style={{ margin: '0.75rem 0' }}>
                    ⚠️ {createCommunityError}
                  </div>
                )}
                <div className="server-step2-actions">
                  <button
                    type="button"
                    className="btn-server-back"
                    onClick={() => setCreateServerStep(1)}
                  >
                    Back
                  </button>
                  <div className="server-step2-actions-right">
                    <button
                      type="button"
                      className="btn-modal-cancel"
                      onClick={() => { setIsCreateModalOpen(false); setCreateServerStep(1); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-server-create-green"
                      disabled={!newCommunityForm.name.trim() || isCreatingCommunity}
                    >
                      {isCreatingCommunity ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. CREATE TEXT CHANNEL MODAL */}
      {isCreateChannelModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateChannelModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Text Channel</h3>
              <button type="button" onClick={() => setIsCreateChannelModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateChannelSubmit}>
              {createChannelError && (
                <div className="modal-error-banner">
                  ⚠️ {createChannelError}
                </div>
              )}
              <div className="modal-form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. project-discussions"
                  required
                  value={newChannelForm.name}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, name: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Topic / Description</label>
                <input
                  type="text"
                  placeholder="What is this channel about?"
                  value={newChannelForm.topic}
                  onChange={(e) => setNewChannelForm({ ...newChannelForm, topic: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Channel Type</label>
                <select
                  value={newChannelForm.isAnnouncement ? 'announcement' : 'text'}
                  onChange={(e) =>
                    setNewChannelForm({
                      ...newChannelForm,
                      isAnnouncement: e.target.value === 'announcement',
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-soft-border)',
                    background: 'var(--color-warm-cream)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="text">💬 Text Channel</option>
                  <option value="announcement">📢 Announcement Channel</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsCreateChannelModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={!newChannelForm.name.trim() || isCreatingChannel}>
                  {isCreatingChannel ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CHANNEL MODAL */}
      {isEditChannelModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsEditChannelModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit #{editingChannel?.name}</h3>
              <button type="button" onClick={() => setIsEditChannelModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleUpdateChannelSubmit}>
              {updateChannelError && (
                <div className="modal-error-banner">
                  ⚠️ {updateChannelError}
                </div>
              )}
              <div className="modal-form-group">
                <label>Channel Name</label>
                <input
                  type="text"
                  placeholder="e.g. project-discussions"
                  required
                  value={editChannelForm.name}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, name: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Topic / Description</label>
                <input
                  type="text"
                  placeholder="What is this channel about?"
                  value={editChannelForm.topic}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, topic: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Channel Type</label>
                <select
                  value={editChannelForm.type}
                  onChange={(e) => setEditChannelForm({ ...editChannelForm, type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '8px',
                    border: '1px solid var(--color-soft-border)',
                    background: 'var(--color-warm-cream)',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="text">💬 Text Channel</option>
                  <option value="announcement">📢 Announcement Channel</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsEditChannelModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit" disabled={!editChannelForm.name.trim() || isUpdatingChannel}>
                  {isUpdatingChannel ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CHANNEL MODAL */}
      {isDeleteChannelModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsDeleteChannelModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ color: '#E53E3E' }}>Delete Channel #{deletingChannel?.name}</h3>
              <button type="button" onClick={() => setIsDeleteChannelModalOpen(false)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              {deleteChannelError && (
                <div className="modal-error-banner">
                  ⚠️ {deleteChannelError}
                </div>
              )}
              <p style={{ fontSize: '0.9rem', color: 'var(--color-ink-black)', marginBottom: '0.5rem' }}>
                Are you sure you want to delete <strong>#{deletingChannel?.name}</strong>?
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted-grey)' }}>
                This action is permanent and cannot be undone. All messages in this channel will be removed.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-modal-cancel" onClick={() => setIsDeleteChannelModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleDeleteChannelConfirm}
                disabled={isDeletingChannel}
              >
                {isDeletingChannel ? 'Deleting...' : 'Delete Channel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMMUNITY GUIDELINES & RULES MODAL */}
      {isGuidelinesModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsGuidelinesModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeCommunity?.name} • Guidelines & Rules</h3>
              <button type="button" onClick={() => setIsGuidelinesModalOpen(false)}>×</button>
            </div>
            <div className="guidelines-card-content">
              {isEditingGuidelines ? (
                <textarea
                  rows={8}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--color-soft-border)', fontSize: '0.8125rem', lineHeight: '1.5' }}
                  value={communityGuidelines}
                  onChange={(e) => setCommunityGuidelines(e.target.value)}
                />
              ) : (
                <div>
                  <div className="guidelines-rule-item">
                    <strong>1. Be Respectful & Constructive</strong>
                    Treat all community members with courtesy. Harassment, threats, and hate speech are strictly prohibited.
                  </div>
                  <div className="guidelines-rule-item">
                    <strong>2. Stay On Topic</strong>
                    Post content and discussions in the appropriate channels to keep the space organized.
                  </div>
                  <div className="guidelines-rule-item">
                    <strong>3. Safe & Legal Content Only</strong>
                    Do not upload malicious files, pirated content, or unauthorized private information.
                  </div>
                  <div className="guidelines-rule-item">
                    <strong>4. AI Moderation & Human Review</strong>
                    Messages are analyzed by our AI safety model. Flagged messages are reviewed by community moderators.
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              {canManageMembers ? (
                <>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsEditingGuidelines(!isEditingGuidelines)}
                  >
                    {isEditingGuidelines ? 'Cancel Edit' : 'Edit Rules'}
                  </button>
                  <button
                    type="button"
                    className="btn-modal-submit"
                    onClick={() => {
                      setIsEditingGuidelines(false);
                      setIsGuidelinesModalOpen(false);
                      triggerToast('Guidelines saved and published to community!');
                    }}
                  >
                    {isEditingGuidelines ? 'Save & Publish' : 'Done'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn-modal-submit"
                  onClick={() => setIsGuidelinesModalOpen(false)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. SERVER ANALYTICS MODAL */}
      {isAnalyticsModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAnalyticsModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeCommunity?.name} • Analytics</h3>
              <button type="button" onClick={() => setIsAnalyticsModalOpen(false)}>×</button>
            </div>
            <div className="analytics-stat-grid">
              <div className="analytics-box">
                <span className="analytics-box-num">{activeCommunity?.membersCount || 0}</span>
                <span className="analytics-box-label">Total Members</span>
              </div>
              <div className="analytics-box">
                <span className="analytics-box-num">{activeCommunity?.channels?.length || 0}</span>
                <span className="analytics-box-label">Active Channels</span>
              </div>
              <div className="analytics-box">
                <span className="analytics-box-num">
                  {Object.values(channelMessages).reduce((acc, msgs) => acc + (msgs?.length || 0), 0)}
                </span>
                <span className="analytics-box-label">Message Volume</span>
              </div>
              <div className="analytics-box">
                <span className="analytics-box-num">{moderationItems.length}</span>
                <span className="analytics-box-label">Moderation Flags</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted-grey)', margin: '0 0 1rem 0' }}>
              Real-time community telemetry: message traffic, active member participation, and AI moderation review counts.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-submit"
                onClick={() => setIsAnalyticsModalOpen(false)}
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}

      {isJoinModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsJoinModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Join with Invite Code</h3>
              <button type="button" onClick={() => setIsJoinModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleJoinWithCodeSubmit}>
              <div className="modal-form-group">
                <label>Invitation Code or Link</label>
                <input
                  type="text"
                  placeholder="e.g. SMART-JAVA-2026 or paste link"
                  required
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                />
              </div>
              <p className="modal-tip">
                Tip: Ask a community admin or member for their invite code to join private hubs.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsJoinModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Join Community
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Community Member */}
      {isAddMemberModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Community Member</h3>
              <button type="button" onClick={() => setIsAddMemberModalOpen(false)} aria-label="Close modal">×</button>
            </div>

            {/* Quick Invite Code Sharing Box */}
            <div className="modal-invite-box">
              <div className="modal-invite-label">Community Invite Code</div>
              <div className="modal-invite-row">
                <input
                  type="text"
                  readOnly
                  className="modal-invite-input"
                  value={activeCommunity?.inviteCode || `${activeCommunity?.slug?.toUpperCase() || activeCommunity?.name?.replace(/\s+/g, '').toUpperCase()}-2026`}
                />
                <button
                  type="button"
                  className="btn-copy-invite"
                  onClick={handleCopyInviteCode}
                >
                  {inviteCopied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="modal-invite-hint">Anyone with this code can join {activeCommunity?.name}.</p>
            </div>

            <div className="modal-divider-text">
              <span>OR ADD MEMBER DIRECTLY</span>
            </div>

            {addMemberError && (
              <div className="modal-error-alert" role="alert">
                ⚠️ {addMemberError}
              </div>
            )}

            <form onSubmit={handleAddMemberSubmit}>
              <div className="modal-form-group">
                <label htmlFor="member-name-input">Full Name *</label>
                <input
                  id="member-name-input"
                  type="text"
                  placeholder="e.g. Aditi Rao"
                  required
                  value={addMemberForm.name}
                  onChange={(e) => {
                    setAddMemberForm({ ...addMemberForm, name: e.target.value });
                    if (addMemberError) setAddMemberError('');
                  }}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="member-username-input">Username *</label>
                <input
                  id="member-username-input"
                  type="text"
                  placeholder="e.g. aditi_r"
                  required
                  value={addMemberForm.username}
                  onChange={(e) => {
                    setAddMemberForm({ ...addMemberForm, username: e.target.value });
                    if (addMemberError) setAddMemberError('');
                  }}
                />
              </div>
              <div className="modal-form-group">
                <label htmlFor="member-role-select">Role</label>
                <select
                  id="member-role-select"
                  value={addMemberForm.role}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
                >
                  <option value="Member">Member</option>
                  {isCommunityOwner && <option value="Admin">Admin</option>}
                </select>
              </div>
              <div className="modal-form-group">
                <label htmlFor="member-email-input">Email (Optional)</label>
                <input
                  id="member-email-input"
                  type="email"
                  placeholder="e.g. aditi@smartcommunity.org"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm({ ...addMemberForm, email: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsAddMemberModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Remove Member */}
      {memberToRemove && (
        <div className="modal-backdrop" onClick={() => setMemberToRemove(null)}>
          <div className="dashboard-modal-card remove-member-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Remove Member</h3>
              <button type="button" onClick={() => setMemberToRemove(null)} aria-label="Close modal">×</button>
            </div>

            <div className="modal-confirm-body">
              <div className="remove-target-card">
                <div className="member-avatar">
                  <span>{memberToRemove.avatarText}</span>
                </div>
                <div>
                  <strong>{memberToRemove.name}</strong>
                  <span className="remove-target-username"> (@{memberToRemove.username})</span>
                  <div className="remove-target-role">Role: {memberToRemove.role}</div>
                </div>
              </div>

              <p className="modal-confirm-warning">
                Are you sure you want to remove <strong>{memberToRemove.name}</strong> from <strong>{activeCommunity?.name}</strong>?
                They will immediately lose access to all channels, shared files, and private community discussions.
              </p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setMemberToRemove(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-delete"
                onClick={handleConfirmRemoveMember}
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          NEW CONVERSATION / GROUP CHAT MODAL (PDF-Compliant DM)
          ========================================================= */}
      {isNewDmModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsNewDmModalOpen(false)}>
          <div className="modal-content server-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Start a New Conversation</h3>
              <button
                type="button"
                className="btn-close-modal"
                onClick={() => setIsNewDmModalOpen(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateConversation}>
              <div className="modal-body">
                {newDmError && (
                  <div className="modal-error-banner" role="alert" style={{ marginBottom: '1rem', padding: '0.65rem 0.85rem', backgroundColor: 'rgba(255, 143, 163, 0.2)', border: '1px solid var(--color-candy-pink)', borderRadius: '6px', fontSize: '0.85rem', color: '#8C142E' }}>
                    {newDmError}
                  </div>
                )}

                <div className="conversation-type-toggle">
                  <button
                    type="button"
                    className={`conv-type-btn ${newDmType === 'direct' ? 'active' : ''}`}
                    onClick={() => {
                      setNewDmType('direct');
                      setNewDmError('');
                    }}
                  >
                    👤 Direct Message (1-on-1)
                  </button>
                  <button
                    type="button"
                    className={`conv-type-btn ${newDmType === 'group' ? 'active' : ''}`}
                    onClick={() => {
                      setNewDmType('group');
                      setNewDmError('');
                    }}
                  >
                    👥 Group Conversation
                  </button>
                </div>

                {newDmType === 'direct' ? (
                  <div className="form-group" style={{ marginTop: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-ink-black)' }}>
                      Recipient Username or Name *
                    </label>
                    <input
                      type="text"
                      className="modal-text-input"
                      style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--color-soft-border)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'var(--color-warm-cream)', outline: 'none' }}
                      placeholder="e.g. alex_r, Priya Sharma, or enter username"
                      value={newDmRecipient}
                      onChange={(e) => setNewDmRecipient(e.target.value)}
                      autoFocus
                    />
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted-grey)', marginTop: '0.35rem' }}>
                      Enter the username or name of the person you want to chat with.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="form-group" style={{ marginTop: '1.25rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-ink-black)' }}>
                        Group Name *
                      </label>
                      <input
                        type="text"
                        className="modal-text-input"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--color-soft-border)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'var(--color-warm-cream)', outline: 'none' }}
                        placeholder="e.g. Hackathon Team Alpha, Design Reviewers"
                        value={newDmGroupName}
                        onChange={(e) => setNewDmGroupName(e.target.value)}
                        autoFocus
                      />
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--color-ink-black)' }}>
                        Participants (Comma-separated names or usernames)
                      </label>
                      <input
                        type="text"
                        className="modal-text-input"
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--color-soft-border)', borderRadius: '8px', fontSize: '0.9rem', backgroundColor: 'var(--color-warm-cream)', outline: 'none' }}
                        placeholder="e.g. alex_r, priya_s, David Chen"
                        value={newDmGroupMembers}
                        onChange={(e) => setNewDmGroupMembers(e.target.value)}
                      />
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-muted-grey)', marginTop: '0.35rem' }}>
                        Separate multiple usernames with commas. You are automatically included as a member.
                      </span>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsNewDmModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                >
                  {newDmType === 'direct' ? 'Open Conversation' : 'Create Group Chat'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;