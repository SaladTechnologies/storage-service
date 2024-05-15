import { AutoRouter, withContent, cors, IRequest } from "itty-router";
import { AuthedRequest, CFArgs } from "./types";
import { uploadFile, downloadFile, deleteFile, listFiles } from "./routes";
import { authRequest } from "./middleware";

const { preflight, corsify } = cors();

const router = AutoRouter<IRequest, CFArgs>({
  before: [preflight],
  after: [corsify],
});

router.put<AuthedRequest>(
  "/organizations/:organization_name/files/:filename",
  authRequest,
  withContent,
  uploadFile
);

router.get<AuthedRequest>(
  "/organizations/:organization_name/files/:filename",
  authRequest,
  downloadFile
);

router.delete<AuthedRequest>(
  "/organizations/:organization_name/files/:filename",
  authRequest,
  deleteFile
);

router.get<AuthedRequest>(
  "/organizations/:organization_name/files",
  authRequest,
  listFiles
);

export default { ...router };
