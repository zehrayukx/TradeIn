import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Search,
  LineChart,
  Home,
  Compass,
  BarChart2,
  Wallet,
  Bell,
  Settings,
  User,
  CheckCircle,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Image,
  LogOut,
  ChevronDown,
  Siren,
} from "lucide-react";
import { getDashboardPageData } from "../services/api";
import TickerTape from "../components/TickerTape";
import LoadingBlock from "../components/LoadingBlock";
import ErrorState from "../components/ErrorState";

const iconMap = {
  Anasayfa: Home,
  Keşfet: Compass,
  Piyasalar: BarChart2,
  Portföyüm: Wallet,
  Bildirimler: Bell,
  Alarmlar: Siren,
  Profilim: User,
  Ayarlar: Settings,
};

const desiredMenuOrder = [
  "Anasayfa",
  "Keşfet",
  "Piyasalar",
  "Portföyüm",
  "Bildirimler",
  "Alarmlar",
  "Ayarlar",
];

const Dashboard = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [tickerItems, setTickerItems] = useState([]);
  const [trends, setTrends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Trendler");
  const [composerText, setComposerText] = useState("");
  const [followMap, setFollowMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getDashboardPageData();

      setMenuItems(data.menuItems || []);
      setCategories(data.categories || []);
      setPosts(data.posts || []);
      setTickerItems(data.tickerItems || []);
      setTrends(data.trends || []);
      setSuggestedUsers(data.suggestedUsers || []);

      const initialFollowState = {};
      (data.suggestedUsers || []).forEach((user) => {
        initialFollowState[user.id] = false;
      });
      setFollowMap(initialFollowState);
    } catch (err) {
      console.error("Dashboard data load error:", err);
      setError("Dashboard verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const orderedMenuItems = useMemo(() => {
    const filteredItems = (menuItems || []).filter((item) =>
      desiredMenuOrder.includes(item.label)
    );

    return filteredItems.sort((a, b) => {
      return (
        desiredMenuOrder.indexOf(a.label) - desiredMenuOrder.indexOf(b.label)
      );
    });
  }, [menuItems]);

  const profileData = useMemo(() => {
    const firstPostUser = posts?.[0]?.user;

    return {
      name: firstPostUser?.name || "Zehra Kaya",
      username: firstPostUser?.username || "@zehra_trade",
      avatarText: firstPostUser?.avatarText || "ZK",
      avatarUrl: firstPostUser?.avatarUrl || "",
    };
  }, [posts]);

  const handleComposerSubmit = () => {
    console.log("dashboard post submit:", composerText);
    setComposerText("");
  };

  const handleFollowToggle = (userId) => {
    setFollowMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
    console.log("follow user:", userId);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0a0f1d] text-slate-100">
      <style>
        {`
          html, body, #root {
            overflow-x: hidden;
          }

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }

          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0d1226]/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/25">
              <LineChart size={18} className="text-white" />
            </div>
            <div className="text-[1.7rem] font-black tracking-tighter">
              <span className="text-white">TRADE</span>
              <span className="text-blue-500">IN</span>
            </div>
          </div>

          <div className="mx-6 hidden max-w-2xl flex-1 lg:block">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                placeholder="Varlık, kişi veya konu ara..."
                className="w-full rounded-xl border border-white/5 bg-[#161b22] py-3 pl-11 pr-4 text-sm text-white outline-none transition focus:border-blue-500/60"
              />
            </div>
          </div>

          <div className="relative flex items-center gap-3">
            <button
              type="button"
              className="relative flex h-[42px] w-[42px] items-center justify-center rounded-xl border border-white/10 bg-[#161b22] text-slate-200 transition hover:border-blue-500/40 hover:bg-[#1b2230]"
            >
              <Bell size={18} />
              <span className="absolute right-[10px] top-[8px] h-2.5 w-2.5 rounded-full bg-blue-500" />
            </button>

            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#161b22] px-3 py-1.5 transition hover:border-blue-500/40 hover:bg-[#1b2230]"
            >
              <AvatarBubble
                text={profileData.avatarText}
                imageUrl={profileData.avatarUrl}
                small
              />
              <span className="text-sm font-bold text-white">Zehra</span>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {isProfileMenuOpen ? (
              <div className="absolute right-0 top-[52px] z-50 w-[260px] rounded-[26px] border border-white/5 bg-[#161b22] p-3 shadow-xl shadow-black/20">
                <div className="border-b border-white/5 px-3 pb-3 pt-2">
                  <div className="text-xl font-black tracking-tighter text-white">
                    {profileData.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {profileData.username}
                  </div>
                </div>

                <div className="mt-2 space-y-1">
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-white transition hover:bg-white/5"
                  >
                    <User size={18} className="text-slate-300" />
                    <span className="text-sm font-bold">Profilim</span>
                  </button>

                  <button
                    type="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-red-400 transition hover:bg-white/5"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-bold">Çıkış Yap</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <TickerTape items={tickerItems} isLoading={isLoading} />
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="sticky top-24 h-fit">
          {error ? (
            <ErrorState
              message="Menü verileri yüklenemedi."
              onRetry={loadDashboardData}
            />
          ) : isLoading ? (
            <LoadingBlock count={2} />
          ) : (
            <div className="rounded-[26px] border border-white/5 bg-[#161b22] p-3 shadow-xl shadow-black/20">
              <nav className="space-y-1.5">
                {orderedMenuItems.map((item) => {
                  const IconComponent = iconMap[item.label] || Home;

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-4 py-3 transition ${
                          isActive
                            ? "bg-blue-600/20 text-blue-400"
                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <IconComponent size={18} />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>

                      {item.badge ? (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </aside>

        <main className="min-w-0">
          {error ? (
            <ErrorState message={error} onRetry={loadDashboardData} />
          ) : isLoading ? (
            <LoadingBlock count={4} />
          ) : (
            <>
              <section className="mb-5 rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
                <div className="flex gap-4">
                  <AvatarBubble
                    text={profileData.avatarText}
                    imageUrl={profileData.avatarUrl}
                  />

                  <div className="flex-1">
                    <textarea
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      placeholder="Piyasa görüşünüzü, analizinizi veya işlem fikrinizi paylaşın..."
                      className="h-24 w-full resize-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                    />

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <button
                        type="button"
                        onClick={() => console.log("image upload clicked")}
                        className="text-slate-400 transition hover:text-blue-400"
                      >
                        <Image size={18} />
                      </button>

                      <button
                        type="button"
                        onClick={handleComposerSubmit}
                        className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
                      >
                        Paylaş
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mb-5 overflow-x-auto no-scrollbar">
                <div className="flex min-w-max gap-2.5 pr-2">
                  {categories.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setActiveCategory(item)}
                      className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                        activeCategory === item
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "border border-white/5 bg-white/5 text-slate-400 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-5">
                {posts.map((post) => (
                  <DashboardPostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </main>

        <aside className="space-y-5">
          {error ? (
            <ErrorState
              message="Sağ panel verileri yüklenemedi."
              onRetry={loadDashboardData}
            />
          ) : isLoading ? (
            <LoadingBlock count={2} />
          ) : (
            <>
              <div className="rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tighter text-white">
                    Trendler
                  </h3>
                </div>

                <div className="space-y-5">
                  {trends.map((trend, index) => (
                    <div
                      key={trend.id}
                      className="grid grid-cols-[20px_1fr_auto] items-start gap-3"
                    >
                      <span className="pt-1 text-sm text-slate-500">
                        {index + 1}
                      </span>

                      <div>
                        <div className="text-[1.2rem] font-black leading-none text-white">
                          {trend.tag}
                        </div>
                        <div className="mt-1.5 text-sm text-slate-500">
                          {trend.count}
                        </div>
                      </div>

                      <span
                        className={`pt-1 text-sm font-black ${
                          trend.isUp ? "text-green-400" : "text-red-400"
                        }`}
                      >
                        {trend.isUp ? "↗" : "↘"} {trend.change}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="text-xl font-black tracking-tighter text-white">
                    Önerilen Traderlar
                  </h3>
                </div>

                <div className="space-y-4">
                  {suggestedUsers.map((user) => {
                    const isFollowing = followMap[user.id];

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarBubble
                            text={user.avatarText}
                            imageUrl={user.avatarUrl}
                            gradient={user.accent}
                            small
                          />

                          <div className="min-w-0">
                            <div className="flex items-center gap-1 text-sm font-black text-white">
                              <span className="truncate">{user.name}</span>
                              {user.verified ? (
                                <CheckCircle
                                  size={14}
                                  className="shrink-0 fill-blue-500 text-blue-500"
                                />
                              ) : null}
                            </div>

                            <div className="truncate text-xs text-slate-400">
                              {user.followers}
                            </div>

                            <div className="truncate text-xs text-slate-500">
                              {user.handle}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleFollowToggle(user.id)}
                          className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            isFollowing
                              ? "border border-white/10 bg-white/10 text-white hover:bg-white/15"
                              : "bg-blue-600 text-white hover:bg-blue-500"
                          }`}
                        >
                          {isFollowing ? "Takipte" : "Takip Et"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};

const AvatarBubble = ({ text, gradient, imageUrl, small = false }) => {
  const sizeClass = small ? "h-10 w-10" : "h-12 w-12";

  if (imageUrl) {
    return (
      <div
        className={`${sizeClass} overflow-hidden rounded-full shadow-lg shadow-black/20`}
      >
        <img
          src={imageUrl}
          alt={text || "avatar"}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br ${
        gradient || "from-blue-500 to-indigo-600"
      } text-sm font-black uppercase text-white shadow-lg shadow-black/20`}
    >
      {text}
    </div>
  );
};

const DashboardPostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  const metrics = useMemo(() => {
    if (Array.isArray(post.metrics) && post.metrics.length > 0) {
      return post.metrics;
    }

    if (post.market_data) {
      return [
        {
          id: "price",
          label: "BTC Fiyat",
          value: post.market_data.price,
          change: post.market_data.price_change,
        },
        {
          id: "volume",
          label: "24s Hacim",
          value: post.market_data.volume_24h,
          change: post.market_data.volume_change || "",
        },
        {
          id: "marketcap",
          label: "Piyasa Değeri",
          value: post.market_data.market_cap,
          change: post.market_data.market_cap_change || "",
        },
      ];
    }

    return [];
  }, [post]);

  return (
    <article className="rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <AvatarBubble
            text={post.user.avatarText}
            imageUrl={post.user.avatarUrl}
            gradient="from-blue-500 to-indigo-600"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-white">
              <span className="text-xl font-black leading-none">
                {post.user.name}
              </span>

              {post.user.verified ? (
                <CheckCircle
                  size={16}
                  className="fill-blue-500 text-blue-500"
                />
              ) : null}

              <span className="text-sm text-slate-400">
                {post.user.username} · {post.time}
              </span>
            </div>

            <div className="mt-2 inline-flex rounded-full bg-green-500/15 px-3 py-1.5 text-xs font-black text-green-400">
              {post.badge}
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-amber-400">
          {post.category}
        </div>
      </div>

      <p className="mb-5 text-[0.98rem] leading-7 text-slate-200">
        {post.content}
      </p>

      {metrics.length > 0 ? (
        <div className="mb-5 grid grid-cols-1 gap-4 rounded-[22px] bg-[#0f1a2d] p-5 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.id}>
              <div className="mb-1.5 text-xs font-semibold text-slate-500">
                {metric.label}
              </div>

              <div className="flex items-end gap-2">
                <span className="text-[1.55rem] font-black text-white">
                  {metric.value}
                </span>

                {metric.change ? (
                  <span className="pb-1 text-sm font-black text-green-400">
                    {metric.change}
                  </span>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4 text-slate-400">
        <div className="flex flex-wrap items-center gap-6">
          <button
            type="button"
            onClick={() => {
              setLiked((prev) => !prev);
              console.log("like:", post.id);
            }}
            className={`flex items-center gap-2 text-sm font-semibold transition ${
              liked ? "text-pink-400" : "hover:text-pink-400"
            }`}
          >
            <Heart size={18} />
            {post.stats.likes}
          </button>

          <button
            type="button"
            onClick={() => console.log("comment:", post.id)}
            className="flex items-center gap-2 text-sm font-semibold transition hover:text-blue-400"
          >
            <MessageCircle size={18} />
            {post.stats.comments}
          </button>

          <button
            type="button"
            onClick={() => console.log("share:", post.id)}
            className="flex items-center gap-2 text-sm font-semibold transition hover:text-green-400"
          >
            <Repeat2 size={18} />
            {post.stats.reposts}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setSaved((prev) => !prev);
            console.log("save:", post.id);
          }}
          className={`transition ${
            saved ? "text-yellow-400" : "hover:text-yellow-400"
          }`}
        >
          <Bookmark size={20} />
        </button>
      </div>
    </article>
  );
};

export default Dashboard;