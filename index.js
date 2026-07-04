#!/usr/bin/env node
import { config } from "dotenv";
import { parseArgs } from "util";
import { fetchTweets } from "./src/twitter.js";
import { rewriteTweets } from "./src/rewriter.js";
import { exportResults } from "./src/exporter.js";
import { uploadToGitHub } from "./src/github.js";

config();

console.log(`
╔══════════════════════════════════════════╗
║   Twitter → محتوى تثقيفي                ║
║   (مدعوم بـ Apify)                      ║
╚══════════════════════════════════════════╝
`);

async function main() {
  const { values } = parseArgs({
    options: {
      account: { type: "string", short: "a", default: "ahmed_alshuhail" },
      max: { type: "string", short: "m", default: "100" },
      mode: { type: "string", short: "d", default: "rewrite" },
      output: { type: "string", short: "o", default: "./output" },
    },
  });

  const username = values.account.replace("@", "");
  const max = parseInt(values.max, 10);
  const mode = values.mode;
  const outputDir = values.output;

  checkEnv(mode);

  console.log(`📋 الإعدادات:`);
  console.log(`   • الحساب: @${username}`);
  console.log(`   • العدد:  ${max} تغريدة`);
  console.log(`   • الوضع:  ${mode === "rewrite" ? "جلب + إعادة صياغة" : "جلب فقط"}`);

  try {
    const { user, tweets } = await fetchTweets(username, max);

    if (tweets.length === 0) {
      console.log("⚠️  لم يتم جلب أي تغريدات");
      process.exit(1);
    }

    // إذا fetch_only — تخطي إعادة الصياغة
    let results;
    if (mode === "fetch_only") {
      console.log("\n📋 وضع الجلب فقط — بدون إعادة صياغة");
      results = tweets.map((tweet) => ({
        original_id: tweet.id,
        original_text: tweet.text,
        original_date: tweet.created_at,
        original_likes: tweet.likes,
        original_retweets: tweet.retweets,
      }));
    } else {
      results = await rewriteTweets(tweets);
    }

    console.log("\n💾 جاري التصدير...");
    const date = new Date().toISOString().slice(0, 10);
    const { xlsxPath, mdPath } = await exportResults(
      { user, results },
      outputDir,
      mode
    );

    const uploaded = await uploadToGitHub(xlsxPath, mdPath, username, date);

    console.log("\n" + "═".repeat(45));
    console.log("✅ اكتملت العملية");
    console.log("═".repeat(45));
    console.log(`📊 تغريدات: ${tweets.length} جُلبت`);
    if (mode === "rewrite") {
      console.log(`✏️  تغريدات أُعيدت صياغتها: ${results.length}`);
    }
    console.log(`📁 Excel:    ${xlsxPath}`);
    console.log(`📄 Markdown: ${mdPath}`);

    if (uploaded) {
      console.log(`\n🔗 روابط GitHub:`);
      uploaded.forEach((f) => console.log(`   • ${f.url}`));
    }

    console.log("");
  } catch (err) {
    console.error("\n❌ خطأ:", err.message);
    if (process.env.DEBUG) console.error(err);
    process.exit(1);
  }
}

function checkEnv(mode) {
  const required = ["APIFY_TOKEN"];
  if (mode === "rewrite") required.push("ANTHROPIC_API_KEY");

  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("❌ مفاتيح مفقودة:");
    missing.forEach((k) => console.error(`   • ${k}`));
    process.exit(1);
  }
}

main();
