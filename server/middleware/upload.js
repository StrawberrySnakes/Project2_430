// middleware/upload.js
// Multer config for media file uploads (video/image).
// Files land in hosted/uploads/ and are served at /assets/uploads/

const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadDir = path.resolve(__dirname, '../../hosted/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const fileFilter = (_req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo',
  ];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and videos are allowed.'), false);
};

// Use memory storage so sharp can process before writing to disk
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Runs after multer — compresses images, passes videos through untouched
const processUpload = async (req, res, next) => {
  if (!req.file) return next();

  const isImage = req.file.mimetype.startsWith('image/');
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const ext = isImage ? '.webp' : path.extname(req.file.originalname).toLowerCase();
  const filename = `${unique}${ext}`;
  const outPath = path.join(uploadDir, filename);

  try {
    if (isImage) {
      // Resize to max 1200px wide, convert to webp, compress
      await sharp(req.file.buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outPath);
    } else {
      // Write video buffer directly — sharp doesn't handle video
      fs.writeFileSync(outPath, req.file.buffer);
    }

    // Mimic what disk storage would have set so controllers work unchanged
    req.file.filename = filename;
    req.file.path = outPath;

    next();
  } catch (err) {
    console.error('Upload processing error:', err);
    return res.status(500).json({ error: 'Failed to process uploaded file.' });
  }
};

module.exports = { upload, processUpload };