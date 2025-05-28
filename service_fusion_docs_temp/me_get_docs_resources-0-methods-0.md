# Method: GET /me

**Description:** Authorized user information.

**Traits:** `tra.me-fieldable`, `tra.formatable`

## Request

`GET https://api.servicefusion.com/{version}/me`

### Parameters

#### URI Parameters

| Parameter | Type   | Required | Enum | Description                                       |
| :-------- | :----- | :------- | :--- | :------------------------------------------------ |
| `version` | String | Yes      |      | Used to send a version of the API to be used. <br> *Possible values: `v1`* |

#### Query Parameters

| Parameter     | Type   | Enum | Description                                                                                                                                  |
| :------------ | :----- | :--- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`      | String |      | Used to send a list of fields to be displayed. Accepted value is comma-separated string. <br> *Default: Displays all available.* <br> *Example: `id,email`* <br> *Possible values: `id`, `first_name`, `last_name`, `email`* |
| `expand`      | String |      | Used to send a list of extra-fields to be displayed. Accepted value is comma-separated string. <br> *Default: Displays nothing.*                   |
| `format`      | String |      | Used to send a format of data of the response. Do not use together with the `Accept` header. <br> *Default: `json`* <br> *Possible values: `json`, `xml`* |
| `access_token`| String |      | Used to send a valid OAuth 2 access token. Do not use together with the `Authorization` header. <br> *Example: `eyJz93a...k4laUWw`*                   |

#### Headers

| Parameter       | Type   | Enum | Description                                                                                                                                         |
| :-------------- | :----- | :--- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Accept`        | String |      | Used to send a format of data of the response. Do not use together with the `format` query parameter. <br> *Default: `application/json`* <br> *Possible values: `application/json`, `application/xml`* |
| `Authorization` | String |      | Used to send a valid OAuth 2 access token. Do not use together with the `access_token` query parameter. <br> *Example: `Bearer eyJz93a...k4laUWw`*             |

## Response

### 200 OK (Success)

Standard response for successful HTTP requests.

#### Response Headers

| Parameter              | Type    | Description                                                                           |
| :--------------------- | :------ | :------------------------------------------------------------------------------------ |
| `Content-Type`         | String  | Data response format. <br> *Example: `application/json; charset=UTF-8`*                |
| `X-Rate-Limit-Limit`   | Integer | The maximum number of requests that the consumer is permitted to make per minute. <br> *Example: `60`* |
| `X-Rate-Limit-Remaining` | Integer | The number of requests remaining in the current rate limit window. <br> *Example: `59`*      |
| `X-Rate-Limit-Reset`   | Integer | The time at which the current rate limit window resets in UTC epoch seconds. <br> *Example: `0`* |

#### Response Body Type: `MeView`

An authenticated user's schema.

**Schema Definition:**
```json
{
  "id": "integer",
  "first_name": "string",
  "last_name": "string",
  "email": "string",
  "_expandable": [
    "string"
  ]
}
```

**Parameter Description:**

| Parameter     | Type    | Required | Description                                                                        |
| :------------ | :------ | :------- | :--------------------------------------------------------------------------------- |
| `id`          | Integer |          | The authenticated user's identifier.                                                 |
| `first_name`  | String  |          | The authenticated user's first name.                                                 |
| `last_name`   | String  |          | The authenticated user's last name.                                                  |
| `email`       | String  |          | The authenticated user's email.                                                      |
| `_expandable` | Array   | Yes      | The extra-field's list that are not expanded and can be expanded into objects.     |
| `_expandable items` | String  |          | The extra-field that are not expanded and can be expanded into object.             |