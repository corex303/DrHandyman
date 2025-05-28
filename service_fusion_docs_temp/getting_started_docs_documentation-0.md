# Getting Started

The Service Fusion API allows you to programmatically access data stored in your Service Fusion account with ease.

## Key Points:

1.  **Authentication**: You need a valid access token to send requests to the API endpoints. To get your access token, see the [Authentication](#authentication) documentation (presumably in `authentication_docs_documentation-1.md`).
2.  **Rate Limits**: The API has an access rate limit applied to it. See [Rate Limits](#rate-limits) (presumably in `rate_limits_docs_documentation-2.md`).
3.  **HTTPS Only**: The Service Fusion API will only respond to secure communications done over HTTPS. HTTP requests will be sent a 301 redirect to corresponding HTTPS resources.
4.  **Request Format (Content-Type)**: Controlled by the `Content-Type` header. If not specified, `application/json` will be used. Currently supported:
    *   `application/json` - JSON format
5.  **Response Format (Accept)**: Controlled by the `Accept` header. If not specified, `application/json` will be used. Currently supported:
    *   `application/json` - JSON format
    *   `application/xml` - XML format

## API Request Structure

All API requests use the following format:
`https://api.servicefusion.com/{version}/{resource}`

Where:

*   `version`: The version of the API. The current supported version is `v1`.
*   `resource`: An API resource. A complete list of all supported resources can be found in the **Resources** tab (referring to the original documentation structure).

## Basic Operations

The API has 3 basic operations:

*   Get a list of records.
*   Get a single record by ID.
*   Create a new record.

With each response, the HTTP status code corresponding to this response is returned:

*   `2xx`: Successful
*   `3xx`: Redirection
*   `4xx`: Client error
*   `5xx`: Server error

### Getting a List of Records (`GET /<resource>`)

To get the list of records of the selected resource, you must make a `GET` request to this resource.

If successful, the response will return with the HTTP status code `200` with approximately the following contents:

```json
{
  "items": [
    {
      "id": "1",
      "first_name": "Max",
      "last_name": "Paltsev"
    },
    {
      "id": "2",
      "first_name": "Jerry",
      "last_name": "Wheeler"
    }
    // ...
  ],
  "_meta": {
    "totalCount": 200,
    "pageCount": 20,
    "currentPage": 1,
    "perPage": 10
  }
}
```

This answer contains two root elements:

*   `items`: Contains an array of records of the current resource.
*   `_meta`: Contains service information.

Access to the data of the service information can also be obtained through the headers that are returned with each answer:

| Meta Field    | Header                    | Description                        |
| :------------ | :------------------------ | :--------------------------------- |
| `totalCount`  | `X-Pagination-Total-Count`  | The total number of resources.     |
| `pageCount`   | `X-Pagination-Page-Count`   | The number of pages.               |
| `currentPage` | `X-Pagination-Current-Page` | The current page (1-based).        |
| `perPage`     | `X-Pagination-Per-Page`     | The number of resources per page.  |

Additionally, the `GET` operation accepts the following parameters:

*   `page`: Returns the current page of results. If the specified page number is less than the first or last, the first or last page will be displayed. Example: `?page=2`. By default, this parameter is set to `1`.
*   `per-page`: The number of records displayed per page, from `1` to `50`. Example: `?per-page=20`. Default this parameter is equal to `10`.
*   `sort`: Sort the displayed records by the specified fields. Example: `?sort=-name,description` (sorts all records in descending order of the field `name` and in ascending order of the `description` field).
*   `filters`: Filtering the displayed records according to the specified criteria. Example: `?filters[name]=John&filters[description]=Walter`.
*   `fields`: A list of the displayed fields in the response, separated by a comma. Example: `?fields=name,description`. Default displays all fields.

### Getting a Record by ID (`GET /<resource>/{id}`)

To obtain a single record from the selected resource, you must make a `GET` request to this resource with the ID of the record being requested.

If successful, the response returns with the HTTP status code `200` with approximately the following contents:

```json
{
  "id": "1",
  "first_name": "Max",
  "last_name": "Paltsev"
}
```

Additionally, the `GET /{id}` operation accepts the following parameter:

*   `fields`: A list of the displayed fields in the response, separated by a comma. Example: `?fields=name,description`.

### Creating a New Record (`POST /<resource>`)

To create a new record for the selected resource, you need to `POST` a request to the resource.

If successful, the response will return with the HTTP status code `201` with approximately the following contents:

```json
{
  "id": "1",
  "first_name": "Max",
  "last_name": "Paltsev"
}
```

Additionally, the `POST /` operation accepts the following parameter:

*   `fields`: A list of the displayed fields in the response, separated by a comma. Example: `?fields=name,description`.

## Error Handling

### Validation Error

If there is an error in the create/update validation, a response will be returned with the HTTP status code `422` with the following content (represented by Error Validation):

```json
[
  {
    "field": "name",
    "message": "Name is too long (maximum is 45 characters)."
  }
  // ...
]
```

### Exception

If other errors occur, the response will be returned with the HTTP status code `4xx` or `5xx` with the following content (represented by Error Type):

```json
{
  "code": 500,
  "name": "Internal server error.",
  "message": "Failed to create the object for unknown reason."
}
```