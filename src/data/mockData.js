// src/data/mockData.js

// ======================================================
// HOME DATA
// ======================================================

export const HOME_TICKER = [
  { id: 1, pair: "BTC", price: "67,842", change: "+1.87%", isUp: true },
  { id: 2, pair: "ETH", price: "3,521.15", change: "-2.42%", isUp: false },
  { id: 3, pair: "XAU", price: "2,318.60", change: "+0.55%", isUp: true },
  { id: 4, pair: "XAG", price: "27.43", change: "-1.37%", isUp: false },
  { id: 5, pair: "USD/TRY", price: "32.14", change: "+0.56%", isUp: true },
  { id: 6, pair: "EUR/USD", price: "1.0842", change: "-0.21%", isUp: false },
  { id: 7, pair: "GBP/USD", price: "1.2671", change: "+0.36%", isUp: true },
  { id: 8, pair: "SOL", price: "168.92", change: "+3.26%", isUp: true },
];

export const HOME_CATEGORIES = [
  "Trendler",
  "Borsa",
  "Altın",
  "Gümüş",
  "Bitcoin",
  "Dolar",
  "Euro",
  "Sterlin",
];

export const HOME_POSTS = [
  {
    id: "home-post-1",
    user: {
      name: "Zehra Kaya",
      username: "@zehra_trade",
      avatarText: "ZK",
      verified: true,
    },
    time: "3 dk önce",
    badge: "Yükseliş",
    category: "Bitcoin",
    content:
      "Bitcoin 68.000$ direnç seviyesini güçlü hacimle yukarı kırdı. Bu, 75.000$'a doğru yeni bir yükseliş dalgasının başlangıcı olabilir. Zincir üstü metrikler son derece sağlıklı görünüyor — uzun vadeli tutucu arzı tüm zamanların zirvesinde ve borsa çıkışları hız kazanıyor. 🚀",
    metrics: [
      { id: "price", label: "BTC Fiyat", value: "$67.842", change: "+1.87%" },
      { id: "volume", label: "24s Hacim", value: "$38.2B", change: "+14.3%" },
      { id: "mcap", label: "Piyasa Değeri", value: "$1.33T", change: "+1.91%" },
    ],
    stats: {
      likes: "2.847",
      comments: "312",
      reposts: "891",
    },
  },
  {
    id: "home-post-2",
    user: {
      name: "Selin Arslan",
      username: "@selin_altin",
      avatarText: "SA",
      verified: true,
    },
    time: "18 dk önce",
    badge: "Yükseliş",
    category: "Gold",
    content:
      "Altın, jeopolitik gerilimler arttıkça klasik güvenli liman talebini göstermeye devam ediyor. XAU/USD 2.300$ üzerinde kalırsa yeni bir ivme görebiliriz.",
    metrics: [
      { id: "price", label: "XAU Fiyat", value: "$2.318", change: "+0.55%" },
      { id: "volume", label: "24s Hacim", value: "$12.1B", change: "+5.3%" },
      { id: "mcap", label: "Piyasa Değeri", value: "$14.2T", change: "+1.08%" },
    ],
    stats: {
      likes: "1.120",
      comments: "145",
      reposts: "220",
    },
  },
];

export const HOME_TRENDS = [
  { id: 1, tag: "#borsa", count: "9.1K gönderi", change: "+7%", isUp: true },
  { id: 2, tag: "#altın", count: "11.2K gönderi", change: "+18%", isUp: true },
  { id: 3, tag: "#gümüş", count: "5.4K gönderi", change: "-3%", isUp: false },
  { id: 4, tag: "#sterlin", count: "3.8K gönderi", change: "-5%", isUp: false },
];

export const HOME_RECOMMENDED_TRADERS = [
  {
    id: 1,
    name: "Warren B.",
    handle: "@warrenmacro",
    followers: "2.1M takipçi",
    avatarText: "WB",
    verified: true,
    accent: "from-amber-500 to-orange-600",
  },
  {
    id: 2,
    name: "Sarah K.",
    handle: "@sarahfx",
    followers: "890K takipçi",
    avatarText: "SK",
    verified: true,
    accent: "from-fuchsia-500 to-pink-600",
  },
  {
    id: 3,
    name: "David L.",
    handle: "@davidmacro",
    followers: "445K takipçi",
    avatarText: "DL",
    verified: false,
    accent: "from-cyan-500 to-blue-600",
  },
  {
    id: 4,
    name: "Emily C.",
    handle: "@emilytrade",
    followers: "312K takipçi",
    avatarText: "EC",
    verified: true,
    accent: "from-violet-500 to-indigo-600",
  },
];

// ======================================================
// DASHBOARD DATA
// ======================================================

export const DASHBOARD_MENU = [
  {
    id: 1,
    label: "Anasayfa",
    path: "/dashboard",
  },
  {
    id: 2,
    label: "Keşfet",
    path: "/dashboard/explore",
  },
  {
    id: 3,
    label: "Piyasalar",
    path: "/dashboard/markets",
  },
  {
    id: 4,
    label: "Portföyüm",
    path: "/dashboard/portfolio",
  },
  {
    id: 5,
    label: "Bildirimler",
    path: "/dashboard/notifications",
    badge: 12,
  },
  {
    id: 6,
    label: "Alarmlar",
    path: "/dashboard/alerts",
    badge: 3,
  },
  {
    id: 7,
    label: "Ayarlar",
    path: "/dashboard/settings",
  },
];
export const DB_CATEGORIES = [
  "Trendler",
  "Takip Edilenler",
  "Borsa",
  "Altın",
  "Gümüş",
  "Bitcoin",
  "Dolar",
  "Euro",
  "Sterlin",
];

export const DB_POSTS = [
  {
    id: "p1",
    user: {
      name: "Zehra Kaya",
      username: "@zehra_trade",
      avatarText: "ZK",
      verified: true,
    },
    time: "3 dk önce",
    badge: "Yükseliş",
    category: "Bitcoin",
    content:
      "Bitcoin 68.000$ direnç seviyesini güçlü hacimle yukarı kırdı. Bu, 75.000$'a doğru yeni bir yükseliş dalgasının başlangıcı olabilir. 🚀",
    metrics: [
      { id: "price", label: "BTC Fiyat", value: "$67.842", change: "+1.87%" },
      { id: "volume", label: "24s Hacim", value: "$38.2B", change: "+14.3%" },
      { id: "mcap", label: "Piyasa Değeri", value: "$1.33T", change: "+1.91%" },
    ],
    stats: { likes: "2.847", comments: "312", reposts: "891" },
  },
  {
    id: "p2",
    user: {
      name: "Selin Arslan",
      username: "@selin_altin",
      avatarText: "SA",
      verified: true,
    },
    time: "18 dk önce",
    badge: "Yükseliş",
    category: "Gold",
    content:
      "Altın fiyatları Fed kararı sonrası beklenen kırılımı gerçekleştirdi. Dolar endeksindeki zayıflama sürerse yeni zirveler test edilebilir.",
    metrics: [
      { id: "price", label: "XAU Fiyat", value: "$2.318", change: "+0.55%" },
      { id: "volume", label: "24s Hacim", value: "$12.1B", change: "+5.3%" },
      { id: "mcap", label: "Piyasa Değeri", value: "$14.2T", change: "+1.08%" },
    ],
    stats: { likes: "1.120", comments: "145", reposts: "220" },
  },
];

export const TRENDS_DATA = [
  { id: 1, tag: "#borsa", count: "125K gönderi" },
  { id: 2, tag: "#altın", count: "82K gönderi" },
  { id: 3, tag: "#gümüş", count: "15K gönderi" },
  { id: 4, tag: "#sterlin", count: "8K gönderi" },
];

export const SUGGESTED_TRADERS = [
  {
    id: 1,
    name: "Selin Arslan",
    handle: "@selin_altin",
    initials: "SA",
    color: "from-amber-500 to-orange-600",
    verified: true,
  },
  {
    id: 2,
    name: "Mert Kaya",
    handle: "@mertborsa",
    initials: "MK",
    color: "from-blue-500 to-cyan-600",
    verified: false,
  },
  {
    id: 3,
    name: "Ece Demir",
    handle: "@ecetrade",
    initials: "ED",
    color: "from-purple-500 to-pink-600",
    verified: true,
  },
];