/**
 * twitter.js
 * جلب التغريدات من Nitter (بديل مجاني لـ Twitter API)
 */

import * as cheerio from "cheerio";

// قائمة سيرفرات Nitter — يجرب التالي إذا فشل الأول
const NITTER_INSTANCES = [
  "https://nitter.net",
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.cz",
  "https://nitter.tiekoetter.com",
  "https://nitter.kavin.rocks",
  "https://nitter.unixfox.eu",
  "https://nitter.moomoo.me",
];

export async function fetchTweets(username, maxResults = 100) {
  console.log(`\n📥 جاري جلب تغريدات @${username}...`);

  for (const instance of NITTER_INSTANCES) {
    try {
      console.log(`   🔄 محاولة عبر: ${instance}`);
      const result = await scrapeNitter(instance, username, maxResults);
      if (result.tweets.length > 0) {
        console.log(`✅ نجح الجلب من: ${instance}`);
        console.log(`✅ تم جلب ${result.tweets.length} تغريدة`);
        return result;
      }
    } catch (err) {
      console.log(`   ⚠️  فشل: ${err.message}`);
      continue;
    }
  }

  throw new Error("فشلت جميع سيرفرات Nitter. حاول مجدداً بعد قليل.");
}

async function scrapeNitter(baseUrl, username, maxResults) {
  const tweets = [];
  let user = null;
  let cursor = "";
  const maxPages = Math.ceil(maxResults / 20) + 2;

  for (let page = 0; page < maxPages && tweets.length < maxResults; page++) {
    const url = cursor
      ? `${baseUrl}/${username}?cursor=${encodeURIComponent(cursor)}`
      : `${baseUrl}/${username}`;

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ar,en;q=0.9",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    if (!user) {
      const name = $(".profile-card-fullname").text().trim();
      const bio = $(".profile-bio").text().trim();
      const handle = $(".profile-card-username").text().trim().replace("@", "");

      if (!name && !handle) {
        throw new Error("الحساب غير موجود أو السيرفر لا يستجيب");
      }

      user = { username: handle || username, name: name || username, bio };
      console.log(`   ✅ الحساب: ${user.name}`);
    }

    const tweetElements = $(".timeline-item").not(".show-more");
    if (tweetElements.length === 0) break;

    tweetElements.each((_, el) => {
      if (tweets.length >= maxResults) return false;
      const $el = $(el);

      if ($el.find(".retweet-header").length > 0) return;
      if ($el.find(".replying-to").length > 0) return;
      if ($el.find(".pinned").length > 0 && tweets.length > 0) return;

      const text = $el.find(".tweet-content").text().trim();
      if (!text || text.length < 20) return;

      const dateAttr =
        $el.find(".tweet-date a").attr("title") ||
        $el.find(".tweet-date a").attr("href") || "";
      const link = $el.find(".tweet-date a").attr("href") || "";
      const id = link.split("/").pop()?.split("#")[0] || "";

      const stats = {};
      $el.find(".tweet-stats .tweet-stat").each((_, stat) => {
        const $stat = $(stat);
        const icon = $stat.find(".icon-comment").length
          ? "replies"
          : $stat.find(".icon-retweet").length
          ? "retweets"
          : $stat.find(".icon-heart").length
          ? "likes"
          : null;
        if (icon) {
          const value = $stat.text().trim().replace(/,/g, "");
          stats[icon] = parseInt(value, 10) || 0;
        }
      });

      tweets.push({
        id,
        text,
        created_at: dateAttr,
        likes: stats.likes || 0,
        retweets: stats.retweets || 0,
      });
    });

    const showMoreLink = $(".show-more a").attr("href") || "";
    const cursorMatch = showMoreLink.match(/cursor=([^&]+)/);
    if (!cursorMatch) break;
    cursor = decodeURIComponent(cursorMatch[1]);

    await new Promise((r) => setTimeout(r, 500));
  }

  return { user, tweets };
}
