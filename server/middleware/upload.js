// server/middleware/upload.js
// Multer config using Cloudinary for persistent cloud storage.
// Images are auto-compressed by Cloudinary; videos are stored as-is.

const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// CloudinaryStorage handles upload directly — no local disk needed
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (_req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'lrdc-archive',
      resource_type: isVideo ? 'video' : 'image',
      // Images: auto-compress and convert to webp
      format: isVideo ? undefined : 'webp',
      transformation: isVideo ? undefined : [
        { width: 1200, crop: 'limit', quality: 'auto' },
      ],
    };
  },
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and videos are allowed.'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// No separate processUpload needed — Cloudinary storage handles everything.
// We export a no-op so router.js doesn't need to change.
const processUpload = (_req, _res, next) => next();

module.exports = { upload, processUpload };