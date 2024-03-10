const AWS = require("aws-sdk");
const {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const S3 = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIAXYKJRJZNPLKWJNM5",
    secretAccessKey: "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",
  },
});

const getObjectURL = async (key) => {
  const command = new GetObjectCommand({
    Bucket: "s3-baatein",
    Key: key,
  });
  const url = await getSignedUrl(S3, command);
  return url;
};

 async function putObject(key, type) {
  const command = new PutObjectCommand({
    Bucket: "s3-baatein",
    Key: `/${key}`,
    ContentType: type,
  });

  const url = await getSignedUrl(S3, command);
  return url;
}

async function init() {
    console.log("URL", await getObjectURL('/video-Sun Mar 10 2024 21:16:18 GMT+0530 (India Standard Time).mp4'))
}

// async function init() {
//   console.log(
//     "URL for uploading",
//     await putObject(`video-${Date()}.mp4`, "video/mp4")
//   );
// }



module.exports = {
  putObject

}
