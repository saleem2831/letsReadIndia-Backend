
// import AWS from 'aws-sdk';
import pkg from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';

const AWS = pkg.default || pkg;


const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

console.log("S3 OBJECT:", s3);
console.log("UPLOAD FUNCTION:", typeof s3.upload);

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
//     ContentType: 'image/jpeg'
//     // ❌ NO ACL HERE
//   }).promise();

//   return upload.Location;
// };


export const uploadToS3 = async (file) => {
  try {
    console.log("FILE:", file);

    const compressed = await sharp(file.buffer)
      .resize(1200)
      .jpeg({ quality: 70 })
      .toBuffer();

    console.log("Compressed size:", compressed.length);

    const key = `products/${uuid()}.jpg`;

    console.log("Uploading to S3...");

    const upload = await s3.upload({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: compressed,
      ContentType: 'image/jpeg'
    }).promise();

    console.log("UPLOAD SUCCESS:", upload);

    return upload.Location;

  } catch (err) {
    console.error("UPLOAD ERROR FULL:", err);
    throw err;
  }
};