// frontend/src/services/api.js

export const getHomePageData = async () => {
  // Backend'e bağlanamadığı durumlarda sayfayı boş bırakmamak için mock veri
  return {
    tickerItems: [
      { id: 1, symbol: "BTC", price: "$64,230", change: "+%2.4", isUp: true },
      { id: 2, symbol: "ETH", price: "$3,450", change: "-%1.2", isUp: false },
    ],
    categories: ["Trendler", "Kripto", "Borsa", "Döviz", "Emtia"],
    trends: [
      { id: 1, tag: "#BIST100", count: "12.5K", isUp: true, change: "%2.4" },
      { id: 2, tag: "#BITCOIN", count: "45.2K", isUp: false, change: "%1.2" }
    ],
    suggestedUsers: [
      { id: 1, name: "Ali Yılmaz", handle: "@aliyilmaz", followers: "12K Takipçi", avatarText: "A", accent: "from-blue-500 to-cyan-500", verified: true },
      { id: 2, name: "Zehra Kaya", handle: "@zehrak", followers: "8.4K Takipçi", avatarText: "Z", accent: "from-purple-500 to-pink-500", verified: false }
    ]
  };
};