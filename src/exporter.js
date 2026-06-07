/**
 * exporter.js
 * تصدير النتائج كملف Excel وMarkdown
 */

import ExcelJS from "exceljs";
import fs from "fs/promises";
import path from "path";

export async function exportResults(data, outputDir = "./output") {
  await fs.mkdir(outputDir, { recursive: true });

  const { user, results } = data;
  const date = new Date().toISOString().slice(0, 10);
  const username = user.username || "account";
  const baseName = `${username}_${date}`;

  // تصدير Excel
  const xlsxPath = path.join(outputDir, `${baseName}.xlsx`);
  await exportExcel(results, xlsxPath, user);

  // تصدير Markdown
  const mdPath = path.join(outputDir, `${baseName}.md`);
  await exportMarkdown(results, mdPath, user, date);

  return { xlsxPath, mdPath };
}

async function exportExcel(results, filePath, user) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Twitter Realestate Rewriter";
  workbook.created = new Date();

  // ورقة المحتوى الرئيسية
  const sheet = workbook.addWorksheet("المحتوى", {
    views: [{ rightToLeft: true }],
  });

  // تعريف الأعمدة
  sheet.columns = [
    { header: "م", key: "index", width: 5 },
    { header: "التاريخ الأصلي", key: "original_date", width: 14 },
    { header: "التصنيف", key: "category", width: 18 },
    { header: "التقييم", key: "score", width: 10 },
    { header: "التغريدة الأصلية", key: "original_text", width: 45 },
    { header: "المقترح الجديد", key: "suggested_tweet", width: 45 },
    { header: "خيط التغريدة", key: "suggested_thread", width: 40 },
    { header: "الوسوم", key: "hashtags", width: 30 },
    { header: "الإعجابات", key: "original_likes", width: 12 },
    { header: "الحالة", key: "status", width: 14 },
    { header: "ملاحظات", key: "notes", width: 25 },
  ];

  // تنسيق رأس الجدول
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E79" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 30;

  // إضافة البيانات
  results.forEach((item, index) => {
    const row = sheet.addRow({
      index: index + 1,
      original_date: item.original_date
        ? new Date(item.original_date).toLocaleDateString("ar-SA")
        : "",
      category: item.category,
      score: item.score,
      original_text: item.original_text,
      suggested_tweet: item.suggested_tweet,
      suggested_thread: item.suggested_thread,
      hashtags: item.hashtags,
      original_likes: item.original_likes,
      status: item.status,
      notes: item.notes,
    });

    // تنسيق تبادلي للصفوف
    if (index % 2 === 0) {
      row.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF2F7FC" },
      };
    }

    // لون خلية الحالة
    const statusCell = row.getCell("status");
    statusCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFF3CD" },
    };
    statusCell.alignment = { horizontal: "center" };

    // لون خلية التقييم حسب الرقم
    const scoreCell = row.getCell("score");
    scoreCell.alignment = { horizontal: "center" };
    if (item.score >= 8) {
      scoreCell.font = { color: { argb: "FF198754" }, bold: true };
    } else if (item.score >= 6) {
      scoreCell.font = { color: { argb: "FFFD7E14" } };
    } else {
      scoreCell.font = { color: { argb: "FFDC3545" } };
    }

    // تفاف النص في خلايا المحتوى
    row.getCell("original_text").alignment = { wrapText: true, vertical: "top" };
    row.getCell("suggested_tweet").alignment = { wrapText: true, vertical: "top" };
    row.getCell("suggested_thread").alignment = { wrapText: true, vertical: "top" };

    row.height = 60;
  });

  // تجميد السطر الأول
  sheet.views = [{ state: "frozen", ySplit: 1, rightToLeft: true }];

  // ورقة ملخص
  const summarySheet = workbook.addWorksheet("ملخص", {
    views: [{ rightToLeft: true }],
  });

  const categories = {};
  results.forEach((r) => {
    categories[r.category] = (categories[r.category] || 0) + 1;
  });

  summarySheet.addRow(["حساب المصدر", `@${user.username}`]);
  summarySheet.addRow(["اسم الحساب", user.name]);
  summarySheet.addRow(["تاريخ الاستخراج", new Date().toLocaleDateString("ar-SA")]);
  summarySheet.addRow(["إجمالي التغريدات", results.length]);
  summarySheet.addRow([]);
  summarySheet.addRow(["التصنيف", "العدد"]);
  Object.entries(categories).forEach(([cat, count]) => {
    summarySheet.addRow([cat, count]);
  });

  summarySheet.columns = [{ width: 25 }, { width: 20 }];

  await workbook.xlsx.writeFile(filePath);
  console.log(`✅ Excel: ${filePath}`);
}

async function exportMarkdown(results, filePath, user, date) {
  let md = `# محتوى @${user.username} — ${date}\n`;
  md += `**الحساب:** ${user.name} | **التغريدات:** ${results.length}\n\n---\n\n`;

  results.forEach((item, i) => {
    md += `## ${i + 1}. ${item.category} (${item.score}/10)\n\n`;
    md += `**الأصلي:**\n> ${item.original_text}\n\n`;
    md += `**المقترح:**\n> ${item.suggested_tweet}\n\n`;
    if (item.suggested_thread) {
      md += `**الخيط:**\n${item.suggested_thread
        .split("\n---\n")
        .map((t) => `> ${t}`)
        .join("\n")}\n\n`;
    }
    md += `**الوسوم:** ${item.hashtags}\n\n---\n\n`;
  });

  await fs.writeFile(filePath, md, "utf-8");
  console.log(`✅ Markdown: ${filePath}`);
}
