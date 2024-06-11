import fs from "node:fs/promises";
import assert from "node:assert";

const {
  SALAD_API_KEY,
  SALAD_ORG_NAME,
  STORAGE_API_URL = "http://localhost:8787",
  PART_SIZE_MB = "20",
} = process.env;

assert(SALAD_API_KEY, "SALAD_API_KEY must be set");
assert(SALAD_ORG_NAME, "SALAD_ORG_NAME must be set");

export const createUpload = async (filename: string, remotePath: string) => {
  const primaryURL = new URL(
    `/organizations/${SALAD_ORG_NAME}/files/${remotePath}`,
    STORAGE_API_URL
  );
  const createUrl = primaryURL.toString() + "?action=mpu-create";

  const createResp = await fetch(createUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Salad-Api-Key": SALAD_API_KEY,
    },
  });

  if (!createResp.ok) {
    throw new Error(
      `Failed to create multipart upload: ${createResp.statusText}`
    );
  }

  const { uploadId } = (await createResp.json()) as { uploadId: string };
  return uploadId;
};

export const uploadPart = async (
  remotePath: string,
  uploadId: string,
  partNumber: number,
  part: Buffer
) => {
  const primaryURL = new URL(
    `/organizations/${SALAD_ORG_NAME}/file_parts/${remotePath}`,
    STORAGE_API_URL
  );
  const partUrl =
    primaryURL.toString() + `?uploadId=${uploadId}&partNumber=${partNumber}`;

  const partResp = await fetch(partUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/octet-stream",
      "Salad-Api-Key": SALAD_API_KEY,
    },
    body: part,
  });

  if (!partResp.ok) {
    throw new Error(`Failed to upload part: ${partResp.statusText}`);
  }

  const partRespBody = (await partResp.json()) as {
    etag: string;
    partNumber: number;
  };
  return partRespBody;
};

export const completeUpload = async (
  remotePath: string,
  uploadId: string,
  parts: { etag: string; partNumber: number }[]
) => {
  const primaryURL = new URL(
    `/organizations/${SALAD_ORG_NAME}/files/${remotePath}`,
    STORAGE_API_URL
  );
  const completeUrl =
    primaryURL.toString() + `?action=mpu-complete&uploadId=${uploadId}`;

  const completeResp = await fetch(completeUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Salad-Api-Key": SALAD_API_KEY,
    },
    body: JSON.stringify({ parts }),
  });

  if (!completeResp.ok) {
    console.log(await completeResp.text());
    throw new Error(`Failed to complete upload: ${completeResp.statusText}`);
  }

  return completeResp;
};

async function readFileInChunks(
  filePath: string,
  maxChunkSize: number,
  eachChunk: (
    chunkNumber: number,
    chunk: Buffer
  ) => Promise<{ etag: string; partNumber: number }>
): Promise<{ etag: string; partNumber: number }[]> {
  const fileHandle = await fs.open(filePath, "r");
  const fileStats = await fileHandle.stat();
  const totalSize = fileStats.size;
  const numChunks = Math.ceil(totalSize / maxChunkSize);
  const realChunkSize = Math.ceil(totalSize / numChunks);

  let bytesRead = 0;

  let chunkNumber = 1;

  const allChunks = [];

  while (chunkNumber <= numChunks) {
    const buffer = Buffer.alloc(realChunkSize);
    const { bytesRead: bytesJustRead } = await fileHandle.read(
      buffer,
      0,
      realChunkSize,
      bytesRead
    );
    bytesRead += bytesJustRead;
    allChunks.push(eachChunk(chunkNumber, buffer));
    chunkNumber++;
  }

  await fileHandle.close();
  return Promise.all(allChunks);
}

export const uploadFileInParts = async (
  filename: string,
  remotePath: string,
  partSize: number
) => {
  const fileSize = (
    await fs.stat(filename).catch(() => {
      throw new Error(`File not found: ${filename}`);
    })
  ).size;
  const uploadId = await createUpload(filename, remotePath);

  // console.log(
  //   `Uploading ${filename} to ${remotePath} in ${numChunks} parts of ${partSize} bytes`
  // );

  const parts = await readFileInChunks(
    filename,
    partSize,
    async (partNumber, chunk) => {
      const partResp = await uploadPart(
        remotePath,
        uploadId,
        partNumber,
        chunk
      );
      // console.log(`Uploaded part ${partNumber}`);
      return partResp;
    }
  );

  await completeUpload(remotePath, uploadId, parts);
  // console.log("Upload complete");
  const url = new URL(
    `/organizations/${SALAD_ORG_NAME}/files/${remotePath}`,
    STORAGE_API_URL
  ).toString();
  return url;
};

async function main() {
  const filename = process.argv[2];
  const remotePath = process.argv[3] || filename;

  const partSize = parseInt(PART_SIZE_MB) * 1024 * 1024;

  const url = await uploadFileInParts(filename, remotePath, partSize);
  console.log(url);
}

main();
