import { AutoRouter, withContent, cors, IRequest } from "itty-router";
import { AuthedRequest, CFArgs } from "./types";
import {
  uploadFile,
  downloadFile,
  deleteFile,
  listFiles,
  signFile,
  uploadPart,
} from "./routes";
import { authRequest } from "./middleware";

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, CFArgs>({
  before: [preflight],
  after: [corsify],
});

router.put<AuthedRequest>(
  "/organizations/:organization_name/files/:filename+",
  authRequest,
  withContent,
  uploadFile
);

router.put<AuthedRequest>(
  "/organizations/:organization_name/file_parts/:filename+",
  authRequest,
  withContent,
  uploadPart
);

router.post<AuthedRequest>(
  "/organizations/:organization_name/file_tokens/:filename+",
  authRequest,
  withContent,
  signFile
);

router.get<AuthedRequest>(
  "/organizations/:organization_name/files/:filename+",
  authRequest,
  downloadFile
);

router.delete<AuthedRequest>(
  "/organizations/:organization_name/files/:filename+",
  authRequest,
  deleteFile
);

router.get<AuthedRequest>(
  "/organizations/:organization_name/files",
  authRequest,
  listFiles
);

export default { ...router };
