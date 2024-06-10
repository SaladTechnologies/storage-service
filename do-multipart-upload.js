"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadFileInParts = exports.completeUpload = exports.uploadPart = exports.createUpload = void 0;
var promises_1 = __importDefault(require("node:fs/promises"));
var node_assert_1 = __importDefault(require("node:assert"));
var _a = process.env, SALAD_API_KEY = _a.SALAD_API_KEY, SALAD_ORG_NAME = _a.SALAD_ORG_NAME, _b = _a.STORAGE_API_URL, STORAGE_API_URL = _b === void 0 ? "http://localhost:8787" : _b, _c = _a.PART_SIZE_MB, PART_SIZE_MB = _c === void 0 ? "20" : _c;
(0, node_assert_1.default)(SALAD_API_KEY, "SALAD_API_KEY must be set");
(0, node_assert_1.default)(SALAD_ORG_NAME, "SALAD_ORG_NAME must be set");
var createUpload = function (filename, remotePath) { return __awaiter(void 0, void 0, void 0, function () {
    var primaryURL, createUrl, createResp, uploadId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                primaryURL = new URL("/organizations/".concat(SALAD_ORG_NAME, "/files/").concat(remotePath), STORAGE_API_URL);
                createUrl = primaryURL.toString() + "?action=mpu-create";
                return [4 /*yield*/, fetch(createUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Salad-Api-Key": SALAD_API_KEY,
                        },
                    })];
            case 1:
                createResp = _a.sent();
                if (!createResp.ok) {
                    throw new Error("Failed to create multipart upload: ".concat(createResp.statusText));
                }
                return [4 /*yield*/, createResp.json()];
            case 2:
                uploadId = (_a.sent()).uploadId;
                return [2 /*return*/, uploadId];
        }
    });
}); };
exports.createUpload = createUpload;
var uploadPart = function (remotePath, uploadId, partNumber, part) { return __awaiter(void 0, void 0, void 0, function () {
    var primaryURL, partUrl, partResp, partRespBody;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                primaryURL = new URL("/organizations/".concat(SALAD_ORG_NAME, "/file_parts/").concat(remotePath), STORAGE_API_URL);
                partUrl = primaryURL.toString() + "?uploadId=".concat(uploadId, "&partNumber=").concat(partNumber);
                return [4 /*yield*/, fetch(partUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/octet-stream",
                            "Salad-Api-Key": SALAD_API_KEY,
                        },
                        body: part,
                    })];
            case 1:
                partResp = _a.sent();
                if (!partResp.ok) {
                    throw new Error("Failed to upload part: ".concat(partResp.statusText));
                }
                return [4 /*yield*/, partResp.json()];
            case 2:
                partRespBody = (_a.sent());
                return [2 /*return*/, partRespBody];
        }
    });
}); };
exports.uploadPart = uploadPart;
var completeUpload = function (remotePath, uploadId, parts) { return __awaiter(void 0, void 0, void 0, function () {
    var primaryURL, completeUrl, completeResp, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                primaryURL = new URL("/organizations/".concat(SALAD_ORG_NAME, "/files/").concat(remotePath), STORAGE_API_URL);
                completeUrl = primaryURL.toString() + "?action=mpu-complete&uploadId=".concat(uploadId);
                return [4 /*yield*/, fetch(completeUrl, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                            "Salad-Api-Key": SALAD_API_KEY,
                        },
                        body: JSON.stringify({ parts: parts }),
                    })];
            case 1:
                completeResp = _c.sent();
                if (!!completeResp.ok) return [3 /*break*/, 3];
                _b = (_a = console).log;
                return [4 /*yield*/, completeResp.text()];
            case 2:
                _b.apply(_a, [_c.sent()]);
                throw new Error("Failed to complete upload: ".concat(completeResp.statusText));
            case 3: return [2 /*return*/, completeResp];
        }
    });
}); };
exports.completeUpload = completeUpload;
function readFileInChunks(filePath, maxChunkSize, eachChunk) {
    return __awaiter(this, void 0, void 0, function () {
        var fileHandle, fileStats, totalSize, numChunks, realChunkSize, bytesRead, chunkNumber, allChunks, buffer, bytesJustRead;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promises_1.default.open(filePath, "r")];
                case 1:
                    fileHandle = _a.sent();
                    return [4 /*yield*/, fileHandle.stat()];
                case 2:
                    fileStats = _a.sent();
                    totalSize = fileStats.size;
                    numChunks = Math.ceil(totalSize / maxChunkSize);
                    realChunkSize = Math.ceil(totalSize / numChunks);
                    bytesRead = 0;
                    chunkNumber = 1;
                    allChunks = [];
                    _a.label = 3;
                case 3:
                    if (!(chunkNumber <= numChunks)) return [3 /*break*/, 5];
                    buffer = Buffer.alloc(realChunkSize);
                    return [4 /*yield*/, fileHandle.read(buffer, 0, realChunkSize, bytesRead)];
                case 4:
                    bytesJustRead = (_a.sent()).bytesRead;
                    bytesRead += bytesJustRead;
                    allChunks.push(eachChunk(chunkNumber, buffer));
                    chunkNumber++;
                    return [3 /*break*/, 3];
                case 5: return [4 /*yield*/, fileHandle.close()];
                case 6:
                    _a.sent();
                    return [2 /*return*/, Promise.all(allChunks)];
            }
        });
    });
}
var uploadFileInParts = function (filename, remotePath, partSize) { return __awaiter(void 0, void 0, void 0, function () {
    var fileSize, numChunks, uploadId, parts, url;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, promises_1.default.stat(filename).catch(function () {
                    throw new Error("File not found: ".concat(filename));
                })];
            case 1:
                fileSize = (_a.sent()).size;
                numChunks = Math.ceil(fileSize / partSize);
                return [4 /*yield*/, (0, exports.createUpload)(filename, remotePath)];
            case 2:
                uploadId = _a.sent();
                return [4 /*yield*/, readFileInChunks(filename, partSize, function (partNumber, chunk) { return __awaiter(void 0, void 0, void 0, function () {
                        var partResp;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, (0, exports.uploadPart)(remotePath, uploadId, partNumber, chunk)];
                                case 1:
                                    partResp = _a.sent();
                                    // console.log(`Uploaded part ${partNumber}`);
                                    return [2 /*return*/, partResp];
                            }
                        });
                    }); })];
            case 3:
                parts = _a.sent();
                return [4 /*yield*/, (0, exports.completeUpload)(remotePath, uploadId, parts)];
            case 4:
                _a.sent();
                url = new URL("/organizations/".concat(SALAD_ORG_NAME, "/files/").concat(remotePath), STORAGE_API_URL).toString();
                return [2 /*return*/, url];
        }
    });
}); };
exports.uploadFileInParts = uploadFileInParts;
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var filename, remotePath, partSize, url;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    filename = process.argv[2];
                    remotePath = process.argv[3] || filename;
                    partSize = parseInt(PART_SIZE_MB) * 1024 * 1024;
                    return [4 /*yield*/, (0, exports.uploadFileInParts)(filename, remotePath, partSize)];
                case 1:
                    url = _a.sent();
                    console.log(url);
                    return [2 /*return*/];
            }
        });
    });
}
main();
