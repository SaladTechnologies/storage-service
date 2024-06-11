# 🥗 Salad Simple Storage Service (S4)

This is a simple HTTP service to allow Salad customers to temporarily upload assets for use in other salad services. Examples include uploading images for stable diffusion training or inference, audio clips for transcription, etc.

- [🥗 Salad Simple Storage Service (S4)](#-salad-simple-storage-service-s4)
  - [Endpoints](#endpoints)
    - [Authorization](#authorization)
    - [Upload a File](#upload-a-file)
      - [PUT `/organizations/:organization_name/files/:filename+`](#put-organizationsorganization_namefilesfilename)
    - [Upload a Big File](#upload-a-big-file)
      - [PUT `/organizations/:organization_name/files/:filename+?action=mpu-create`](#put-organizationsorganization_namefilesfilenameactionmpu-create)
      - [PUT `/organizations/:organization_name/file_parts/:filename+?partNumber=1&uploadId=1234567890`](#put-organizationsorganization_namefile_partsfilenamepartnumber1uploadid1234567890)
      - [PUT `/organizations/:organization_name/files/:filename+?action=mpu-complete&uploadId=1234567890`](#put-organizationsorganization_namefilesfilenameactionmpu-completeuploadid1234567890)
    - [Download a File](#download-a-file)
      - [GET `/organizations/:organization_name/files/:filename+`](#get-organizationsorganization_namefilesfilename)
    - [Delete a File](#delete-a-file)
      - [DELETE `/organizations/:organization_name/files/:filename+`](#delete-organizationsorganization_namefilesfilename)
    - [List Files](#list-files)
      - [GET `/organizations/:organization_name/files`](#get-organizationsorganization_namefiles)
    - [Get A Signed Url for a File](#get-a-signed-url-for-a-file)
      - [POST `/organizations/:organization_name/file_tokens/:filename+`](#post-organizationsorganization_namefile_tokensfilename)


## Endpoints

### Authorization

Requests to the S4 service must include either:
- A `Salad-Api-Key` header with a valid Salad API key.
- An `Authorization` header with a valid Salad JWT (issued by the [instance metadata service](https://github.com/SaladTechnologies/saladcloud-job-queue-worker-sdk/blob/main/docs/retrieving_token.md)) as a bearer token.

### Upload a File

#### PUT `/organizations/:organization_name/files/:filename+`

Uploads a file up to 100MB to the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to upload. This can be a path, and the file will be stored in a directory structure based on the path. e.g. `path/to/my/file.tar.gz` will be stored as `path/to/my/file.tar.gz`.

**Example Request:**
```bash
curl  -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --form 'mimeType="application/tar+gzip"' \
  --form 'file=@/path/to/my/file.tar.gz'
```

**Example Response:**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz"
}
```

**Example Request, Creating Signed URL**

When uploading a file, you can optionally request to sign the url, which will allow you to use the returned url to fetch the file without needing to include the `Salad-Api-Key` header.

```bash
curl  -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --form 'mimeType="application/tar+gzip"' \
  --form 'file=@/path/to/my/file.tar.gz' \
  --form 'sign=true' \
  --form 'signatureExp=86400'
```

**Example Response, Signed URL**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz?token=8eb6de1b-b313-4169-8411-39860ebc73ab",
}
```

### Upload a Big File

The S4 service is a cloudflare workers application, so it is constrained to a maximum body size of 100mb. To upload files larger than 100mb, you can use the multipart upload feature of the S4 service. This feature allows you to upload a file in multiple parts, and then combine the parts into a single file. The process looks like this:

1. Create the multipart upload with one request
2. Upload each part of the file with a separate request. This can be done concurrently.
3. Complete the multipart upload with one request, which will combine the parts into a single file.

There is a reference implementation of this process in the `do-multipart-upload.ts` script in this repository.

#### PUT `/organizations/:organization_name/files/:filename+?action=mpu-create`

First, create a multipart upload for the specified organization and file. You will receive an `uploadId` in the response, which you will use to upload the parts of the file.

**Example Request:**
```bash
curl -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz?action=mpu-create' \
  --header 'Salad-Api-Key: YOURAPIKEY'
```

**Example Response:**
```json
{
  "uploadId": "1234567890"
}
```

#### PUT `/organizations/:organization_name/file_parts/:filename+?partNumber=1&uploadId=1234567890`

For each part of the file, upload the part to the specified organization and file. You must include the `partNumber` and `uploadId` query parameters in the request.

You will need to split the file into parts first. The maximum part size is 100MB. Here's how in bash:

```bash
split -b 80M /path/to/my/file.tar.gz /path/to/my/file.tar.gz.part_
```

This will split the file into parts of 80MB each, with the filenames `file.tar.gz.part_aa`, `file.tar.gz.part_ab`, etc. 


**Example Request For Each Part:**

```bash
curl -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/file_parts/path/to/my/file.tar.gz?partNumber=1&uploadId=1234567890 \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --header 'Content-Type: application/octet-stream' \
  --data-binary @/path/to/my/file.tar.gz.part_aa
```

Note that `partNumber` is 1-indexed, so the first part is `partNumber=1`.

**Example Response:**
```json
{
  "partNumber": 1,
  "etag": "1234567890"
}
```

#### PUT `/organizations/:organization_name/files/:filename+?action=mpu-complete&uploadId=1234567890`

After uploading all parts of the file, complete the multipart upload to combine the parts into a single file.

**Example Request:**
```bash
curl -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz?action=mpu-complete&uploadId=1234567890 \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --header 'Content-Type: application/json' \
  --data '{"parts": [{"partNumber": 1, "etag": "1234567890"}]}'
```

**Example Response:**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz"
}
```


---

### Download a File

#### GET `/organizations/:organization_name/files/:filename+`

Downloads a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to download.


**Example Request:**
```bash
curl -X GET \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --output file.tar.gz
```

---

### Delete a File

#### DELETE `/organizations/:organization_name/files/:filename+`

Deletes a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to delete.

**Example Request:**
```bash
curl -X DELETE \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz' \
  --header 'Salad-Api-Key: YOURAPIKEY'
```

---

### List Files

#### GET `/organizations/:organization_name/files`

Lists all files within the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.


**Example Request:**
```bash
curl -X GET \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files' \
  --header 'Salad-Api-Key: YOURAPIKEY'
```

**Example Response:**
```json
{
  "files": [
    {
      "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz",
      "size": 1024,
      "mimeType": "application/tar+gzip",
      "uploaded": "2021-09-01T12:00:00Z",
      "etag": "1234567890"
    }
  ]
}
```

### Get A Signed Url for a File

#### POST `/organizations/:organization_name/file_tokens/:filename+`

Creates a signed URL for a file in the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to create a signed URL for.

**Example Request:**
```bash
curl -X POST \
  'https://storage-api.salad.com/organizations/salad-benchmarking/file_tokens/path/to/my/file.tar.gz' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --data '{"method": "GET", "expires": 86400}'
```

**Example Response:**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/path/to/my/file.tar.gz?token=974360ea-63f7-4db3-9692-72ca5dbae615"
}
```