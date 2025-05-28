# Rate Limits

API access rate limits are applied to each access token at a rate of **60 requests per minute**.

In addition, every API response is accompanied by the following set of headers to identify the status of your consumption:

| Header                 | Description                                                                                      |
| :--------------------- | :----------------------------------------------------------------------------------------------- |
| `X-Rate-Limit-Limit`   | The maximum number of requests that the consumer is permitted to make per minute.              |
| `X-Rate-Limit-Remaining` | The number of requests remaining in the current rate limit window.                               |
| `X-Rate-Limit-Reset`   | The time at which the current rate limit window resets in UTC epoch seconds.                   |

If too many requests are received from a user within the stated period of the time, a response with status code `429` (Too Many Requests) will be returned.