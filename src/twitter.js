/**
 * twitter.js
 * جلب آخر 100 تغريدة من حساب تويتر
 */

import { TwitterApi } from "twitter-api-v2";

export async function fetchTweets(username, maxResults = 100) {
  console.log(`\n📥 جاري جلب تغريدات @${username}...`);

  const client = new TwitterApi({
    appKey: process.env.TWITTER_API_KEY,
    appSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.TWITTER_ACCESS_SECRET,
  });

  // جلب بيانات الحساب
  const userResponse = await client.v2.userByUsername(username, {
    "user.fields": ["id", "name", "description", "public_metrics"],
  });

  if (!userResponse.data) {
    throw new Error(`لم يتم العثور على الحساب @${username}`);
  }

  const user = userResponse.data;
  console.log(`✅ الحساب: ${user.name} (@${username})`);

  // جلب التغريدات
  const timeline = await client.v2.userTimeline(user.id, {
    max_results: Math.min(maxResults, 100),
    "tweet.fields": ["created_at", "text", "public_metrics", "lang"],
    exclude: ["retweets", "replies"],
  });

  const tweets = [];
  for await (const tweet of timeline) {
    // تخطي التغريدات القصيرة جداً
    if (tweet.text.length < 20) continue;

    tweets.push({
      id: tweet.id,
      text: tweet.text,
      created_at: tweet.created_at,
      lang: tweet.lang,
      likes: tweet.public_metrics?.like_count || 0,
      retweets: tweet.public_metrics?.retweet_count || 0,
    });
  }

  console.log(`✅ تم جلب ${tweets.length} تغريدة`);
  return { user, tweets };
}
