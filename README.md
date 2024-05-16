# 🥗 Salad Simple Storage Service (S4)

This is a simple HTTP service to allow Salad customers to temporarily upload assets for use in other salad services. Examples include uploading images for stable diffusion training or inference, audio clips for transcription, etc.

- [🥗 Salad Simple Storage Service (S4)](#-salad-simple-storage-service-s4)
  - [Endpoints](#endpoints)
    - [Authorization](#authorization)
    - [Upload a File](#upload-a-file)
      - [PUT `/organizations/:organization_name/files/:filename`](#put-organizationsorganization_namefilesfilename)
    - [Download a File](#download-a-file)
      - [GET `/organizations/:organization_name/files/:filename`](#get-organizationsorganization_namefilesfilename)
    - [Delete a File](#delete-a-file)
      - [DELETE `/organizations/:organization_name/files/:filename`](#delete-organizationsorganization_namefilesfilename)
    - [List Files](#list-files)
      - [GET `/organizations/:organization_name/files`](#get-organizationsorganization_namefiles)
    - [Get A Signed Url for a File](#get-a-signed-url-for-a-file)
      - [POST `/organizations/:organization_name/file_tokens/:filename`](#post-organizationsorganization_namefile_tokensfilename)


## Endpoints

### Authorization

Requests to the S4 service must include either:
- An `Salad-Api-Key` header with a valid Salad API key.
- An `Authorization` header with a valid Salad JWT (issued by the [instance metadata service](https://github.com/SaladTechnologies/saladcloud-job-queue-worker-sdk/blob/main/docs/retrieving_token.md)) as a bearer token.

### Upload a File

#### PUT `/organizations/:organization_name/files/:filename`

Uploads a file to the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to upload.

**Example Request:**
```bash
curl  -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --form 'mimeType="text/toml"' \
  --form 'file=@/home/shawn/code/SaladTechnologies/storage-service/wrangler.toml'
```

**Example Response:**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml"
}
```

**Example Request, Creating Signed URL**

When uploading a file, you can optionally request to sign the url, which will allow you to use the returned url to fetch the file without needing to include the `Salad-Api-Key` header.

```bash
curl  -X PUT \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --form 'mimeType="text/toml"' \
  --form 'file=@/home/shawn/code/SaladTechnologies/storage-service/wrangler.toml' \
  --form 'sign=true' \
  --signatureExp '86400'
```

**Example Response, Signed URL**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml?token=8eb6de1b-b313-4169-8411-39860ebc73ab",
}
```


---

### Download a File

#### GET `/organizations/:organization_name/files/:filename`

Downloads a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to download.


**Example Request:**
```bash
curl -X GET \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --output wrangler.toml
```

---

### Delete a File

#### DELETE `/organizations/:organization_name/files/:filename`

Deletes a file from the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to delete.

**Example Request:**
```bash
curl -X DELETE \
  'https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml' \
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
      "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml",
      "size": 1024,
      "mimeType": "text/toml",
      "uploaded": "2021-09-01T12:00:00Z",
      "etag": "1234567890"
    }
  ]
}
```

### Get A Signed Url for a File

#### POST `/organizations/:organization_name/file_tokens/:filename`

Creates a signed URL for a file in the specified organization.

**Request Parameters:**
- `organization_name` (string): The name of the organization.
- `filename` (string): The name of the file to create a signed URL for.

**Example Request:**
```bash
curl -X POST \
  'https://storage-api.salad.com/organizations/salad-benchmarking/file_tokens/wrangler.toml' \
  --header 'Salad-Api-Key: YOURAPIKEY' \
  --data '{"method": "GET", "expires": 86400}'
```

**Example Response:**
```json
{
  "url": "https://storage-api.salad.com/organizations/salad-benchmarking/files/wrangler.toml?token=974360ea-63f7-4db3-9692-72ca5dbae615"
}
```