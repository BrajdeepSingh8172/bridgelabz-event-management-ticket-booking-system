const nodemailer = require('nodemailer');

/** Reusable SMTP transporter — created once and reused across requests. */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465, // true for port 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a booking confirmation email with QR code embedded.
 *
 * @param {{ to: string, attendeeName: string, bookingRef: string,
 *           eventTitle: string, eventDate: string, venueName: string,
 *           totalAmount: number, qrCode: string }} options
 */
const sendBookingConfirmation = async ({
  to,
  attendeeName,
  bookingRef,
  eventTitle,
  eventDate,
  venueName,
  totalAmount,
  qrCode,
}) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Booking Confirmation</title>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .wrapper { max-width: 600px; margin: 32px auto; background: #fff; border-radius: 12px;
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .header  { background: linear-gradient(135deg,#6c47ff,#00c6ff); padding: 32px 24px; text-align: center; }
    .header h1 { color:#fff; margin:0; font-size:26px; }
    .header p  { color:rgba(255,255,255,0.85); margin:6px 0 0; }
    .body    { padding: 32px 24px; }
    .detail  { display:flex; justify-content:space-between; border-bottom:1px solid #eee;
               padding:10px 0; font-size:15px; }
    .detail span:first-child { color:#666; }
    .detail span:last-child  { font-weight:600; color:#1a1a2e; }
    .qr      { text-align:center; margin:28px 0 0; }
    .qr img  { width:180px; height:180px; border:4px solid #6c47ff; border-radius:8px; }
    .qr p    { color:#888; font-size:13px; margin-top:8px; }
    .footer  { text-align:center; padding:16px; background:#f4f6fb; color:#aaa; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>🎉 Booking Confirmed!</h1>
      <p>Your ticket has been reserved successfully</p>
    </div>
    <div class="body">
      <p>Hi <strong>${attendeeName}</strong>,</p>
      <p>Here are your booking details:</p>

      <div class="detail"><span>Booking Ref</span><span>#${bookingRef}</span></div>
      <div class="detail"><span>Event</span><span>${eventTitle}</span></div>
      <div class="detail"><span>Date</span><span>${eventDate}</span></div>
      <div class="detail"><span>Venue</span><span>${venueName}</span></div>
      <div class="detail"><span>Total Paid</span><span>₹${totalAmount.toLocaleString('en-IN')}</span></div>

      <div class="qr">
        <img src="cid:qr_code_image" alt="QR Code" />
        <p>Show this QR at the venue entrance</p>
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Event Platform. All rights reserved.
    </div>
  </div>
</body>
</html>`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Booking Confirmed – ${eventTitle} (#${bookingRef})`,
    html,
  };

  if (qrCode) {
    mailOptions.attachments = [
      {
        filename: 'qrcode.png',
        path: qrCode, // Nodemailer happily accepts Data URLs in the path property
        cid: 'qr_code_image', // matches the cid: in the html img src
      },
    ];
  }

  await transporter.sendMail(mailOptions);
};

/**
 * Generic email sender for custom notifications.
 */
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

module.exports = { sendBookingConfirmation, sendEmail };
