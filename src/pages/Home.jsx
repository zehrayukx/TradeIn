// src/pages/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  LineChart,
  CheckCircle,
  Heart,
  MessageCircle,
  Repeat2,
  Bookmark,
  Home as HomeIcon,
  Compass,
  BarChart2,
  Settings,
} from "lucide-react";
import { getHomePageData } from "../services/api";
import TickerTape from "../components/TickerTape";
import LoadingBlock from "../components/LoadingBlock";
import ErrorState from "../components/ErrorState";

const homeMenuItems = [
  { id: 1, label: "Anasayfa", path: "/", icon: HomeIcon },
  { id: 2, label: "Keşfet", path: "/explore", icon: Compass },
  { id: 3, label: "Piyasalar", path: "/markets", icon: BarChart2 },
  { id: 4, label: "Ayarlar", path: "/settings", icon: Settings },
];

const Home = () => {
  const navigate = useNavigate();

  const [tickerItems, setTickerItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [posts, setPosts] = useState([]);
  const [trends, setTrends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Trendler");
  const [followMap, setFollowMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await getHomePageData();

      setTickerItems(data.tickerItems || []);
      setCategories(data.categories || []);
      setPosts(data.posts || []);
      setTrends(data.trends || []);
      setSuggestedUsers(data.suggestedUsers || []);

      const initialFollowState = {};
      (data.suggestedUsers || []).forEach((user) => {
        initialFollowState[user.id] = false;
      });
      setFollowMap(initialFollowState);
    } catch (err) {
      console.error("Home data load error:", err);
      setError("Ana sayfa verileri yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  const handleFollow = (userId) => {
    setFollowMap((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
    console.log("Takip durumu değişti:", userId);
  };

  return (
    <div className="min-h-screen bg-[#0a0f1d] text-slate-100">
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

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="rounded-xl border border-white/10 bg-[#161b22] px-5 py-2.5 text-sm font-bold transition hover:border-blue-500/40 hover:bg-[#1b2230]"
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Üye Ol
            </button>
          </div>
        </div>

        <TickerTape items={tickerItems} isLoading={isLoading} />
      </header>

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-6 px-6 py-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">
        <aside className="sticky top-24 h-fit">
          <div className="rounded-[26px] border border-white/5 bg-[#161b22] p-3 shadow-xl shadow-black/20">
            <nav className="space-y-1.5">
              {homeMenuItems.map((item) => {
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition ${
                      item.label === "Anasayfa"
                        ? "bg-blue-600/20 text-blue-400"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="min-w-0">
          {error ? (
            <ErrorState message={error} onRetry={loadHomeData} />
          ) : isLoading ? (
            <LoadingBlock count={3} />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap gap-2.5">
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

              <div className="space-y-5">
                {posts.map((post) => (
                  <HomePostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}
        </main>

        <aside className="space-y-5">
          {error ? (
            <ErrorState message="Sağ panel verileri yüklenemedi." onRetry={loadHomeData} />
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
                          onClick={() => handleFollow(user.id)}
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

const AvatarBubble = ({ text, gradient, small = false }) => {
  const sizeClass = small ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm";

  return (
    <div
      className={`inline-flex ${sizeClass} items-center justify-center rounded-full bg-gradient-to-br ${gradient} font-black uppercase text-white shadow-lg shadow-black/20`}
    >
      {text}
    </div>
  );
};

const HomePostCard = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <article className="rounded-[26px] border border-white/5 bg-[#161b22] p-5 shadow-xl shadow-black/20">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <AvatarBubble
            text={post.user.avatarText}
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

      <div className="mb-5 grid grid-cols-1 gap-4 rounded-[22px] bg-[#0f1a2d] p-5 md:grid-cols-3">
        {post.metrics.map((metric) => (
          <div key={metric.id}>
            <div className="mb-1.5 text-xs font-semibold text-slate-500">
              {metric.label}
            </div>
            <div className="flex items-end gap-2">
              <span className="text-[1.55rem] font-black text-white">
                {metric.value}
              </span>
              <span className="pb-1 text-sm font-black text-green-400">
                {metric.change}
              </span>
            </div>
          </div>
        ))}
      </div>

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

export default Home;