#!/usr/bin/env node
/**
 * index.js — نقطة الدخول الرئيسية
 */

import { config } from "dotenv";
import { parseArgs } from "util";
import { fetchTweets } from "./src/twitter.js";
import { rewriteTweets } from "./src/rewriter.js";
import { exportResults } from "./src/exporter.js";
import { uploadToGitHub } from "./src/github.js";

config();

console.log(`
╔══════════════════════════════════════════╗
║   Twitter → محتوى عقاري تثقيفي          ║
╚══════════════════════════════════════════╝
`);

async function main() {
  // قراءة الخيارات
  const { values } = parseArgs({
    options: {
      account: { type: "string", short: "a", default: "ahmed_alshuhail" },
      max: { type: "string", short: "m", default: "100" },
      output: { type: "string", short: "o", default: "./output" },
    },
  });

  const username = values.account;
  const max = parseInt(values.max, 10);
  const outputDir = values.output;

  // التحقق من المفاتيح المطلوبة
  checkEnv();

  try {
    // ١. جلب التغريدات
    const { user, tweets } = await fetchTweets(username, max);

    // ٢. إعادة الصياغة
    const results = await rewriteTweets(tweets);

    // ٣. تصدير Excel + Markdown محلياً
    console.log("\n💾 جاري التصدير...");
    const date = new Date().toISOString().slice(0, 10);
    const { xlsxPath, mdPath } = await exportResults({ user, results }, outputDir);

    // ٤. رفع على GitHub
    const uploaded = await uploadToGitHub(xlsxPath, mdPath, username, date);

    // ملخص
    console.log("\n" + "═".repeat(45));
    console.log("✅ اكتملت العملية");
    console.log("═".repeat(45));
    console.log(`📊 تغريدات: ${tweets.length} جُلبت | ${results.length} أُعيدت صياغتها`);
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

function checkEnv() {
  const required = [
    "ANTHROPIC_API_KEY",
    "TWITTER_API_KEY",
    "TWITTER_API_SECRET",
    "TWITTER_ACCESS_TOKEN",
    "TWITTER_ACCESS_SECRET",
  ];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    console.error("❌ مفاتيح مفقودة في ملف .env:");
    missing.forEach((k) => console.error(`   • ${k}`));
    process.exit(1);
  }
}

main();
