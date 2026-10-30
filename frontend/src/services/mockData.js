
export const initialCurrentUser = {
  id: "usr_101",
  name: "Manish Kumar",
  username: "manish_k",
  email: "manish.kumar@smartcommunity.org",
  avatarText: "MK",
  role: "Community Lead",
  status: "Online", // 'Online' | 'Idle' | 'Do Not Disturb' | 'Offline'
  college: "B.Tech Computer Science (3rd Sem)",
  bio: "Full-stack developer & tech enthusiast. Building secure AI-assisted community spaces.",
  joinedDate: "October 2026",
  notificationPreferences: {
    directMessages: true,
    channelMentions: true,
    communityAnnouncements: true,
    soundAlerts: true,
    emailSummary: false,
  },
  privacySettings: {
    dmPermission: "Community Members", // 'Everyone' | 'Community Members' | 'Nobody'
    showOnlineStatus: true,
    allowInvites: true,
    blockedUsers: ["spammer_bot41"]
  }
};

export const initialCommunities = [
  {
    id: "comm_java",
    name: "Java Developers",
    slug: "java-developers",
    icon: "</>",
    iconBg: "#F0E7FF",
    iconColor: "#B794F6",
    category: "Development",
    description: "Connect with Java, Spring Boot, and JVM developers worldwide. Share code and ask questions.",
    membersCount: 158,
    userRole: "Member",
    isJoined: true,
    inviteCode: "JAVA-2026",
    channels: [
      { id: "ch_j_general", name: "general", isPrivate: false, topic: "General discussions about Java and programming" },
      { id: "ch_j_announcements", name: "announcements", isPrivate: false, isAnnouncement: true, topic: "Official updates, meetups, and releases" },
      { id: "ch_j_spring", name: "spring-boot", isPrivate: false, topic: "Spring Framework, Microservices & APIs" },
      { id: "ch_j_help", name: "code-help", isPrivate: false, topic: "Get help debugging your Java code" },
      { id: "ch_j_mod", name: "moderators-only", isPrivate: true, topic: "Channel for community moderators" }
    ],
    members: [
      { id: "m_1", name: "Alex Rivera", username: "alex_r", role: "Owner", status: "Online", avatarText: "AR" },
      { id: "usr_101", name: "Manish Kumar", username: "manish_k", role: "Member", status: "Online", avatarText: "MK" },
      { id: "m_3", name: "Priya Sharma", username: "priya_s", role: "Admin", status: "Online", avatarText: "PS" },
      { id: "m_4", name: "David Chen", username: "dchen", role: "Member", status: "Idle", avatarText: "DC" },
      { id: "m_5", name: "Sarah Jenkins", username: "sarah_j", role: "Member", status: "Offline", avatarText: "SJ" }
    ]
  },
  {
    id: "comm_web",
    name: "Web Development",
    slug: "web-development",
    icon: "🍃",
    iconBg: "#FAF8F3",
    iconColor: "#80D8B0",
    category: "Development",
    description: "Modern web craft: React, Vite, Next.js, Node.js, CSS architectures, and performant web apps.",
    membersCount: 298,
    userRole: "Admin",
    isJoined: true,
    inviteCode: "WEB-2026",
    channels: [
      { id: "ch_w_general", name: "general", isPrivate: false, topic: "Web development discussions" },
      { id: "ch_w_react", name: "react-and-vite", isPrivate: false, topic: "React 19, hooks, state management" },
      { id: "ch_w_showcase", name: "project-showcase", isPrivate: false, topic: "Show your portfolio and latest builds" },
      { id: "ch_w_css", name: "css-wizardry", isPrivate: false, topic: "Layouts, animations, and responsive UI" }
    ],
    members: [
      { id: "usr_101", name: "Manish Kumar", username: "manish_k", role: "Admin", status: "Online", avatarText: "MK" },
      { id: "m_3", name: "Priya Sharma", username: "priya_s", role: "Member", status: "Online", avatarText: "PS" },
      { id: "m_6", name: "Vikram Mehta", username: "vikram_m", role: "Member", status: "Online", avatarText: "VM" },
      { id: "m_7", name: "Elena Rostova", username: "elena_r", role: "Member", status: "Offline", avatarText: "ER" }
    ]
  },
  {
    id: "comm_tech",
    name: "Tech Enthusiasts",
    slug: "tech-enthusiasts",
    icon: "👥",
    iconBg: "#F0E7FF",
    iconColor: "#B794F6",
    category: "Tech",
    description: "Hardware, gadgets, future tech, open source discoveries, and community tech banter.",
    membersCount: 184,
    userRole: "Member",
    isJoined: true,
    channels: [
      { id: "ch_t_general", name: "general", isPrivate: false, topic: "All things technology" },
      { id: "ch_t_gadgets", name: "gadgets-gear", isPrivate: false, topic: "Smart devices, setups, keyboards" },
      { id: "ch_t_opensource", name: "open-source", isPrivate: false, topic: "Awesome repos and contributions" }
    ],
    members: [
      { id: "m_1", name: "Alex Rivera", username: "alex_r", role: "Member", status: "Online", avatarText: "AR" },
      { id: "m_2", name: "Manish Kumar", username: "manish_k", role: "Member", status: "Online", avatarText: "MK" },
      { id: "m_8", name: "Rohan Verma", username: "rohan_v", role: "Owner", status: "Idle", avatarText: "RV" }
    ]
  }
];

export const initialDiscoverCommunities = [
  {
    id: "disc_ai",
    name: "AI & Machine Learning",
    icon: "🧠",
    iconBg: "#FAF8F3",
    iconColor: "#FF8FA3",
    category: "AI/ML",
    description: "Deep dive into Large Language Models, PyTorch, computer vision, and neural network architectures.",
    membersCount: 342,
    isJoined: false,
    channels: [
      { id: "ch_ai_gen", name: "general", isPrivate: false, topic: "AI & ML conversations" },
      { id: "ch_ai_research", name: "research-papers", isPrivate: false, topic: "Recent Arxiv paper discussions" }
    ],
    members: [
      { id: "m_9", name: "Dr. Arvind Rao", username: "arvind_ai", role: "Owner", status: "Online", avatarText: "AR" }
    ]
  },
  {
    id: "disc_uiux",
    name: "UI/UX Design",
    icon: "✏️",
    iconBg: "#FAF8F3",
    iconColor: "#FFD166",
    category: "Design",
    description: "Design systems, Figma components, typography rules, user research, and wireframe feedback.",
    membersCount: 220,
    isJoined: false,
    channels: [
      { id: "ch_ui_gen", name: "general", isPrivate: false, topic: "Design discussions" },
      { id: "ch_ui_critique", name: "design-critique", isPrivate: false, topic: "Post your mockups for feedback" }
    ],
    members: [
      { id: "m_10", name: "Sophia Lin", username: "sophia_ui", role: "Owner", status: "Online", avatarText: "SL" }
    ]
  },
  {
    id: "disc_cp",
    name: "Competitive Programming",
    icon: "</>",
    iconBg: "#FAF8F3",
    iconColor: "#80D8B0",
    category: "Education",
    description: "Algorithm practice on LeetCode, Codeforces, dynamic programming strategies, and contest debriefs.",
    membersCount: 195,
    isJoined: false,
    channels: [
      { id: "ch_cp_gen", name: "general", isPrivate: false, topic: "DSA and contest banter" },
      { id: "ch_cp_solutions", name: "daily-problem", isPrivate: false, topic: "Daily algorithmic problem solving" }
    ],
    members: [
      { id: "m_11", name: "Kunal Bansal", username: "kunal_code", role: "Owner", status: "Online", avatarText: "KB" }
    ]
  },
  {
    id: "disc_cyber",
    name: "Cyber Security & InfoSec",
    icon: "🛡️",
    iconBg: "#F0E7FF",
    iconColor: "#B794F6",
    category: "Tech",
    description: "Ethical hacking, CTF challenges, application security, cryptography, and defensive engineering.",
    membersCount: 164,
    isJoined: false,
    channels: [
      { id: "ch_sec_gen", name: "general", isPrivate: false, topic: "Cyber security discussions" },
      { id: "ch_sec_ctf", name: "ctf-warroom", isPrivate: false, topic: "Live Capture The Flag competitions" }
    ],
    members: [
      { id: "m_12", name: "Tanya Sen", username: "tanya_sec", role: "Owner", status: "Idle", avatarText: "TS" }
    ]
  }
];

export const initialChannelMessages = {
  "ch_j_general": [
    {
      id: "msg_1",
      senderId: "m_1",
      senderName: "Alex Rivera",
      senderRole: "Owner",
      avatarText: "AR",
      timestamp: "Today at 09:15 AM",
      content: "Welcome everyone to the Java Developers channel! Feel free to ask questions about Spring Boot, concurrency, or JVM internals.",
      reactions: { "👍": 5, "🚀": 3 },
      userReactions: ["👍"],
      isPinned: true,
      replyTo: null,
      attachments: []
    },
    {
      id: "msg_2",
      senderId: "m_3",
      senderName: "Priya Sharma",
      senderRole: "Admin",
      avatarText: "PS",
      timestamp: "Today at 09:32 AM",
      content: "Has anyone migrated their production services to Virtual Threads in Java 21 yet? How is the throughput comparing to reactive streams?",
      reactions: { "💡": 4 },
      userReactions: [],
      isPinned: false,
      replyTo: null,
      attachments: []
    },
    {
      id: "msg_3",
      senderId: "usr_101",
      senderName: "Manish Kumar",
      senderRole: "Member",
      avatarText: "MK",
      timestamp: "Today at 09:40 AM",
      content: "Yes @priya_s! We migrated our I/O-heavy notification dispatcher to Java 21 virtual threads. Memory usage dropped significantly and code complexity was cut in half compared to WebFlux.",
      reactions: { "🔥": 6, "❤️": 2 },
      userReactions: [],
      isPinned: false,
      replyTo: "msg_2",
      attachments: []
    }
  ],
  "ch_j_announcements": [
    {
      id: "msg_a_1",
      senderId: "m_1",
      senderName: "Alex Rivera",
      senderRole: "Owner",
      avatarText: "AR",
      timestamp: "Yesterday at 04:00 PM",
      content: "📢 Community Hackathon starting next Friday! Theme: AI-assisted smart community integrations. RSVP in #general.",
      reactions: { "🎉": 14, "🔥": 9 },
      userReactions: [],
      isPinned: true,
      replyTo: null,
      attachments: []
    }
  ],
  "ch_w_general": [
    {
      id: "msg_w_1",
      senderId: "usr_101",
      senderName: "Manish Kumar",
      senderRole: "Admin",
      avatarText: "MK",
      timestamp: "Today at 10:10 AM",
      content: "Just finalized the unified SVG responsive wave background system on our Smart Community frontend. Zero gaps across desktop and mobile!",
      reactions: { "👏": 8, "🚀": 5 },
      userReactions: [],
      isPinned: false,
      replyTo: null,
      attachments: []
    }
  ]
};

export const initialDirectMessages = [
  {
    id: "dm_alex",
    isGroup: false,
    name: "Alex Rivera",
    username: "alex_r",
    role: "Community Lead",
    avatarText: "AR",
    status: "Online",
    unreadCount: 1,
    messages: [
      {
        id: "dmsg_1",
        senderId: "m_1",
        senderName: "Alex Rivera",
        timestamp: "10:14 AM",
        content: "Hey Manish, did you check the new moderation pipeline guidelines for flagged messages?",
        reactions: {}
      },
      {
        id: "dmsg_2",
        senderId: "usr_101",
        senderName: "Manish Kumar",
        timestamp: "10:18 AM",
        content: "Hey Alex! Yes, reviewing the moderation queue right now. The AI confidence scores make triaging very fast.",
        reactions: { "👍": 1 }
      },
      {
        id: "dmsg_3",
        senderId: "m_1",
        senderName: "Alex Rivera",
        timestamp: "10:20 AM",
        content: "Awesome, let's connect after your PR is merged.",
        reactions: {}
      }
    ]
  },
  {
    id: "dm_priya",
    isGroup: false,
    name: "Priya Sharma",
    username: "priya_s",
    role: "Admin",
    avatarText: "PS",
    status: "Online",
    unreadCount: 0,
    messages: [
      {
        id: "dmsg_p1",
        senderId: "m_3",
        senderName: "Priya Sharma",
        timestamp: "Yesterday",
        content: "Thanks for sharing the Java 21 benchmark notes!",
        reactions: { "❤️": 1 }
      }
    ]
  },
  {
    id: "dm_hackathon_group",
    isGroup: true,
    name: "Hackathon Team Alpha",
    participants: ["Manish Kumar", "Alex Rivera", "David Chen", "Sarah Jenkins"],
    avatarText: "👥",
    unreadCount: 2,
    messages: [
      {
        id: "dmsg_g1",
        senderId: "m_4",
        senderName: "David Chen",
        timestamp: "09:05 AM",
        content: "I've drafted the schema for the real-time WebSocket events. Check it out when you have a moment.",
        reactions: {}
      },
      {
        id: "dmsg_g2",
        senderId: "m_5",
        senderName: "Sarah Jenkins",
        timestamp: "09:12 AM",
        content: "Looks solid David! I will handle the file upload attachments endpoint.",
        reactions: { "🚀": 2 }
      }
    ]
  }
];

export const initialModerationItems = [
  {
    id: "mod_1",
    messageText: "Join my free crypto pump Telegram channel right now for guaranteed 500x returns! http://suspicious-crypto-link.xyz",
    senderName: "CryptoBot99",
    senderUsername: "cryptobot99",
    channelName: "#general",
    communityName: "Java Developers",
    classification: "Spam & Phishing",
    confidence: 96,
    status: "Pending Review", // 'Pending Review' | 'Approved' | 'Deleted' | 'Warned' | 'Banned'
    reportedAt: "10 minutes ago",
    aiSeverity: "High"
  },
  {
    id: "mod_2",
    messageText: "You are all complete idiots, stop writing garbage code and quit the industry forever.",
    senderName: "RogueUser202",
    senderUsername: "rogue202",
    channelName: "#code-help",
    communityName: "Java Developers",
    classification: "Harassment & Toxicity",
    confidence: 89,
    status: "Pending Review",
    reportedAt: "25 minutes ago",
    aiSeverity: "Medium"
  },
  {
    id: "mod_3",
    messageText: "Check this leaked test bank with exam answers: bit.ly/cheat-keys-2026",
    senderName: "AnonymousStudent",
    senderUsername: "anon_student",
    channelName: "#general",
    communityName: "Tech Enthusiasts",
    classification: "Academic Dishonesty",
    confidence: 93,
    status: "Pending Review",
    reportedAt: "1 hour ago",
    aiSeverity: "High"
  }
];

export const initialAuditLogs = [
  {
    id: "log_1",
    timestamp: "2 hours ago",
    moderator: "Manish Kumar",
    action: "Banned User",
    target: "@spammer_bot41",
    reason: "Automated DM spam campaign"
  },
  {
    id: "log_2",
    timestamp: "Yesterday",
    moderator: "Priya Sharma",
    action: "Deleted Message",
    target: "@toxic_coder",
    reason: "Violation of community civility rule"
  },
  {
    id: "log_3",
    timestamp: "2 days ago",
    moderator: "Alex Rivera",
    action: "Approved Message",
    target: "@newbie_dev",
    reason: "False positive: technical error log flagged as harmful script"
  }
];

export const initialNotifications = [
  {
    id: "notif_1",
    type: "mention",
    title: "Mentioned in Java Developers",
    description: "Priya Sharma mentioned you in #general: '@manish_k how is virtual threads throughput?'",
    time: "25m ago",
    isRead: false
  },
  {
    id: "notif_2",
    type: "dm",
    title: "New Message from Alex Rivera",
    description: "'Hey Manish, did you check the new moderation pipeline guidelines?'",
    time: "1h ago",
    isRead: false
  },
  {
    id: "notif_3",
    type: "invite",
    title: "Community Invite",
    description: "You were invited to join 'Cyber Security & InfoSec' by Tanya Sen.",
    time: "3h ago",
    isRead: true
  },
  {
    id: "notif_4",
    type: "moderation",
    title: "AI Moderation Alert",
    description: "3 new high-confidence flagged messages require moderator review.",
    time: "4h ago",
    isRead: true
  }
];
