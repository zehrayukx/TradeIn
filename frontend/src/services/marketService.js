import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  withCredentials: true,
});

export const getMarkets = async ({
  category = "Tümü",
  sort = "gainers",
  search = "",
  onlyFavorites = false,
}) => {
  try {
    const response = await api.get("/api/markets", {
      params: {
        category,
        sort,
        search,
        onlyFavorites,
      },
    });

    return response.data;
  } catch (error) {
    throw (
      error?.response?.data?.detail ||
      "Piyasalar alınırken hata oluştu."
    );
  }
};

export const getMarketNews = async () => {
  try {
    const response = await api.get("/api/markets/news");
    return response.data;
  } catch (error) {
    throw "Haberler alınamadı.";
  }
};

export const getMarketCalendar = async () => {
  try {
    const response = await api.get("/api/markets/calendar");
    return response.data;
  } catch (error) {
    throw "Takvim verileri alınamadı.";
  }
};

export const getMarketSentiment = async () => {
  try {
    const response = await api.get("/api/markets/sentiment");
    return response.data;
  } catch (error) {
    throw "Duyarlılık verisi alınamadı.";
  }
};

export const addFavorite = async (symbol) => {
  try {
    const response = await api.post(
      `/api/markets/favorites/${symbol}`
    );

    return response.data;
  } catch (error) {
    throw "Favori eklenemedi.";
  }
};

export const removeFavorite = async (symbol) => {
  try {
    const response = await api.delete(
      `/api/markets/favorites/${symbol}`
    );

    return response.data;
  } catch (error) {
    throw "Favori kaldırılamadı.";
  }
};