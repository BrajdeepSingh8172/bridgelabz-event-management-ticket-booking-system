const cloudinary = require('cloudinary').v2;

/**
 * Configures the Cloudinary SDK from environment variables.
 * Called once during app bootstrap (app.js).
 */
const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('✅  Cloudinary configured');
};

module.exports = { cloudinary, connectCloudinary };
