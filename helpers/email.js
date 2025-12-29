import nodemailer from "nodemailer";

export async function sendAdminEmail({ subject, text }) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com", // SMTP host
      port: process.env.EMAIL_PORT || 587,              // SMTP port (TLS)
      secure: false, // true for port 465 (SSL), false for 587 (TLS)
      auth: {
        user: process.env.EMAIL_USER, // tumhara email
        pass: process.env.EMAIL_PASS, // app password (Gmail/Outlook)
      },
    });

    await transporter.sendMail({
      from: `"Inventory System" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject,
      text,
    });

    console.log("Admin email sent successfully!");
  } catch (err) {
    console.error("Failed to send admin email:", err);
  }
}
