import React, { useState, useMemo, useEffect } from 'react';
import './Dashboard.css';
import topLogo from '../assets/yappy-logo.png';
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

  // App Data State
  const [currentUser, setCurrentUser] = useState(initialCurrentUser);
  const [communities, setCommunities] = useState(initialCommunities);
  const [discoverList, setDiscoverList] = useState(initialDiscoverCommunities);
  const [channelMessages, setChannelMessages] = useState(initialChannelMessages);
  const [directMessages, setDirectMessages] = useState(initialDirectMessages);
  const [moderationItems, setModerationItems] = useState(initialModerationItems);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [notifications, setNotifications] = useState(initialNotifications);

  // Active Contexts
  const [activeCommunity, setActiveCommunity] = useState(initialCommunities[0]);
  const [activeChannelId, setActiveChannelId] = useState(initialCommunities[0]?.channels[0]?.id || '');
  const [activeDmId, setActiveDmId] = useState(initialDirectMessages[0]?.id || '');
  const [showMembersPanel, setShowMembersPanel] = useState(true);

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
    }
    setActiveTab('community-view');
    setReplyingToMessage(null);
    setAttachedFile(null);
  };

  // Helper: Join a discoverable community
  const handleJoinCommunity = (communityToJoin) => {
    const isAlreadyJoined = communities.some(c => c.id === communityToJoin.id);
    if (isAlreadyJoined) {
      triggerToast(`You are already a member of ${communityToJoin.name}!`);
      return;
    }

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

    setCommunities(prev => [...prev, updatedCommunity]);
    setDiscoverList(prev => prev.map(c => c.id === communityToJoin.id ? { ...c, isJoined: true, membersCount: c.membersCount + 1 } : c));
    triggerToast(`🎉 Joined "${communityToJoin.name}" successfully!`);
  };

  // Helper: Create Community
  const handleCreateCommunitySubmit = (e) => {
    e.preventDefault();
    if (!newCommunityForm.name.trim()) return;

    const newId = `comm_${Date.now()}`;
    const createdCommunity = {
      id: newId,
      name: newCommunityForm.name.trim(),
      slug: newCommunityForm.name.trim().toLowerCase().replace(/\s+/g, '-'),
      icon: newCommunityForm.name.trim().slice(0, 2).toUpperCase(),
      iconBg: '#F0E7FF',
      iconColor: '#B794F6',
      category: newCommunityForm.category,
      description: newCommunityForm.description.trim() || 'A new vibrant community.',
      membersCount: 1,
      userRole: 'Owner',
      isJoined: true,
      channels: [
        { id: `ch_${newId}_gen`, name: 'general', isPrivate: false, topic: 'General discussions' },
        { id: `ch_${newId}_ann`, name: 'announcements', isPrivate: false, isAnnouncement: true, topic: 'Official updates' },
        { id: `ch_${newId}_help`, name: 'support', isPrivate: false, topic: 'Community support' }
      ],
      members: [
        { id: currentUser.id, name: currentUser.name, username: currentUser.username, role: 'Owner', status: 'Online', avatarText: currentUser.avatarText }
      ]
    };

    setCommunities(prev => [createdCommunity, ...prev]);
    setIsCreateModalOpen(false);
    setNewCommunityForm({ name: '', category: 'Development', description: '', isPrivate: false });
    handleOpenCommunity(createdCommunity);
    triggerToast(`🚀 Community "${createdCommunity.name}" created!`);
  };

  // Helper: Join via Invite Code
  const handleJoinWithCodeSubmit = (e) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    // Check if matching code or simulate successful join
    const cleanCode = joinCodeInput.trim().toUpperCase();
    const joinedComm = {
      id: `comm_code_${Date.now()}`,
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
        { id: `ch_code_${Date.now()}_gen`, name: 'general', isPrivate: false, topic: 'Community chat' }
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
      navigator.clipboard.writeText(code).catch(() => {});
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
  const isCommunityOwner = effectiveCommunityRole === 'Owner';
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
      id: `m_${Date.now()}`,
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
      id: `msg_${Date.now()}`,
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

  const handleSendDm = (e) => {
    e.preventDefault();
    if (!dmInputText.trim()) return;

    const newDmMessage = {
      id: `dmsg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      timestamp: 'Just now',
      content: dmInputText.trim(),
      reactions: {}
    };

    setDirectMessages(prev => prev.map(dm => {
      if (dm.id !== activeDm.id) return dm;
      return {
        ...dm,
        messages: [...dm.messages, newDmMessage]
      };
    }));

    setDmInputText('');
  };

  // Moderation Actions
  const handleModerationAction = (item, action) => {
    setModerationItems(prev => prev.filter(m => m.id !== item.id));

    const newLog = {
      id: `log_${Date.now()}`,
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
            onClick={() => onFormSwitch && onFormSwitch('login')}
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
                    {communities
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
                      ))}
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
                    {discoverList
                      .filter(c => !globalSearch || c.name.toLowerCase().includes(globalSearch.toLowerCase()))
                      .slice(0, 3)
                      .map(item => {
                        const isJoined = communities.some(c => c.id === item.id);
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
                                onClick={() => handleJoinCommunity(item)}
                              >
                                {isJoined ? 'Joined ✓' : 'Join'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
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
                {communities
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
                  ))}
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
                {discoverList
                  .filter(item => discoverCategory === 'All' || item.category === discoverCategory)
                  .filter(item => !globalSearch || item.name.toLowerCase().includes(globalSearch.toLowerCase()) || item.description.toLowerCase().includes(globalSearch.toLowerCase()))
                  .map(item => {
                    const isJoined = communities.some(c => c.id === item.id);
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
                            onClick={() => handleJoinCommunity(item)}
                          >
                            {isJoined ? 'Joined ✓' : 'Join Community'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  <div className="channel-group-label">TEXT CHANNELS</div>
                  {activeCommunity.channels?.map(channel => (
                    <button
                      key={channel.id}
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

          {/* 5. DIRECT MESSAGES VIEW */}
          {activeTab === 'messages' && (
            <div className="dm-workspace">
              {/* Left DM Conversations List */}
              <div className="dm-conversations-list">
                <div className="dm-sidebar-header">
                  <h3>Direct Messages</h3>
                  <button
                    type="button"
                    className="btn-new-dm"
                    onClick={() => triggerToast('Select a contact below to chat!')}
                  >
                    ✏️
                  </button>
                </div>

                <div className="dm-list-items">
                  {directMessages.map(dm => (
                    <div
                      key={dm.id}
                      className={`dm-list-item ${activeDm.id === dm.id ? 'active' : ''}`}
                      onClick={() => setActiveDmId(dm.id)}
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
                          {dm.messages[dm.messages.length - 1]?.content || 'Start a conversation'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Active DM Conversation Area */}
              <div className="dm-chat-area">
                <div className="dm-header">
                  <div className="dm-header-left">
                    <span className="dm-avatar-small">{activeDm.avatarText}</span>
                    <div>
                      <div className="dm-header-title">{activeDm.name}</div>
                      <div className="dm-header-sub">
                        {activeDm.isGroup ? activeDm.participants.join(', ') : `@${activeDm.username} • ${activeDm.status}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* DM Messages Feed */}
                <div className="dm-messages-feed">
                  {activeDm.messages.map(m => (
                    <div
                      key={m.id}
                      className={`dm-message-row ${m.senderId === currentUser.id ? 'sent' : 'received'}`}
                    >
                      <div className="dm-bubble">
                        <div className="dm-sender-tag">{m.senderName} • {m.timestamp}</div>
                        <div className="dm-content-text">{m.content}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DM Input Form */}
                <form className="dm-input-form" onSubmit={handleSendDm}>
                  <input
                    type="text"
                    placeholder={`Message ${activeDm.name}...`}
                    value={dmInputText}
                    onChange={(e) => setDmInputText(e.target.value)}
                  />
                  <button type="submit" disabled={!dmInputText.trim()}>
                    Send ✈
                  </button>
                </form>
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
                <h3>Flagged Messages Queue ({moderationItems.length})</h3>
                {moderationItems.length === 0 ? (
                  <div className="empty-mod-state">
                    <span>🎉</span>
                    <h4>All caught up!</h4>
                    <p>No flagged messages currently require review. Community is safe and clean.</p>
                  </div>
                ) : (
                  <div className="mod-items-list">
                    {moderationItems.map(item => (
                      <div key={item.id} className="mod-card">
                        <div className="mod-card-header">
                          <div className="mod-sender-info">
                            <span className="mod-user-avatar">👤</span>
                            <div>
                              <strong>{item.senderName}</strong> (@{item.senderUsername})
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
                            onClick={() => handleModerationAction(item, 'approve')}
                          >
                            ✓ Approve (Safe)
                          </button>
                          <button
                            type="button"
                            className="btn-mod delete"
                            onClick={() => handleModerationAction(item, 'delete')}
                          >
                            🗑 Delete Message
                          </button>
                          <button
                            type="button"
                            className="btn-mod warn"
                            onClick={() => handleModerationAction(item, 'warn')}
                          >
                            ⚠️ Warn User
                          </button>
                          <button
                            type="button"
                            className="btn-mod ban"
                            onClick={() => handleModerationAction(item, 'ban')}
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
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td>{log.timestamp}</td>
                          <td><strong>{log.moderator}</strong></td>
                          <td><span className="audit-action-tag">{log.action}</span></td>
                          <td><code>{log.target}</code></td>
                          <td>{log.reason}</td>
                        </tr>
                      ))}
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
          MODALS: Create Community & Join with Code
          ========================================================= */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div className="dashboard-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create a New Community</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCommunitySubmit}>
              <div className="modal-form-group">
                <label>Community Name</label>
                <input
                  type="text"
                  placeholder="e.g. Next.js Builders"
                  required
                  value={newCommunityForm.name}
                  onChange={(e) => setNewCommunityForm({ ...newCommunityForm, name: e.target.value })}
                />
              </div>
              <div className="modal-form-group">
                <label>Category</label>
                <select
                  value={newCommunityForm.category}
                  onChange={(e) => setNewCommunityForm({ ...newCommunityForm, category: e.target.value })}
                >
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="AI/ML">AI / Machine Learning</option>
                  <option value="Tech">General Tech</option>
                  <option value="Education">Education & Study</option>
                </select>
              </div>
              <div className="modal-form-group">
                <label>Description</label>
                <textarea
                  placeholder="What is your community about?"
                  rows={3}
                  value={newCommunityForm.description}
                  onChange={(e) => setNewCommunityForm({ ...newCommunityForm, description: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-modal-cancel" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Create Community
                </button>
              </div>
            </form>
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
    </div>
  );
};

export default Dashboard;