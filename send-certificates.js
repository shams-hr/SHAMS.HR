const admin = require("firebase-admin");
const { Resend } = require("resend");
const puppeteer = require("puppeteer");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

function todaySaudi() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Riyadh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function calculateDuration(start, end, storedDuration) {
  if (storedDuration) {
    return `${storedDuration} شهر`;
  }

  if (!start || !end) {
    return "—";
  }

  const s = new Date(start);
  const e = new Date(end);

  if (isNaN(s) || isNaN(e)) {
    return "—";
  }

  let months =
    (e.getFullYear() - s.getFullYear()) * 12 +
    (e.getMonth() - s.getMonth());

  if (e.getDate() >= s.getDate()) {
    months++;
  }

  return `${Math.max(1, months)} شهر`;
}

function formatDate(dateString) {
  if (!dateString) return "—";

  const parts = String(dateString).split("-");

  if (parts.length !== 3) {
    return dateString;
  }

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

async function createCertificatePdf(contract) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    const name = escapeHtml(contract.name || "المتطوع");
    const nationalId = escapeHtml(contract.nationalId || "—");
    const email = escapeHtml(contract.email || "—");
    const dept = escapeHtml(contract.dept || "غير محدد");
    const startDate = formatDate(contract.startDate);
    const endDate = formatDate(contract.endDate);
    const duration = calculateDuration(
      contract.startDate,
      contract.endDate,
      contract.duration
    );

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">

<style>

@page {
  size: A4;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  width: 210mm;
  min-height: 297mm;
  font-family: Arial, "Tahoma", sans-serif;
  background: #ffffff;
  color: #111827;
  direction: rtl;
}

.page {
  width: 210mm;
  min-height: 297mm;
  padding: 22mm;
  position: relative;
  overflow: hidden;
}

.border {
  position: absolute;
  inset: 10mm;
  border: 2px solid #111827;
  pointer-events: none;
}

.inner-border {
  position: absolute;
  inset: 13mm;
  border: 1px solid #9ca3af;
  pointer-events: none;
}

.header {
  text-align: center;
  margin-top: 15mm;
}

.logo {
  font-size: 26px;
  font-weight: bold;
  margin-bottom: 6px;
}

.team {
  font-size: 18px;
  font-weight: bold;
}

.title {
  margin-top: 28mm;
  text-align: center;
  font-size: 30px;
  font-weight: bold;
}

.subtitle {
  text-align: center;
  font-size: 17px;
  margin-top: 8mm;
  color: #4b5563;
}

.content {
  margin-top: 22mm;
  font-size: 17px;
  line-height: 2.2;
  text-align: justify;
}

.name {
  font-size: 23px;
  font-weight: bold;
  text-align: center;
  margin: 10mm 0;
}

.info {
  margin-top: 12mm;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
}

.row {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.row:last-child {
  border-bottom: none;
}

.label {
  width: 35%;
  padding: 9px;
  background: #f3f4f6;
  font-weight: bold;
}

.value {
  width: 65%;
  padding: 9px;
}

.footer {
  position: absolute;
  bottom: 25mm;
  right: 22mm;
  left: 22mm;
  text-align: center;
  font-size: 13px;
  color: #6b7280;
}

.signature {
  margin-top: 25mm;
  text-align: left;
  padding-left: 15mm;
  font-size: 15px;
}

</style>
</head>

<body>

<div class="page">

<div class="border"></div>
<div class="inner-border"></div>

<div class="header">
  <div class="logo">شمس التطوعي</div>
  <div class="team">فريق شمس التطوعي</div>
</div>

<div class="title">
  شهادة خبرة تطوعية
</div>

<div class="subtitle">
  يشهد فريق شمس التطوعي بأن
</div>

<div class="name">
  ${name}
</div>

<div class="content">

قد شارك في أعمال وأنشطة فريق شمس التطوعي خلال فترة التطوع الموضحة أدناه،
وأدى المهام التطوعية الموكلة إليه خلال مدة مشاركته، وقد أتم فترة التطوع
المسجلة في النظام بنجاح.

</div>

<div class="info">

  <div class="row">
    <div class="label">رقم الهوية</div>
    <div class="value">${nationalId}</div>
  </div>

  <div class="row">
    <div class="label">البريد الإلكتروني</div>
    <div class="value">${email}</div>
  </div>

  <div class="row">
    <div class="label">القسم / الإدارة</div>
    <div class="value">${dept}</div>
  </div>

  <div class="row">
    <div class="label">بداية التطوع</div>
    <div class="value">${startDate}</div>
  </div>

  <div class="row">
    <div class="label">نهاية التطوع</div>
    <div class="value">${endDate}</div>
  </div>

  <div class="row">
    <div class="label">مدة التطوع</div>
    <div class="value">${duration}</div>
  </div>

</div>

<div class="signature">
  فريق شمس التطوعي
  <br>
  إدارة الموارد البشرية
</div>

<div class="footer">
  تم إصدار هذه الشهادة إلكترونياً بواسطة نظام إدارة الموارد البشرية
  لفريق شمس التطوعي.
</div>

</div>

</body>
</html>
`;

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
    });
  } finally {
    await browser.close();
  }
}

async function logSystemAction(action, details) {
  try {
    await db.collection("logs").add({
      action,
      details,
      username: "SYSTEM",
      role: "SYSTEM",
      createdAt: Date.now(),
    });
  } catch (error) {
    console.error("LOG ERROR:", error);
  }
}

async function processContract(contractDoc, today) {
  const contract = {
    id: contractDoc.id,
    ...contractDoc.data(),
  };

  if (!contract.email) {
    console.log(`تجاهل ${contract.id}: لا يوجد بريد إلكتروني.`);
    return;
  }

  if (!contract.endDate) {
    console.log(`تجاهل ${contract.id}: لا يوجد تاريخ انتهاء.`);
    return;
  }

  if (contract.status === "cancelled") {
    console.log(`تجاهل ${contract.id}: العقد ملغي.`);
    return;
  }

  if (contract.certificateSent === true) {
    console.log(`تجاهل ${contract.id}: الشهادة أرسلت مسبقاً.`);
    return;
  }

  if (contract.certificateStatus === "sending") {
    console.log(`تجاهل ${contract.id}: جاري الإرسال.`);
    return;
  }

  if (contract.endDate > today) {
    console.log(`تجاهل ${contract.id}: العقد لم ينتهِ.`);
    return;
  }

  const contractRef = db.collection("contracts").doc(contract.id);

  const claimed = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(contractRef);

    if (!snap.exists) {
      return false;
    }

    const data = snap.data();

    if (
      data.certificateSent === true ||
      data.certificateStatus === "sending"
    ) {
      return false;
    }

    if (data.status === "cancelled") {
      return false;
    }

    transaction.update(contractRef, {
      certificateStatus: "sending",
      certificateError: null,
    });

    return true;
  });

  if (!claimed) {
    console.log(`لم يتم حجز العقد ${contract.id}.`);
    return;
  }

  try {
    console.log(`إنشاء شهادة: ${contract.name}`);

    const pdf = await createCertificatePdf(contract);

    const fileName =
      `شهادة خبرة تطوعية - ${contract.name || "المتطوع"}.pdf`;

    const result = await resend.emails.send({
      from:
        process.env.MAIL_FROM ||
        "onboarding@resend.dev",

      to: [contract.email],

      subject:
        "شهادة الخبرة التطوعية - فريق شمس التطوعي",

      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;line-height:2">

          <h2>السلام عليكم ورحمة الله وبركاته</h2>

          <p>
            الأستاذ/ة <strong>${escapeHtml(contract.name || "")}</strong>
          </p>

          <p>
            نرفق لكم شهادة الخبرة التطوعية الصادرة من
            <strong>فريق شمس التطوعي</strong>.
          </p>

          <p>
            نشكركم على مشاركتكم وجهودكم التطوعية.
          </p>

          <p>
            مع خالص التحية،
            <br>
            إدارة الموارد البشرية
            <br>
            فريق شمس التطوعي
          </p>

        </div>
      `,

      attachments: [
        {
          filename: fileName,
          content: pdf.toString("base64"),
        },
      ],
    });

    await contractRef.update({
      certificateStatus: "sent",
      certificateSent: true,
      certificateSentAt: admin.firestore.FieldValue.serverTimestamp(),
      certificateError: null,
      resendEmailId: result?.data?.id || null,
    });

    await logSystemAction(
      "إرسال شهادة خبرة",
      `تم إرسال شهادة الخبرة للمتطوع ${contract.name || ""} - الهوية ${contract.nationalId || ""} - البريد ${contract.email}`
    );

    console.log(`تم إرسال الشهادة بنجاح: ${contract.name}`);
  } catch (error) {
    console.error(
      `فشل إرسال الشهادة للـ ${contract.id}:`,
      error
    );

    await contractRef.update({
      certificateStatus: "error",
      certificateSent: false,
      certificateError:
        String(error?.message || error).slice(0, 1000),
    });

    await logSystemAction(
      "فشل إرسال شهادة",
      `فشل إرسال شهادة ${contract.name || ""} - ${String(error?.message || error).slice(0, 500)}`
    );
  }
}

async function main() {
  const today = todaySaudi();

  console.log("====================================");
  console.log("شمس التطوعي - إرسال الشهادات");
  console.log("التاريخ:", today);
  console.log("====================================");

  const snapshot = await db.collection("contracts").get();

  console.log(
    `تم العثور على ${snapshot.size} عقد.`
  );

  for (const contractDoc of snapshot.docs) {
    await processContract(contractDoc, today);
  }

  console.log("انتهت عملية إرسال الشهادات.");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("ERROR:", error);
    process.exit(1);
  });
