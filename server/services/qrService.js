const QRCode = require('qrcode');

/**
 * Generates a QR code PNG encoded as a base64 data URL.
 *
 * @param {string} bookingId  - The booking's _id or bookingRef
 * @returns {Promise<string>} base64 data URL  (data:image/png;base64,...)
 */
const generateQR = async (bookingId) => {
  const dataURL = await QRCode.toDataURL(String(bookingId), {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 300,
    color: { dark: '#1a1a2e', light: '#ffffff' },
  });
  return dataURL; // base64 PNG ready to embed in email or store in DB
};

module.exports = { generateQR };
