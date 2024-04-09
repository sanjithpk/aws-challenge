import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import { fromIni } from "@aws-sdk/credential-provider-ini";

const s3Client = new S3Client({
  credentials: fromIni({ profile: "default" }),
});

async function uploadFile(bucketName, fileName) {
  try {
    const fileContent = fs.readFileSync(fileName);

    const params = {
      Bucket: bucketName,
      Key: path.basename(fileName),
      Body: fileContent,
    };

    const data = await s3Client.send(new PutObjectCommand(params));
    console.log("File uploaded successfully. ", data);
  } catch (err) {
    console.log("Error", err);
  }
}

uploadFile("fovus-text-store", "./scripts/script.py");
