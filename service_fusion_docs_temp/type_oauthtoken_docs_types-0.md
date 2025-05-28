# Type: OAuthToken

**Description:**
An authentication schema.

**Schema Definition:**
```json
{
  "access_token": "string",
  "token_type": "string",
  "expires_in": "integer",
  "refresh_token": "string"
}
```

**Parameters:**

| Parameter       | Type    | Description                                                                                                |
| :-------------- | :------ | :--------------------------------------------------------------------------------------------------------- |
| `access_token`  | String  | The access token string as issued by the authorization server.                                             |
| `token_type`    | String  | The type of token this is.                                                                                 |
| `expires_in`    | Integer | The duration of time the access token is granted for.                                                      |
| `refresh_token` | String  | When an access token expires (exceeds the `expires_in` time), the `refresh_token` is used to obtain a new access token. |