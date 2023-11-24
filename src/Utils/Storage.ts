import { Client } from "minio";

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  // I tried to fix it.. but it's not working
  port: parseInt(process.env.MINIO_PORT),
  useSSL: process.env.MINIO_USE_SSL === "true",
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

function UploadFile(
  uuid: string,
  filename: string,
  buffer: Buffer,
  mimetype: string,
  size: number
) {
  const metaData = {
    "Content-Type": mimetype,
  };

  minioClient.putObject(
    process.env.MINIO_BUCKET_NAME,
    `${uuid}/${filename}`,
    buffer,
    size,
    metaData,
    (err, etag) => {
      if (err) {
        throw new Error(`Error uploading file \n ${err}`);
      }

      return;
    }
  );
}

export { UploadFile };
