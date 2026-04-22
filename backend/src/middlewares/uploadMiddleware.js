const multer = require('multer');

// 1. Setup Memory Storage (No S3 here)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

// Middleware that ONLY parses the multipart data
const parseMultipart = (fieldName, maxFiles) => {
  return upload.array(fieldName, maxFiles);
};

module.exports = parseMultipart;