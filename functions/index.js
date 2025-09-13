/*
functions/index.js - Firebase Functions v2 cho NewsAPI - Proxy lấy tin tức trực tiếp
Không lưu trữ gì hết, chỉ làm proxy gọi NewsAPI và trả về
*/

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fetch = require("node-fetch");

// NewsAPI configuration
// Với v2 bạn nên set biến môi trường: firebase functions:config:set newsapi.key="API_KEY"
const NEWS_API_KEY =
  process.env.NEWSAPI_KEY ||
  "febdc563f64247a390f393337c8b707a"; // fallback nếu chưa set
const NEWS_API_BASE_URL = "https://newsapi.org/v2";

/**
 * HTTP Function để lấy tin tức trực tiếp từ NewsAPI - 2nd Gen
 * Endpoint: /social_media_News
 * Method: POST
 */
exports.social_media_News = onRequest(
  {
    region: "us-central1",
    cors: true,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (req, res) => {
    // Xử lý preflight request (CORS)
    if (req.method === "OPTIONS") {
      res.set("Access-Control-Allow-Origin", "*");
      res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type");
      res.status(204).send("");
      return;
    }

    try {
      const { category = "general", country = "us", pageSize = 20 } = req.body;

      // Gọi NewsAPI trực tiếp
      const apiUrl = `${NEWS_API_BASE_URL}/top-headlines?country=${country}&category=${category}&pageSize=${pageSize}&apiKey=${NEWS_API_KEY}`;
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status !== "ok") {
        throw new Error(data.message || "NewsAPI error");
      }

      // Filter và clean articles
      const cleanedArticles = data.articles
        .filter(
          (article) =>
            article.title &&
            article.title !== "[Removed]" &&
            article.url &&
            article.source?.name
        )
        .map((article) => ({
          title: article.title,
          description: article.description || "",
          url: article.url,
          urlToImage: article.urlToImage || "",
          publishedAt: article.publishedAt,
          source: { name: article.source.name },
          content: article.content || "",
        }));

      res.json({
        status: "ok",
        totalResults: cleanedArticles.length,
        articles: cleanedArticles,
      });
    } catch (error) {
      logger.error("Error fetching news:", error);
      res.status(500).json({
        error: "Failed to fetch news",
        message: error.message,
      });
    }
  }
);
