# 🏢 Twitter → محتوى عقاري تثقيفي

أداة تجلب تغريدات حسابات تويتر المختارة وتعيد صياغتها بأسلوب تثقيفي عقاري، ثم تصدّرها كملف Excel وMarkdown.

---

## 🚀 طريقة التشغيل من GitHub

### الخطوة ١ — إضافة المفاتيح السرية

اذهب إلى: **Settings → Secrets and variables → Actions → New repository secret**

أضف هذه المفاتيح:

| الاسم | من أين تحصل عليه |
|-------|-----------------|
| `TWITTER_API_KEY` | [developer.twitter.com](https://developer.twitter.com) |
| `TWITTER_API_SECRET` | نفس المصدر |
| `TWITTER_ACCESS_TOKEN` | نفس المصدر |
| `TWITTER_ACCESS_SECRET` | نفس المصدر |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) |

> ملاحظة: `GITHUB_TOKEN` يُضاف تلقائياً من GitHub، لا تحتاج إضافته.

---

### الخطوة ٢ — تشغيل العملية

1. اذهب إلى تبويب **Actions**
2. اختر **"جلب وإعادة صياغة المحتوى"**
3. اضغط **"Run workflow"**
4. حدد اسم الحساب وعدد التغريدات
5. اضغط **"Run workflow"** الخضراء

---

### الخطوة ٣ — النتائج

بعد انتهاء العملية (5-10 دقائق) ستجد:

**في مجلد `content/`:**
```
content/
├── README.md                          ← فهرس بكل الملفات
└── ahmed_alshuhail/
    └── 2025-06-02/
        ├── ahmed_alshuhail_2025-06-02.xlsx   ← ملف Excel
        └── ahmed_alshuhail_2025-06-02.md     ← تقرير للقراءة
```

**في تبويب Actions:**
- اضغط على آخر تشغيل → **Artifacts** → حمّل ملف `content-...`

---

## 📊 شكل ملف Excel

| م | التاريخ | التصنيف | التقييم | التغريدة الأصلية | المقترح الجديد | خيط التغريدة | الوسوم | الإعجابات | الحالة | ملاحظات |
|---|---------|---------|---------|-----------------|----------------|--------------|--------|-----------|--------|---------|
| 1 | 2025-06-01 | توعية عقارية | 9 | النص الأصلي... | المقترح... | تغريدة 2... | #عقارات | 45 | لم ينشر | |

- **التقييم** من 1-10: أخضر (8+) برتقالي (6-7) أحمر (أقل من 6)
- **الحالة**: يغيّرها المحرر يدوياً بعد النشر

---

## 🗂️ هيكل المشروع

```
├── index.js                    ← نقطة الدخول
├── src/
│   ├── twitter.js              ← جلب التغريدات
│   ├── rewriter.js             ← إعادة الصياغة بـ Claude AI
│   ├── exporter.js             ← تصدير Excel وMarkdown
│   └── github.js               ← رفع الملفات على GitHub
├── .github/
│   └── workflows/
│       └── fetch-content.yml   ← GitHub Actions
├── .env.example
└── package.json
```

---

## 💻 التشغيل المحلي (اختياري)

```bash
git clone https://github.com/ibrahim1411m/twitter-realestate-content-rewriter
cd twitter-realestate-content-rewriter
npm install
cp .env.example .env
# أضف مفاتيحك في .env
node index.js --account ahmed_alshuhail --max 100
```
