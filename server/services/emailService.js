const nodemailer = require('nodemailer');

/** Reusable SMTP transporter — created once and reused across requests. */
const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a booking confirmation email with QR code embedded (CID attachment).
 *
 * Accepts EITHER the old flat params shape OR the new { user, event, ticket, qrImage } shape
 * so existing callers don't break.
 *
 * New shape: { user: { name, email }, event: { title, startDate, venue }, ticket: { tierName, ticketCode }, qrImage }
 * Old shape: { to, attendeeName, bookingRef, eventTitle, eventDate, venueName, totalAmount, qrCode }
 */
const sendBookingConfirmation = async (params) => {
  // ── Normalise into a single shape ──────────────────────────────────────────
  let to, holderName, ticketCode, tierName, eventTitle, eventDate, venueName, totalAmount, qrImage, eventId;

  if (params.user && params.event && params.ticket) {
    // New shape
    to          = params.user.email;
    holderName  = params.user.name || 'Attendee';
    ticketCode  = params.ticket.ticketCode || '';
    tierName    = params.ticket.tierName   || 'General';
    eventTitle  = params.event.title       || 'Event';
    eventDate   = params.event.startDate
      ? new Date(params.event.startDate).toDateString()
      : 'TBD';
    venueName   = params.event.venue
      ? `${params.event.venue.name || ''}, ${params.event.venue.city || ''}`.trim().replace(/^,|,$/g, '')
      : 'TBD';
    totalAmount = params.totalAmount ?? 0;
    qrImage     = params.qrImage || null;
    eventId     = params.event._id || params.event.id || '';
  } else {
    // Legacy flat shape
    to          = params.to;
    holderName  = params.attendeeName  || 'Attendee';
    ticketCode  = params.bookingRef    || '';
    tierName    = 'General';
    eventTitle  = params.eventTitle    || 'Event';
    eventDate   = params.eventDate     || 'TBD';
    venueName   = params.venueName     || 'TBD';
    totalAmount = params.totalAmount   ?? 0;
    qrImage     = params.qrCode        || params.qrImage || null;
    eventId     = params.eventId       || '';
  }

  // ── Build HTML ──────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Booking Confirmed — ${eventTitle}</title>
</head>
<body style="font-family:Arial,sans-serif;background:#f4f6fb;margin:0;padding:0">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden">

    <div style="background:linear-gradient(135deg,#0A1931,#1a1a4e);padding:32px 24px;text-align:center">
      <h1 style="color:#00B4D8;margin:0;font-size:26px">🎉 EventHub</h1>
      <p style="color:rgba(255,255,255,0.8);margin:6px 0 0">Booking Confirmed!</p>
    </div>

    <div style="padding:32px 24px;background:#f9f9f9">
      <p style="font-size:16px">Hi <strong>${holderName}</strong>,</p>
      <p>Your ticket has been confirmed. Show the QR code below at the venue entrance.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333;width:35%">Event</td>
          <td style="padding:10px 12px;color:#333">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:bold;color:#333">Date</td>
          <td style="padding:10px 12px;color:#333">${eventDate}</td>
        </tr>
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333">Venue</td>
          <td style="padding:10px 12px;color:#333">${venueName}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:bold;color:#333">Tier</td>
          <td style="padding:10px 12px;color:#333">${tierName}</td>
        </tr>
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333">Ticket ID</td>
          <td style="padding:10px 12px;color:#333;font-family:monospace">${ticketCode}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;font-weight:bold;color:#333">Event ID</td>
          <td style="padding:10px 12px;color:#333;font-family:monospace;font-size:12px">${eventId}</td>
        </tr>
        ${totalAmount > 0 ? `
        <tr style="background:#e8f4fd">
          <td style="padding:10px 12px;font-weight:bold;color:#333">Amount Paid</td>
          <td style="padding:10px 12px;color:#333">₹${Number(totalAmount).toLocaleString('en-IN')}</td>
        </tr>` : ''}
      </table>

      ${qrImage ? `
      <div style="text-align:center;margin:28px 0;padding:20px;background:#fff;border-radius:8px;border:1px solid #e2e8f0">
        <h3 style="color:#0A1931;margin:0 0 8px">Your Entry QR Code</h3>
        <p style="color:#dc2626;font-weight:bold;font-size:13px;margin:0 0 16px">
          ⚠️ Valid for ONE entry only. Do not share this QR code.
        </p>
        <img src="cid:entry_qr_code" alt="Entry QR Code"
             style="width:220px;height:220px;border:3px solid #0A1931;border-radius:8px;display:block;margin:0 auto"/>
      </div>` : ''}
    </div>

    <div style="background:#0A1931;padding:14px;text-align:center">
      <p style="color:#64748b;margin:0;font-size:12px">
        Built with ❤️ by Brajdeep Singh — EventHub 2026 &nbsp;|&nbsp; GLA University BridgeLab Mini Project
      </p>
    </div>
  </div>
</body>
</html>`;

  // ── Send ────────────────────────────────────────────────────────────────────
  const mailOptions = {
    from:    process.env.EMAIL_FROM,
    to,
    subject: `🎟️ Booking Confirmed — ${eventTitle} (${ticketCode})`,
    html,
  };

  // Embed QR as CID attachment — works in Gmail / Outlook without being blocked
  if (qrImage) {
    const base64Data = qrImage.includes('base64,')
      ? qrImage.split('base64,')[1]
      : qrImage;

    mailOptions.attachments = [
      {
        filename:    'entry-qr.png',
        content:     base64Data,
        encoding:    'base64',
        contentType: 'image/png',
        cid:         'entry_qr_code', // matches cid: in html img src
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
