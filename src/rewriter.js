/**
 * rewriter.js
 * إعادة صياغة التغريدات باستخدام Claude AI
 */

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function rewriteTweets(tweets) {
  console.log(`\n🤖 جاري إعادة صياغة ${tweets.length} تغريدة...`);

  const results = [];
  let done = 0;

  for (const tweet of tweets) {
    try {
      const suggestion = await rewriteOne(tweet.text);

      results.push({
        original_id: tweet.id,
        original_text: tweet.text,
        original_date: tweet.created_at,
        original_likes: tweet.likes,
        original_retweets: tweet.retweets,
        suggested_tweet: suggestion.tweet || "",
        category: suggestion.category || "عام",
        score: typeof suggestion.score === "number" ? suggestion.score : 5,
        status: "لم ينشر",
        notes: "",
      });

      done++;
      if (done % 5 === 0 || done === tweets.length) {
        console.log(`   ⏳ ${done}/${tweets.length}`);
      }

      await sleep(500);
    } catch (err) {
      console.error(`   ⚠️ خطأ في تغريدة ${tweet.id}: ${err.message}`);
    }
  }

  console.log(`✅ تمت إعادة صياغة ${results.length} تغريدة`);
  return results;
}

async function rewriteOne(originalText) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `أنت متخصص في إنشاء المحتوى لشركة عقارية سعودية تهتم بالتوعية وتثقيف المجتمع.

أعد صياغة هذه التغريدة بأسلوب تثقيفي عقاري مناسب:
"${originalText}"

القواعد:
- أسلوب تثقيفي موثوق بعربية سلسة
- التغريدة كاملة في فقرة واحدة (لا تقسمها لأجزاء)
- لا تقل عن 280 حرف
- بدون هاشتاقات أو إيموجي
- أضف قيمة عقارية
