import { RequestHandler, IRequest, error } from "itty-router";
import { CFArgs, AuthedRequest } from "./types";

export const getBaseUrl = (request: IRequest): string => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

export const uploadFile: RequestHandler<AuthedRequest, CFArgs> = async (
  request,
  env,
  ctx
) => {
  if (!request.content) {
    return new Response("No file uploaded", { status: 400 });
  }

  const contentType = request.headers.get("content-type");

  if (!contentType || !contentType.includes("multipart/form-data")) {
    return error(400, "Invalid content type. Must be multipart/form-data");
  }

  // Verify that request.content is a FormData object
  const formData = request.content as FormData;

  const file = formData.get("file");
  const extension = formData.get("extension");
  const mimeType = formData.get("mimeType");

  if (!file) {
    return error(400, "No file uploaded");
  }

  let fileId = crypto.randomUUID();
  if (extension) {
    fileId += `.${extension}`;
  }
  let key = `${request.orgId}/${fileId}`;

  let opts: R2PutOptions = !!mimeType
    ? {
        httpMetadata: {
          contentType: mimeType.toString(),
        },
      }
    : {};

  await env.BUCKET.put(key, file, opts);

  const url = new URL(
    `/organizations/${request.params.organization_name}/files/${fileId}`,
    getBaseUrl(request)
  );

  return { url: url.toString() };
};
