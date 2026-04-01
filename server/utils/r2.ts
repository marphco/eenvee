import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export const getR2Client = () => {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
};

export const deleteR2Folder = async (folderPath: string) => {
  const client = getR2Client();
  const bucketName = process.env.R2_BUCKET_NAME;
  
  if (!bucketName || !folderPath) return;

  // Assicuriamoci che il prefisso termini con / per colpire la "cartella"
  const prefix = folderPath.endsWith("/") ? folderPath : `${folderPath}/`;

  try {
    const listParams = {
      Bucket: bucketName,
      Prefix: prefix,
    };

    const listedObjects = await client.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) return;

    const deleteParams = {
      Bucket: bucketName,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
      },
    };

    await client.send(new DeleteObjectsCommand(deleteParams));

    // Se ci sono altri oggetti (paginazione), ripeti il processo
    if (listedObjects.IsTruncated) {
      await deleteR2Folder(folderPath);
    }
  } catch (err) {
    console.error("R2 DELETE ERROR:", err);
  }
};
