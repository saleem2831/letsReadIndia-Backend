import pkg from "aws-sdk";
import sharp from "sharp";
import { v4 as uuid } from "uuid";

const AWS = pkg.default || pkg;

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

/**
 * Upload gallery image to S3
 */
export const uploadGalleryImageToS3 = async (file) => {
  try {
    const compressed = await sharp(file.buffer)
      .resize(1600)
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `gallery/${uuid()}.jpg`;

    const upload = await s3
      .upload({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: compressed,
        ContentType: "image/jpeg",
      })
      .promise();

    return {
      image_url: upload.Location,
      s3_key: key,
    };
  } catch (err) {
    console.error("Gallery Upload Error:", err);
    throw err;
  }
};

/**
 * Delete gallery image from S3
 */
export const deleteGalleryImageFromS3 = async (key) => {
  try {
    await s3
      .deleteObject({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
      })
      .promise();

    return true;
  } catch (err) {
    console.error("Gallery Delete Error:", err);
    throw err;
  }
};