# Authentication

An Access Token is required to be sent as part of every request to the Service Fusion API. You can send it in one of two ways (do not use both together):

1.  As an `Authorization` request header: `Authorization: Bearer {{access_token}}`
2.  As a query parameter: `?access_token={{access_token}}`

An Access Token uniquely identifies you for each API request. Our API uses the OAuth 2 specification and supports two of RFC-6749's grant flows.

## Authorization Code Grant (RFC-6749 Section 4.1)

This authentication method allows you to get an access token in exchange for the user's usual credentials to log into their ServiceFusion account. The user will enter these credentials in a pop-up window on your site or any other third-party application.

This method consists of 3 steps and is rather complicated to implement. If you need something simpler, please look at the Client Credentials Grant authentication method below.

### Step 1: Register Your Application

Before you can implement OAuth 2.0 for your app, you need to register your app in **OAuth Apps** within Service Fusion:

*   In OAuth Apps, create a new app (if you don't already have one) by clicking **Add New OAuth App**.
*   Enter the **Name** and **Redirect URL**. When you implement OAuth 2.0 in your app (see next section), the `redirect_uri` must match this URL.
*   Click **Add OAuth App**. You will be redirected to a page with the generated **Client ID** and **Client Secret** for your app.
*   Save the generated Client ID and Client Secret of your app; you will need them in the next steps.

### Step 2: Direct User to Authorization URL

Once you have registered your app, you can implement OAuth 2.0 in your app's code. Your app should start the authorization flow by directing the user to the Authorization URL:

`https://api.servicefusion.com/oauth/authorize?response_type=code&client_id=YOUR_APP_CLIENT_ID&redirect_uri=YOUR_APP_REDIRECT_URL&state=YOUR_USER_BOUND_VALUE`

Where:

*   `response_type`: (Required) Set this to `code`.
*   `client_id`: (Required) Set this to the app's Client ID generated for your app in OAuth Apps.
*   `redirect_uri`: (Optional) Set this to the Redirect URL configured for your app in OAuth Apps (must be identical).
*   `state`: (Optional, but recommended for security) Set this to a value that is associated with the user you are directing to the authorization URL (e.g., a hash of the user's session ID). Make sure that this is a value that cannot be guessed.

### Step 3: Exchange Authorization Code for Access Token

After the user successfully passes authentication, they will be redirected back to the Redirect URL (which you set for your app in OAuth Apps) with `code` and `state` (if indicated in the previous step) query parameters.

1.  First, check that the `state` value matches what you set it to originally. This serves as a CSRF protection mechanism and ensures an attacker can't intercept the authorization flow.
2.  Then, exchange the received query parameter `code` for an access token.

**Note:** The `code` query parameter has a lifetime of 60 seconds and can be exchanged only once within this period for security reasons. Otherwise, an error message stating that the code is invalid or expired will occur.

Make a POST request to exchange the code:

```bash
curl --request POST \
  --url 'https://api.servicefusion.com/oauth/access_token' \
  --header 'content-type: application/json' \
  --data '{
    "grant_type": "authorization_code",
    "client_id": "YOUR_APP_CLIENT_ID",
    "client_secret": "YOUR_APP_CLIENT_SECRET",
    "code": "QUERY_PARAMETER_CODE",
    "redirect_uri": "YOUR_APP_REDIRECT_URL"
  }'
```

Where:

*   `grant_type`: (Required) Set this to `authorization_code`.
*   `client_id`: (Required) Set this to the app's Client ID generated for your app in OAuth Apps.
*   `client_secret`: (Required) Set this to the app's Client Secret generated for your app in OAuth Apps.
*   `code`: (Required) Set this to the `code` query parameter that the user received when redirecting to the Redirect URL.
*   `redirect_uri`: (Optional) Set this to the `redirect_uri` query parameter which was included in the initial authorization request (must be identical).

The response contains an Access Token, the token's type (which is `Bearer`), the time (in seconds, 3600 = 1 hour) when the token expires, and a Refresh Token to refresh your Access Token when it expires. If the request results in an error, it is represented by an `OAuthTokenError` in the response.

Example successful response:
```json
{
  "access_token": "eyJz93a...k4laUWw",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "afGb76r...t8erDVe"
}
```

## Client Credentials Grant (RFC-6749 Section 4.4)

This authentication method allows you to get an access token in exchange for the client's ID and Secret, which they can find on the **OAuth Consumer** page of their ServiceFusion account.

If you want a more convenient authorization for a user with their usual credentials to enter the ServiceFusion account, please look at the Authorization Code Grant authentication method above.

To ask for an Access Token for any of your authorized consumers, perform a POST operation to the `https://api.servicefusion.com/oauth/access_token` endpoint with a payload in the following format:

```bash
curl --request POST \
  --url 'https://api.servicefusion.com/oauth/access_token' \
  --header 'content-type: application/json' \
  --data '{
    "grant_type": "client_credentials",
    "client_id": "YOUR_USER_CLIENT_ID",
    "client_secret": "YOUR_USER_CLIENT_SECRET"
  }'
```

Where:

*   `grant_type`: (Required) Set this to `client_credentials`.
*   `client_id`: (Required) Set this to the consumer's Client ID generated for your user in OAuth Consumer.
*   `client_secret`: (Required) Set this to the consumer's Client Secret generated for your user in OAuth Consumer.

The response contains an Access Token, the token's type (which is `Bearer`), the time (in seconds, 3600 = 1 hour) when the token expires, and a Refresh Token to refresh your Access Token when it expires. If the request results in an error, it is represented by an `OAuthTokenError` in the response.

Example successful response:
```json
{
  "access_token": "eyJz93a...k4laUWw",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "afGb76r...t8erDVe"
}
```

## Refresh an Access Token

When the Access Token expires, you can use the Refresh Token to get a new Access Token by using the token endpoint as shown below:

```bash
curl --request POST \
  --url 'https://api.servicefusion.com/oauth/access_token' \
  --header 'content-type: application/json' \
  --data '{
    "grant_type": "refresh_token",
    "refresh_token": "afGb76r...t8erDVe"
  }'
```

Where:

*   `grant_type`: (Required) Set this to `refresh_token`.
*   `refresh_token`: (Required) Set this to the `refresh_token` value from the Access Token response.