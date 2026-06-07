/**
 * github.js
 * رفع الملفات تلقائياً إلى GitHub
 */

import { Octokit } from "@octokit/rest";
import fs from "fs/promises";

export async function uploadToGitHub(xlsxPath, mdPath, username, date) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO; // ibrahim1411m/twitter-realestate-content-rewriter
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !repo) {
    console.log("⚠️  GITHUB_TOKEN غير محدد — تم تخطي الرفع على GitHub");
    return null;
  }

  const [owner, repoName] = repo.split("/");
  const octokit = new Octokit({ auth: token });
  const folder = `content/${username}/${date}`;

  console.log(`\n📤 جاري الرفع على GitHub...`);

  const files = [
    { localPath: xlsxPath, remoteName: `${username}_${date}.xlsx` },
    { localPath: mdPath, remoteName: `${username}_${date}.md` },
  ];

  const uploadedUrls = [];

  for (const file of files) {
    const remotePath = `${folder}/${file.remoteName}`;
    const content = await fs.readFile(file.localPath);
    const base64 = content.toString("base64");

    // تحقق من وجود الملف لأخذ SHA (للتحديث)
    let sha;
    try {
      const existing = await octokit.repos.getContent({
        owner,
        repo: repoName,
        path: remotePath,
        ref: branch,
      });
      sha = existing.data.sha;
    } catch {
      // ملف جديد
    }

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo: repoName,
      path: remotePath,
      message: `📊 محتوى @${username} — ${date}`,
      content: base64,
      branch,
      ...(sha ? { sha } : {}),
    });

    const url = `https://github.com/${repo}/blob/${branch}/${remotePath}`;
    uploadedUrls.push({ name: file.remoteName, url });
    console.log(`   ✅ ${file.remoteName}`);
  }

  // تحديث ملف الفهرس
  await updateIndex(octokit, owner, repoName, branch, username, date, folder);

  return uploadedUrls;
}

async function updateIndex(octokit, owner, repo, branch, username, date, folder) {
  const indexPath = "content/README.md";

  let existingContent = `# 📚 فهرس المحتوى العقاري\n\n| الحساب | التاريخ | Excel | تقرير |\n|--------|---------|-------|-------|\n`;
  let sha;

  try {
    const existing = await octokit.repos.getContent({
      owner,
      repo,
      path: indexPath,
      ref: branch,
    });
    existingContent = Buffer.from(existing.data.content, "base64").toString("utf-8");
    sha = existing.data.sha;
  } catch {
    // ملف جديد
  }

  const xlsxLink = `[تحميل](${folder}/${username}_${date}.xlsx)`;
  const mdLink = `[عرض](${folder}/${username}_${date}.md)`;
  const newRow = `| @${username} | ${date} | ${xlsxLink} | ${mdLink} |\n`;

  // أضف السطر بعد رأس الجدول إذا كان الملف جديداً، أو في النهاية
  const updatedContent = existingContent + newRow;

  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: indexPath,
    message: `📑 تحديث الفهرس — @${username} ${date}`,
    content: Buffer.from(updatedContent, "utf-8").toString("base64"),
    branch,
    ...(sha ? { sha } : {}),
  });

  console.log(`   ✅ تم تحديث الفهرس`);
}
