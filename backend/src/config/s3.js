const AWS = require('aws-sdk');
const path = require('path');
const crypto = require('crypto');


const bucketName = process.env.AWS_S3_BUCKET_NAME;
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const uploadToS3 = async (buffer, mimetype, originalname) => {
  if (!bucketName || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return `local://${Date.now()}-${originalname}`;
  }

  const key = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(originalname)}`;
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  };

  const result = await s3.upload(params).promise();
  return result.Location;
};

module.exports = { uploadToS3 };
