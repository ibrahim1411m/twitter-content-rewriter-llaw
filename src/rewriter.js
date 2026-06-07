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
        // البيانات الأصلية
        original_id: tweet.id,
        original_text: tweet.text,
        original_date: tweet.created_at,
        original_likes: tweet.likes,
        original_retweets: tweet.retweets,

        // المقترح الجديد
        suggested_tweet: suggestion.tweet,
        suggested_thread: suggestion.thread.join("\n---\n"),
        hashtags: suggestion.hashtags.join(" "),
        category: suggestion.category,
        score: suggestion.score,

        // حالة النشر (للمحرر)
        status: "لم ينشر",
        notes: "",
      });

      done++;
      if (done % 10 === 0 || done === tweets.length) {
        console.log(`   ⏳ ${done}/${tweets.length}`);
      }

      // تأخير بسيط بين الطلبات
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
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `أنت متخصص في إنشاء المحتوى لشركة عقارية سعودية تهتم بالتوعية وتثقيف المجتمع.

أعد صياغة هذه التغريدة بأسلوب تثقيفي عقاري مناسب:
"${originalText}"

القواعد:
- أسلوب تثقيفي موثوق بعربية سلسة
- التغريدة الرئيسية أقل من 280 حرف
- أضف قيمة عقارية حقيقية
- لا تنسخ النص حرفياً

أجب بـ JSON فقط بهذا الشكل:
{
  "tweet": "نص التغريدة الرئيسية",
  "thread": ["تغريدة تكميلية 1", "تغريدة تكميلية 2"],
  "hashtags": ["#وسم1", "#وسم2", "#وسم3"],
  "category": "التصنيف (توعية عقارية / نصائح استثمارية / أخبار السوق / تمويل عقاري)",
  "score": 8
}`,
      },
    ],
  });

  const text = response.content[0].text;
  const clean = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(clean);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
