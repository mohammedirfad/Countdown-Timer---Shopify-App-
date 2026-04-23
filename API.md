# Helixo Countdown Timer — API Documentation

## Base URL

All admin endpoints are served from your app's host (e.g. `https://your-app.trycloudflare.com`).  
Storefront endpoints are accessed via Shopify App Proxy at `/apps/countdown/*`.

---

## Authentication

| Endpoint type | Auth method |
|---|---|
| Storefront (`/api/storefront/*`) | None — public via App Proxy |
| Admin (`/api/timers/*`) | Shopify session cookie (handled by App Bridge) |

---

## Storefront Endpoints

> Called from the customer's browser via Shopify App Proxy.  
> No authentication required.

---

### GET `/api/storefront/timers`

Fetches active timers for a given shop and product. Called automatically by the storefront widget on every product page load.

**Query Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `shop` | string | ✅ | e.g. `countdown-timer-ngkfhim7.myshopify.com` |
| `productId` | string | ✅ | Raw number `123` or full GID `gid://shopify/Product/123` |

**Example Request**
```
GET /apps/countdown/timers?shop=mystore.myshopify.com&productId=8765432100
```

**Response 200**
```json
{
  "timers": [
    {
      "_id": "664f1a2b3c4d5e6f7a8b9c0d",
      "name": "Black Friday Sale",
      "type": "fixed",
      "startDate": "2025-11-28T00:00:00.000Z",
      "endDate": "2025-11-29T23:59:59.000Z",
      "targetType": "all",
      "design": {
        "backgroundColor": "#1a1a2e",
        "textColor": "#ffffff",
        "urgencyColor": "#cc0000",
        "text": "Sale ends in:",
        "size": "medium",
        "urgencyType": "color_pulse",
        "urgencyThresholdMinutes": 60
      },
      "impressions": 142,
      "status": "active"
    }
  ]
}
```

**Response 400** — Missing `shop` parameter  
**Response 500** — Server error

> ⚡ **Performance:** Cached in memory for 60 seconds. Uses compound MongoDB index `{ shop, status }`. Average response: **< 200ms** (cache hit: < 5ms).

---

### POST `/api/storefront/timers/impression`

Increments the impression counter for a timer. Called fire-and-forget by the widget when a timer renders.

**Request Body**
```json
{ "timerId": "664f1a2b3c4d5e6f7a8b9c0d" }
```

**Response 200**
```json
{ "success": true }
```

---

## Admin Endpoints

> All admin endpoints require a valid Shopify session.  
> Shopify App Bridge handles authentication automatically in the embedded admin UI.

---

### GET `/api/timers`

Returns all timers for the authenticated shop, sorted newest first.

**Response 200**
```json
[
  {
    "_id": "664f1a2b3c4d5e6f7a8b9c0d",
    "name": "Summer Sale",
    "type": "fixed",
    "status": "active",
    "impressions": 54,
    "targetType": "products",
    "targetIds": ["gid://shopify/Product/8765432100"],
    "createdAt": "2025-06-01T10:00:00.000Z"
  }
]
```

---

### GET `/api/timers/:id`

Returns a single timer by ID.

**URL Parameter:** `id` — MongoDB ObjectId of the timer

**Response 200** — Timer object  
**Response 404** — Timer not found  
**Response 500** — Server error

---

### POST `/api/timers`

Creates a new timer.

**Request Body**
```json
{
  "name": "Flash Sale",
  "type": "fixed",
  "startDate": "2025-07-01T00:00:00.000Z",
  "endDate": "2025-07-01T23:59:59.000Z",
  "targetType": "products",
  "targetIds": ["gid://shopify/Product/8765432100"],
  "design": {
    "backgroundColor": "#ff6b35",
    "textColor": "#ffffff",
    "urgencyColor": "#cc0000",
    "text": "Flash sale ends in:",
    "size": "large",
    "urgencyType": "color_pulse",
    "urgencyThresholdMinutes": 30
  }
}
```

**Validation Rules**

| Field | Rule |
|---|---|
| `name` | Required, non-empty string |
| `type` | `"fixed"` or `"evergreen"` |
| `startDate` | Required for fixed timers, ISO date string |
| `endDate` | Required for fixed timers, must be after `startDate` |
| `evergreenDuration` | Evergreen only — integer 1–720 hours, default `24` |
| `targetType` | `"all"`, `"products"`, or `"collections"` |
| `targetIds` | Min 1 item required when `targetType` is `products` or `collections` |
| `design.backgroundColor` | Valid hex e.g. `#ff0000` |
| `design.textColor` | Valid hex |
| `design.urgencyColor` | Valid hex |
| `design.size` | `"small"`, `"medium"`, or `"large"` |
| `design.urgencyType` | `"color_pulse"`, `"color_change"`, or `"none"` |
| `design.urgencyThresholdMinutes` | Integer 0–1440 |

**Response 201** — Created timer object  
**Response 400** — Validation error with message  
**Response 500** — Server error

---

### PUT `/api/timers/:id`

Updates an existing timer. Accepts the same body as `POST /api/timers`.

**URL Parameter:** `id` — MongoDB ObjectId of the timer

**Response 200** — Updated timer object  
**Response 400** — Validation error  
**Response 404** — Timer not found  
**Response 500** — Server error

---

### DELETE `/api/timers/:id`

Permanently deletes a timer.

**URL Parameter:** `id` — MongoDB ObjectId of the timer

**Response 200**
```json
{ "success": true }
```

**Response 500** — Server error

---

### POST `/api/timers/:id/duplicate`

Creates a copy of an existing timer with `status` reset to `active` and `impressions` reset to `0`. Useful for re-running expired promotions without re-entering all settings.

**URL Parameter:** `id` — MongoDB ObjectId of the timer to clone

**Response 201** — New duplicated timer object  
**Response 404** — Original timer not found  
**Response 500** — Server error

---

### GET `/api/products/count`

Returns total product count for the shop via Shopify GraphQL API.

**Response 200**
```json
{ "count": 42 }
```

---

## Quick Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/storefront/timers` | None | Fetch active timers for storefront widget |
| POST | `/api/storefront/timers/impression` | None | Track a timer impression |
| GET | `/api/timers` | Session | List all timers for the shop |
| GET | `/api/timers/:id` | Session | Get a single timer |
| POST | `/api/timers` | Session | Create a new timer |
| PUT | `/api/timers/:id` | Session | Update an existing timer |
| DELETE | `/api/timers/:id` | Session | Delete a timer |
| POST | `/api/timers/:id/duplicate` | Session | Clone a timer |
| GET | `/api/products/count` | Session | Get total product count |
