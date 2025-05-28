# Resource: /customers/{customer-id}

**Description:** Get a Customer by identifier.

## Response Body Type

### Type: `CustomerView`

A customer's schema.

**Schema Definition:**
```json
{
  "id": "integer",
  "customer_name": "string",
  "fully_qualified_name": "string",
  "parent_customer": "string",
  "account_number": "string",
  "account_balance": "number",
  "private_notes": "string",
  "public_notes": "string",
  "credit_rating": "string",
  "labor_charge_type": "string",
  "labor_charge_default_rate": "number",
  "last_serviced_date": "datetime",
  "is_bill_for_drive_time": "boolean",
  "is_vip": "boolean",
  "referral_source": "string",
  "agent": "string",
  "discount": "number",
  "discount_type": "string",
  "payment_type": "string",
  "payment_terms": "string",
  "assigned_contract": "string",
  "industry": "string",
  "is_taxable": "boolean",
  "tax_item_name": "string",
  "qbo_sync_token": "integer",
  "qbo_currency": "string",
  "qbo_id": "integer",
  "qbd_id": "string",
  "created_at": "datetime",
  "updated_at": "datetime",
  "contacts": [
    {
      "prefix": "string",
      "fname": "string",
      "lname": "string",
      "suffix": "string",
      "contact_type": "string",
      "dob": "string",
      "anniversary": "string",
      "job_title": "string",
      "department": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "is_primary": "boolean",
      "phones": [
        {
          "phone": "string",
          "ext": "integer",
          "type": "string",
          "created_at": "datetime",
          "updated_at": "datetime",
          "is_mobile": "boolean"
        }
      ],
      "emails": [
        {
          "email": "string",
          "class": "string",
          "types_accepted": "string",
          "created_at": "datetime",
          "updated_at": "datetime"
        }
      ]
    }
  ],
  "locations": [
    {
      "street_1": "string",
      "street_2": "string",
      "city": "string",
      "state_prov": "string",
      "postal_code": "string",
      "country": "string",
      "nickname": "string",
      "gate_instructions": "string",
      "latitude": "number",
      "longitude": "number",
      "location_type": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "is_primary": "boolean",
      "is_gated": "boolean",
      "is_bill_to": "boolean",
      "customer_contact": "string"
    }
  ],
  "custom_fields": [
    {
      "name": "string",
      "value": "any",
      "type": "string",
      "group": "string",
      "created_at": "datetime",
      "updated_at": "datetime",
      "is_required": "boolean"
    }
  ],
  "_expandable": [
    "string"
  ]
}
```

## Methods and Sub-resources

### Methods

*   **GET**: Get a Customer by identifier.

### Sub-resources

*   `/equipment`