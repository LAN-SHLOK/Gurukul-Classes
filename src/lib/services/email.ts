import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export async function sendPasswordResetEmail(email: string, code: string, firstName: string) {
  const mailOptions = {
    from: `"Gurukul Classes" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Verification Code | Gurukul Classes',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
        <h2 style="color: #4a3728; text-align: center; margin-bottom: 5px;">Gurukul Classes</h2>
        <p style="text-align: center; color: #888; font-size: 13px; margin-top: 0;">Foundation for Future</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p>Hello <b>${firstName}</b>,</p>
        <p>Your password reset verification code is:</p>
        <div style="background: #4a3728; color: white; text-align: center; padding: 18px; border-radius: 8px; font-size: 32px; letter-spacing: 8px; font-family: monospace; margin: 20px 0;">
          ${code}
        </div>
        <p>This code is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="text-align: center; color: #aaa; font-size: 11px;">&copy; 2026 Gurukul Classes | All Rights Reserved</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}

export async function sendInquiryNotification(inquiry: {
  first_name: string;
  last_name: string;
  email: string;
  class_name: string;
  message?: string;
  created_at?: Date;
}) {
  const timestamp = inquiry.created_at
    ? new Date(inquiry.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })
    : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const mailOptions = {
    from: `"Gurukul Classes" <${process.env.EMAIL_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || "Gurukulclasses001@gmail.com",
    subject: `New Inquiry — ${inquiry.first_name} ${inquiry.last_name} | Gurukul Classes`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
        <h2 style="color: #4a3728; text-align: center; margin-bottom: 5px;">Gurukul Classes</h2>
        <p style="text-align: center; color: #888; font-size: 13px; margin-top: 0;">New Inquiry Received</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; color: #555; font-weight: bold; width: 140px;">Full Name</td><td style="padding: 8px 0;">${inquiry.first_name} ${inquiry.last_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #555; font-weight: bold;">Email</td><td style="padding: 8px 0;"><a href="mailto:${inquiry.email}" style="color: #4a3728;">${inquiry.email}</a></td></tr>
          <tr><td style="padding: 8px 0; color: #555; font-weight: bold;">Class</td><td style="padding: 8px 0;">${inquiry.class_name}</td></tr>
          <tr><td style="padding: 8px 0; color: #555; font-weight: bold;">Submitted</td><td style="padding: 8px 0;">${timestamp}</td></tr>
          ${inquiry.message ? `<tr><td style="padding: 8px 0; color: #555; font-weight: bold; vertical-align: top;">Message</td><td style="padding: 8px 0;">${inquiry.message}</td></tr>` : ""}
        </table>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="text-align: center; color: #aaa; font-size: 11px;">&copy; 2026 Gurukul Classes | All Rights Reserved</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendInquiryConfirmation(inquiry: {
  first_name: string;
  email: string;
}) {
  const mailOptions = {
    from: `"Gurukul Classes" <${process.env.EMAIL_USER}>`,
    to: inquiry.email,
    subject: "We received your inquiry | Gurukul Classes",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
        <h2 style="color: #4a3728; text-align: center; margin-bottom: 5px;">Gurukul Classes</h2>
        <p style="text-align: center; color: #888; font-size: 13px; margin-top: 0;">Foundation for Future</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p>Hello <b>${inquiry.first_name}</b>,</p>
        <p>Thank you for reaching out to Gurukul Classes! We have received your inquiry and our team will get back to you shortly.</p>
        <p>In the meantime, feel free to explore our website or contact us directly:</p>
        <ul style="color: #555;">
          <li>Email: <a href="mailto:Gurukulclasses001@gmail.com" style="color: #4a3728;">Gurukulclasses001@gmail.com</a></li>
          <li>Instagram: <a href="https://instagram.com/edukulam_" style="color: #4a3728;">@edukulam_</a></li>
        </ul>
        <p>We look forward to welcoming you to the Gurukul family.</p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        <p style="text-align: center; color: #aaa; font-size: 11px;">&copy; 2026 Gurukul Classes | All Rights Reserved</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const mailOptions = {
    from: `"Gurukul Classes" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to the Gurukul Family! 🎓",
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 0; border: 1px solid #eee; border-radius: 16px; overflow: hidden; background: #ffffff; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
        <!-- Hero Section -->
        <div style="background: linear-gradient(135deg, #2D31FA 0%, #1a1db8 100%); padding: 60px 40px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -1px;">Welcome, ${firstName}!</h1>
          <p style="margin: 10px 0 0; opacity: 0.8; font-size: 16px; font-weight: 500;">Your journey towards academic excellence starts here.</p>
        </div>

        <!-- content -->
        <div style="padding: 40px;">
          <p style="font-size: 16px; color: #333; line-height: 1.6;">
            We are thrilled to welcome you to <b>Gurukul Classes</b>. You have officially joined a community dedicated to building strong foundations and achieving elite results.
          </p>
          
          <div style="background: #f8f9ff; border-radius: 12px; padding: 25px; margin: 30px 0; border-left: 4px solid #2D31FA;">
            <h3 style="margin: 0 0 10px; color: #2D31FA; font-size: 18px;">What's next for you?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.6;">
              <li style="margin-bottom: 8px;">Explore your <b>Personalized Dashboard</b></li>
              <li style="margin-bottom: 8px;">Access high-quality <b>AI Study Notes</b></li>
              <li style="margin-bottom: 8px;">Connect with our <b>Academic Mentor</b></li>
              <li>Stay updated with the latest <b>Schedule & Announcements</b></li>
            </ul>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <a href="https://gurukulclasses.in/dashboard" style="background: #2D31FA; color: white; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(45,49,250,0.3);">
              Go to My Dashboard
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 14px; color: #888; text-align: center; line-height: 1.6;">
            Need help? Reach out to us at <br>
            <a href="mailto:Gurukulclasses001@gmail.com" style="color: #2D31FA; text-decoration: none; font-weight: 600;">Gurukulclasses001@gmail.com</a>
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #fafafa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #bbb; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 2px;">
            &copy; 2026 Gurukul Classes | Foundation for Future
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
}
