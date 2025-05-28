# Resource: /calendar-tasks

**Description:** A calendar-task's list schema.

**Schema Definition:**
```json
{
  "items": [
    {
      "id": "integer",
      "type": "string",
      "description": "string",
      "start_time": "string",
      "end_time": "string",
      "start_date": "datetime",
      "end_date": "datetime",
      "created_at": "datetime",
      "updated_at": "datetime",
      "is_public": "boolean",
      "is_completed": "boolean",
      "repeat_id": "integer",
      "users_id": [
        "integer"
      ],
      "customers_id": [
        "integer"
      ],
      "jobs_id": [
        "integer"
      ],
      "estimates_id": [
        "integer"
      ],
      "repeat": {
        "id": "integer",
        "repeat_type": "string",
        "repeat_frequency": "integer",
        "repeat_weekly_days": [
          "string"
        ],
        "repeat_monthly_type": "string",
        "stop_repeat_type": "string",
        "stop_repeat_on_occurrence": "integer",
        "stop_repeat_on_date": "datetime",
        "start_date": "datetime",
        "end_date": "datetime"
      }
    }
  ],
  "_expandable": [
    "string"
  ],
  "_meta": {
    "totalCount": "integer",
    "pageCount": "integer",
    "currentPage": "integer",
    "perPage": "integer"
  }
}
```

**Parameter Descriptions:**

*   `items`: Collection envelope.
    *   `items.id`: The calendar task's identifier.
    *   `items.type`: The calendar task's type.
    *   `items.description`: The calendar task's description.
    *   `items.start_time`: The calendar task's start time.
    *   `items.end_time`: The calendar task's end time.
    *   `items.start_date`: The calendar task's start date.
    *   `items.end_date`: The calendar task's end date.
    *   `items.created_at`: The calendar task's created date.
    *   `items.updated_at`: The calendar task's updated date.
    *   `items.is_public`: The calendar task's is public flag.
    *   `items.is_completed`: The calendar task's is completed flag.
    *   `items.repeat_id`: The calendar task's repeat id.
    *   `items.users_id`: The calendar task's users list of identifiers.
        *   `users_id.items`: The calendar task user's identifier.
    *   `items.customers_id`: The calendar task's customers list of identifiers.
        *   `customers_id.items`: The calendar task customer's identifier.
    *   `items.jobs_id`: The calendar task's jobs list of identifiers.
        *   `jobs_id.items`: The calendar task job's identifier.
    *   `items.estimates_id`: The calendar task's estimates list of identifiers.
        *   `estimates_id.items`: The calendar task estimate's identifier.
    *   `items.repeat`: The calendar task's repeat.
        *   `repeat.id`: The repeat's identifier.
        *   `repeat.repeat_type`: The repeat's type.
        *   `repeat.repeat_frequency`: The repeat's frequency.
        *   `repeat.repeat_monthly_type`: The repeat's monthly type.
        *   `repeat.stop_repeat_type`: The repeat's stop type.
        *   `repeat.stop_repeat_on_occurrence`: The repeat's stop on occurrence.
        *   `repeat.stop_repeat_on_date`: The repeat's stop on date.
        *   `repeat.start_date`: The repeat's start date.
        *   `repeat.end_date`: The repeat's end date.
*   `_expandable`: The extra-field's list that are not expanded and can be expanded into objects.
    *   `_expandable.items`: The extra-field that are not expanded and can be expanded into object.
*   `_meta`: Meta information.
    *   `_meta.totalCount`: Total number of data items.
    *   `_meta.pageCount`: Total number of pages of data.
    *   `_meta.currentPage`: The current page number (1-based).
    *   `_meta.perPage`: The number of data items in each page.