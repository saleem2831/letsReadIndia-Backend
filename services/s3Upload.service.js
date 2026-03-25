// import AWS from 'aws-sdk';
// import sharp from 'sharp';
// import { v4 as uuid } from 'uuid';

// const s3 = new AWS.S3({
//   region: process.env.AWS_REGION,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

// export const uploadToS3 = async (file) => {
//   const compressed = await sharp(file.buffer)
//     .resize(1200)
//     .jpeg({ quality: 70 })
//     .toBuffer();

//   const key = `products/${uuid()}.jpg`;

//   const upload = await s3.upload({
//     Bucket: process.env.AWS_BUCKET_NAME,
//     Key: key,
//     Body: compressed,
//     ContentType: 'image/jpeg',
//     ACL: 'public-read'
//   }).promise();

//   return upload.Location; // Public URL
// };
import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

export const uploadToS3 = async (file) => {
  const compressed = await sharp(file.buffer)
    .resize(1200)
    .jpeg({ quality: 70 })
    .toBuffer();

  const key = `products/${uuid()}.jpg`;

  const upload = await s3.upload({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: compressed,
    ContentType: 'image/jpeg'
    // ❌ NO ACL HERE
  }).promise();

  return upload.Location;
};
