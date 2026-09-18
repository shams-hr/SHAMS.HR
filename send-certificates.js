const admin = require("firebase-admin");
const { Resend } = require("resend");
const puppeteer = require("puppeteer");
const CERT_ASSETS = require("./certificate-assets");

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
    const nameEn = escapeHtml(contract.nameEn || contract.name || "Volunteer");
    const nationalId = escapeHtml(contract.nationalId || "—");
    const dept = escapeHtml(contract.dept || "غير محدد");
    const deptEn = escapeHtml(contract.deptEn || contract.dept || "Not specified");
    const startDate = formatDate(contract.startDate);
    const endDate = formatDate(contract.endDate);

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">

<style>

@page {
  size: A4 landscape;
  margin: 0;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  width: 297mm;
  height: 210mm;
  font-family: Arial, "Tahoma", sans-serif;
  background: #f8f6f2;
  color: #6d2041;
}

.page {
  width: 297mm;
  height: 210mm;
  position: relative;
  overflow: hidden;
  background: #f8f6f2;
}

.watermark {
  position: absolute;
  top: 50%;
  left: 52%;
  width: 210mm;
  opacity: 1;
  transform: translate(-50%, -50%);
  z-index: 0;
}

.namaa-logo {
  position: absolute;
  top: 8mm;
  right: 12mm;
  width: 24mm;
  z-index: 2;
}

.header {
  position: relative;
  z-index: 1;
  text-align: center;
  margin-top: 9mm;
}

.title {
  font-size: 40px;
  font-weight: bold;
  color: #6d2041;
}

.subtitle {
  margin-top: 3mm;
  font-size: 23px;
  letter-spacing: 1px;
  color: #6d2041;
}

.body-row {
  position: relative;
  z-index: 1;
  margin-top: 10mm;
  min-height: 95mm;
}

.col {
  position: absolute;
  top: 0;
  width: 44%;
  font-size: 17px;
  line-height: 1.6;
  color: #6d2041;
}

.col.en {
  left: 16mm;
  direction: ltr;
  text-align: left;
  padding-left: 4mm;
}

.col.ar {
  right: 16mm;
  direction: rtl;
  text-align: right;
  padding-right: 4mm;
}

.field-row {
  margin-top: 5mm;
}

.field-label {
  font-weight: bold;
  color: #b08a39;
}

.field-value {
  font-weight: bold;
  color: #6d2041;
}

.plain-label {
  color: #6d2041;
}

.dept-line {
  margin-top: 6mm;
}

.dates-line {
  margin-top: 2mm;
  font-weight: bold;
  color: #b08a39;
}

.closing {
  margin-top: 6mm;
  text-align: justify;
}

.footer {
  position: absolute;
  z-index: 1;
  bottom: 10mm;
  left: 16mm;
  right: 16mm;
  height: 38mm;
}

.seal-block {
  position: absolute;
  left: 0;
  bottom: 0;
  text-align: center;
}

.seal-label {
  font-weight: bold;
  font-size: 16px;
  color: #6d2041;
  margin-bottom: 2mm;
}

.seal-logo {
  width: 55mm;
}

.sign-block {
  position: absolute;
  right: 0;
  bottom: 0;
  text-align: right;
  direction: rtl;
}

.sign-title {
  font-weight: bold;
  font-size: 16px;
  color: #6d2041;
}

.sign-name {
  font-weight: bold;
  font-size: 16px;
  color: #6d2041;
}

.sign-image {
  width: 42mm;
  margin-top: 2mm;
}

</style>
</head>

<body>

<div class="page">

  <img class="watermark" src="${CERT_ASSETS.SUN_WATERMARK}" alt="" />
  <img class="namaa-logo" src="${CERT_ASSETS.LOGO_NAMAA}" alt="" />

  <div class="header">
    <div class="title">شهادة خبرة عمل تطوعي</div>
    <div class="subtitle">VOLUNTEER WORK EXPERIENCE CIRTIFICATE</div>
  </div>

  <div class="body-row">

    <div class="col en">
      <div>Witnessing the management of the SHAMS Volunteer Team affiliated with Makkah Association.</div>

      <div class="field-row">
        <span class="field-value">${nameEn}</span>
        <span class="field-label"> / Administrator</span>
      </div>
      <div class="field-row">
        <span class="plain-label">ID number: </span>
        <span class="field-value">${nationalId}</span>
      </div>

      <div class="dept-line">Administrator of the ${deptEn} Department</div>
      <div class="dates-line">From ${startDate} To ${endDate}</div>

      <div class="closing">
        He demonstrated commitment and responsibility throughout his tenure, took initiative in carrying
        out assigned tasks, maintained a strong focus on work quality, and demonstrated effective
        collaboration and a strong team spirit.
      </div>
    </div>

    <div class="col ar">
      <div>تشهد إدارة فريق شمس التطوعي التابع إلى جمعية نماء المكية ان</div>

      <div class="field-row">
        <span class="field-label">الإداري : </span>
        <span class="field-value">${name}</span>
      </div>
      <div class="field-row">
        <span class="plain-label">رقم الهوية : </span>
        <span class="field-value">${nationalId}</span>
      </div>

      <div class="dept-line">عمل بمنصب عضو في قسم ${dept}</div>
      <div class="dates-line">بتاريخ ${startDate} إلى ${endDate}</div>

      <div class="closing">
        تميز خلال فترة عمله بالالتزام والمسؤولية، والمبادرة في أداء المهام الموكل إليها، والحرص على
        جودة العمل، إلى جانب تعاونه الفعّال وتمتعه بروح الفريق
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="seal-block">
      <div class="seal-label">الختم</div>
      <img class="seal-logo" src="${CERT_ASSETS.LOGO_SHAMS_SEAL}" alt="" />
    </div>

    <div class="sign-block">
      <div class="sign-title">الرئيس التنفيذي</div>
      <div class="sign-name">عبدالإله الشمراني</div>
      <img class="sign-image" src="${CERT_ASSETS.SIGNATURE}" alt="" />
    </div>
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
      landscape: true,
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
        "shamshr <certificates@shamshr.me>",

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
          content: Buffer.from(pdf).toString("base64"),
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
