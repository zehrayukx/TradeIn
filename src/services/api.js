// src/services/api.js

import {
  HOME_TICKER,
  HOME_CATEGORIES,
  HOME_POSTS,
  HOME_TRENDS,
  HOME_RECOMMENDED_TRADERS,
  DASHBOARD_MENU,
  DB_CATEGORIES,
  DB_POSTS,
  TRENDS_DATA,
  SUGGESTED_TRADERS,
} from "../data/mockData";

const API_BASE_URL = "http://127.0.0.1:8000";

// Backend henüz yokken bunu false bırak.
// Backend hazır olduğunda true yapıp gerçek endpointleri kullanabilirsin.
const USE_REAL_API = false;

// Yükleme ekranını test etmek için yapay gecikme
const delay = (ms = 700) => new Promise((resolve) => setTimeout(resolve, ms));

// ----------------------------------------------------
// MAPPER FONKSİYONLARI
// FastAPI snake_case dönerse burada frontend formatına çeviriyoruz
// ----------------------------------------------------

const mapApiMetricToUi = (apiMetric) => ({
  id: apiMetric.id ?? crypto.randomUUID?.() ?? String(Math.random()),
  label: apiMetric.label ?? "",
  value: apiMetric.value ?? "",
  change: apiMetric.change ?? "",
});

const mapApiPostToUi = (apiPost) => ({
  id: apiPost.id,
  user: {
    name: apiPost.user?.name ?? apiPost.author_name ?? "",
    username: apiPost.user?.username ?? apiPost.author_username ?? "",
    avatarText:
      apiPost.user?.avatarText ??
      apiPost.user?.avatar_text ??
      apiPost.avatar_text ??
      "UI",
    verified:
      apiPost.user?.verified ??
      apiPost.user?.is_verified ??
      apiPost.is_verified ??
      false,
  },
  time: apiPost.time ?? apiPost.created_at_label ?? "Az önce",
  badge: apiPost.badge ?? apiPost.sentiment_label ?? "Nötr",
  category: apiPost.category ?? apiPost.asset_category ?? "Genel",
  content: apiPost.content ?? apiPost.post_text ?? "",
  metrics: Array.isArray(apiPost.metrics)
    ? apiPost.metrics.map(mapApiMetricToUi)
    : [
        {
          id: "price",
          label: "Fiyat",
          value: apiPost.price ?? apiPost.current_price ?? "-",
          change: apiPost.price_change ?? apiPost.daily_change ?? "",
        },
      ],
  stats: {
    likes: apiPost.stats?.likes ?? apiPost.like_count ?? "0",
    comments: apiPost.stats?.comments ?? apiPost.comment_count ?? "0",
    reposts: apiPost.stats?.reposts ?? apiPost.repost_count ?? "0",
  },
});

const mapApiTrendToUi = (apiTrend) => ({
  id: apiTrend.id,
  tag: apiTrend.tag ?? apiTrend.hashtag ?? "#trend",
  count: apiTrend.count ?? apiTrend.post_count_label ?? "0 gönderi",
  change: apiTrend.change ?? apiTrend.change_rate ?? "",
  isUp: apiTrend.is_up ?? apiTrend.isUp ?? true,
});

const mapApiUserToUi = (apiUser) => ({
  id: apiUser.id,
  name: apiUser.name ?? apiUser.full_name ?? "",
  handle: apiUser.handle ?? apiUser.username ?? "@user",
  followers: apiUser.followers ?? apiUser.followers_label ?? "0 takipçi",
  avatarText:
    apiUser.avatarText ?? apiUser.avatar_text ?? apiUser.initials ?? "U",
  verified:
    apiUser.verified ?? apiUser.is_verified ?? false,
  accent: apiUser.accent ?? "from-blue-500 to-indigo-600",
});

const mapApiTickerToUi = (apiTicker) => ({
  id: apiTicker.id,
  pair: apiTicker.pair ?? apiTicker.symbol ?? "",
  price: apiTicker.price ?? apiTicker.last_price ?? "",
  change: apiTicker.change ?? apiTicker.change_percent ?? "",
  isUp: apiTicker.is_up ?? apiTicker.isUp ?? true,
});

const mapApiMenuToUi = (apiItem) => ({
  id: apiItem.id,
  label: apiItem.label ?? apiItem.title ?? "",
  path: apiItem.path ?? apiItem.route ?? "/",
  badge: apiItem.badge ?? apiItem.badge_count ?? undefined,
});

// ----------------------------------------------------
// FETCH WRAPPER
// ----------------------------------------------------

async function safeFetch(endpoint) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API hatası: ${response.status}`);
  }

  return response.json();
}

// ----------------------------------------------------
// HOME API
// ----------------------------------------------------

export async function getHomePageData() {
  await delay();

  if (!USE_REAL_API) {
    return {
      tickerItems: HOME_TICKER,
      categories: HOME_CATEGORIES,
      posts: HOME_POSTS,
      trends: HOME_TRENDS,
      suggestedUsers: HOME_RECOMMENDED_TRADERS,
    };
  }

  const [tickerRes, categoriesRes, postsRes, trendsRes, usersRes] =
    await Promise.all([
      safeFetch("/home/ticker"),
      safeFetch("/home/categories"),
      safeFetch("/home/posts"),
      safeFetch("/home/trends"),
      safeFetch("/home/suggested-users"),
    ]);

  return {
    tickerItems: Array.isArray(tickerRes)
      ? tickerRes.map(mapApiTickerToUi)
      : [],
    categories: Array.isArray(categoriesRes) ? categoriesRes : [],
    posts: Array.isArray(postsRes) ? postsRes.map(mapApiPostToUi) : [],
    trends: Array.isArray(trendsRes) ? trendsRes.map(mapApiTrendToUi) : [],
    suggestedUsers: Array.isArray(usersRes)
      ? usersRes.map(mapApiUserToUi)
      : [],
  };
}

// ----------------------------------------------------
// DASHBOARD API
// ----------------------------------------------------

export async function getDashboardPageData() {
  await delay();

  if (!USE_REAL_API) {
    return {
      menuItems: DASHBOARD_MENU,
      categories: DB_CATEGORIES,
      posts: DB_POSTS,
      tickerItems: HOME_TICKER,
      trends: TRENDS_DATA,
      suggestedUsers: SUGGESTED_TRADERS,
    };
  }

  const [menuRes, categoriesRes, postsRes, tickerRes, trendsRes, usersRes] =
    await Promise.all([
      safeFetch("/dashboard/menu"),
      safeFetch("/dashboard/categories"),
      safeFetch("/dashboard/posts"),
      safeFetch("/dashboard/ticker"),
      safeFetch("/dashboard/trends"),
      safeFetch("/dashboard/suggested-users"),
    ]);

  return {
    menuItems: Array.isArray(menuRes) ? menuRes.map(mapApiMenuToUi) : [],
    categories: Array.isArray(categoriesRes) ? categoriesRes : [],
    posts: Array.isArray(postsRes) ? postsRes.map(mapApiPostToUi) : [],
    tickerItems: Array.isArray(tickerRes)
      ? tickerRes.map(mapApiTickerToUi)
      : [],
    trends: Array.isArray(trendsRes) ? trendsRes.map(mapApiTrendToUi) : [],
    suggestedUsers: Array.isArray(usersRes)
      ? usersRes.map(mapApiUserToUi)
      : [],
  };
}
// src/services/api.js dosyasına eklenecekler

export async function loginUser(credentials) {
  await delay(1000); // Gerçekçi yükleme simülasyonu
  if (!USE_REAL_API) {
    console.log("Mock Login Success:", credentials);
    return { success: true, user: { name: "Zehra", token: "mock-jwt-token" } };
  }
  // return safeFetch("/auth/login", { method: 'POST', body: JSON.stringify(credentials) });
}

export async function registerUser(userData) {
  await delay(1000);
  if (!USE_REAL_API) {
    console.log("Mock Register Success:", userData);
    return { success: true };
  }
  // return safeFetch("/auth/register", { method: 'POST', body: JSON.stringify(userData) });
}