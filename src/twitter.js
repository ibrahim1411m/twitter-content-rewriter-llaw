/**
 * twitter.js
 * جلب التغريدات عبر Apify
 * Actor: kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest
 */

import { ApifyClient } from "apify-client";

const ACTOR_ID = "kaitoeasyapi/twitter-x-data-tweet-scraper-pay-per-result-cheapest";

export async function fetchTweets(username, maxResults = 100) {
  console.log(`\n📥 جاري جلب تغريدات @${username} عبر Apify...`);

  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("مفتاح APIFY_TOKEN غير موجود");
  }

  const client = new ApifyClient({ token });

  // إعدادات الـ Actor
  const input = {
    searchTerms: [`from:${username} -filter:replies`],
    maxItems: maxResults,
    queryType: "Latest",
    lang: "ar",
  };

  console.log(`   🔄 تشغيل الـ Actor (قد يستغرق دقيقة-دقيقتين)...`);

  // تشغيل الـ Actor وانتظار النتيجة
  const run = await client.actor(ACTOR_ID).call(input);

  console.log(`   ✅ اكتمل التشغيل، جاري قراءة النتائج...`);

  // قراءة النتائج من الـ Dataset
  const { items } = await client.dataset(run.defaultDatasetId).listItems();

  if (!items || items.length === 0) {
    throw new Error("لم يتم جلب أي تغريدات. تحقق من اسم الحساب أو الرصيد.");
  }

  console.log(`✅ تم جلب ${items.length} تغريدة`);

  // تحويل البيانات لصيغة موحدة
  const tweets = items
    .map(normalizeTweet)
    .filter((t) => t.text && t.text.length >= 20);

  // استخراج معلومات الحساب من أول تغريدة
  const firstItem = items[0];
  const user = {
    username: firstItem.author?.userName || username,
    name: firstItem.author?.name || username,
    bio: firstItem.author?.description || "",
  };

  console.log(`   📊 الحساب: ${user.name} (@${user.username})`);
  console.log(`   📊 تغريدات صالحة: ${tweets.length}`);

  return { user, tweets };
}

/**
 * تحويل بيانات Apify لصيغة موحدة
 */
function normalizeTweet(item) {
  return {
    id: item.id || item.tweetId || "",
    text: item.text || item.fullText || "",
    created_at: item.createdAt || item.created_at || "",
    likes: item.likeCount || item.favoriteCount || 0,
    retweets: item.retweetCount || 0,
    replies: item.replyCount || 0,
    url: item.url || item.twitterUrl || "",
  };
}
