const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { cloudinary } = require('../config/cloudinary');
const ApiError = require('../utils/ApiError');

/**
 * Cloudinary storage for event banner images.
 */
const eventBannerStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'event-management/events',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 720, crop: 'fill' }],
  },
});

/**
 * Cloudinary storage for user avatars.
 */
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'event-management/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
  },
});

/** File-type filter: images only */
const imageFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files are allowed'), false);
  }
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const uploadEventBanner = multer({
  storage: eventBannerStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('bannerImage');

const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
}).single('avatar');

module.exports = { uploadEventBanner, uploadAvatar };
