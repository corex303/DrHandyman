# Resource: /me

## Associated Types

### Type: `MeView`

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

| Parameter           | Type    | Required | Description                                                                    |
| :------------------ | :------ | :------- | :----------------------------------------------------------------------------- |
| `id`                | Integer |          | The authenticated user's identifier.                                             |
| `first_name`        | String  |          | The authenticated user's first name.                                             |
| `last_name`         | String  |          | The authenticated user's last name.                                              |
| `email`             | String  |          | The authenticated user's email.                                                  |
| `_expandable`       | Array   | Yes      | The extra-field's list that are not expanded and can be expanded into objects. |
| `_expandable items` | String  |          | The extra-field that are not expanded and can be expanded into object.         |

---

### Type: `400Error` - Bad Request

Bad request client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `Error` - Unauthorized (Assumed name, original was just "TypeError Unauthorized")

Unauthorized client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `Error` - Forbidden (Assumed name, original was just "TypeError Forbidden")

Forbidden client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `405Error` - Method Not Allowed

Method not allowed client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `415Error` - Unsupported Media Type

Unsupported media type client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `429Error` - Too Many Requests

Too many requests client's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

---

### Type: `500Error` - Internal Server Error

Internal server's error schema.

**Schema Definition:**
```json
{
  "code": "integer",
  "name": "string",
  "message": "string"
}
```

**Parameters:**

| Parameter | Type    | Description                               |
| :-------- | :------ | :---------------------------------------- |
| `code`    | Integer | The error code associated with the error. |
| `name`    | String  | The error name associated with the error. |
| `message` | String  | The error message associated with the error. |

## Methods and Sub-resources

### Methods

*   **GET**: Authorized user information. (Refers to `me_get_docs_resources-0-methods-0.md` for details)