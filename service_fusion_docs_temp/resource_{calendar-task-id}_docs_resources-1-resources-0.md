# Resource: /calendar-tasks/{calendar-task-id}

**Description:** Get a CalendarTask by identifier.

## Response Body Type

### Type: `CalendarTaskView`

A calendar task's schema.

**Schema Definition:**
```json
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
  },
  "_expandable": [
    "string"
  ]
}
```

**Parameter Descriptions:**

*   `id`: The calendar task's identifier.
*   `type`: The calendar task's type.
*   `description`: The calendar task's description.
*   `start_time`: The calendar task's start time.
*   `end_time`: The calendar task's end time.
*   `start_date`: The calendar task's start date.
*   `end_date`: The calendar task's end date.
*   `created_at`: The calendar task's created date.
*   `updated_at`: The calendar task's updated date.
*   `is_public`: The calendar task's is public flag.
*   `is_completed`: The calendar task's is completed flag.
*   `repeat_id`: The calendar task's repeat id.
*   `users_id` (Required): The calendar task's users list of identifiers.
*   `customers_id` (Required): The calendar task's customers list of identifiers.
*   `jobs_id` (Required): The calendar task's jobs list of identifiers.
*   `estimates_id` (Required): The calendar task's estimates list of identifiers.
*   `repeat`: The calendar task's repeat.
*   `_expandable` (Required): The extra-field's list that are not expanded and can be expanded into objects.

## Methods and Sub-resources

### Methods

*   **GET**: Get a CalendarTask by identifier.