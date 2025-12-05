# NetJoub Analytics API Documentation

## Table of Contents
1. [Admin Analytics Endpoints](#admin-analytics-endpoints)
2. [Store Owner Analytics Endpoints](#store-owner-analytics-endpoints)
3. [Query Parameters](#query-parameters)
4. [Response Format](#response-format)
5. [Usage Examples](#usage-examples)

---

## Admin Analytics Endpoints

### 1. Platform Overview
Get comprehensive platform-wide statistics.

**Endpoint:** `GET /api/v1/admin/auth/analytics/overview`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string (e.g., "2025-10-01")
- `endDate` (optional): ISO date string (e.g., "2025-11-11")

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 125000.50,
      "average": 450.75
    },
    "bookings": {
      "total": 1250,
      "completionRate": "85.50"
    },
    "platform": {
      "branches": 45,
      "rooms": 150,
      "customers": 500,
      "activeOwners": 30
    }
  }
}
```

---

### 2. Revenue Trends
Get revenue trends over time with configurable grouping.

**Endpoint:** `GET /api/v1/admin/auth/analytics/revenue-trends`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `day`, `week`, `month`, `year` (default: `day`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-10-01T00:00:00.000Z",
      "revenue": 5250.00,
      "bookingCount": 42,
      "avgBookingValue": 125.00
    },
    {
      "period": "2025-10-02T00:00:00.000Z",
      "revenue": 6100.00,
      "bookingCount": 48,
      "avgBookingValue": 127.08
    }
  ]
}
```

---

### 3. Top Performing Branches
Get top branches by revenue.

**Endpoint:** `GET /api/v1/admin/auth/analytics/top-branches`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branchId": "11111111-1111-1111-1111-111111111111",
      "branchName": "Downtown Branch",
      "address": "123 Main St, Phnom Penh",
      "ownerName": "John Doe",
      "metrics": {
        "totalBookings": 250,
        "totalRevenue": 45000.00,
        "avgBookingValue": 180.00
      }
    }
  ]
}
```

---

### 4. Booking Status Distribution
Get distribution of bookings by status.

**Endpoint:** `GET /api/v1/admin/auth/analytics/booking-status`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "status": "completed",
      "count": 850,
      "revenue": 127500.00
    },
    {
      "status": "confirmed",
      "count": 120,
      "revenue": 18000.00
    },
    {
      "status": "pending",
      "count": 80,
      "revenue": 0
    },
    {
      "status": "cancelled",
      "count": 50,
      "revenue": 0
    }
  ]
}
```

---

### 5. Top Customers
Get top customers by spending.

**Endpoint:** `GET /api/v1/admin/auth/analytics/top-customers`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "123e4501-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "totalBookings": 25,
      "totalSpent": 4500.00,
      "avgSpent": 180.00
    }
  ]
}
```

---

### 6. Room Utilization
Get room utilization rates across the platform.

**Endpoint:** `GET /api/v1/admin/auth/analytics/room-utilization`

**Auth Required:** Yes (Admin role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roomId": "11111111-1111-1111-1111-111111111111",
      "roomNo": "R101",
      "branchName": "Downtown Branch",
      "totalBookings": 42,
      "hoursBooked": 210.5,
      "totalAvailableHours": 504,
      "utilizationRate": "41.77"
    }
  ]
}
```

---

## Store Owner Analytics Endpoints

### 1. Owner Dashboard Overview
Get comprehensive overview of owner's business.

**Endpoint:** `GET /api/v1/user/auth/owner/analytics/overview`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": {
      "total": 45000.50,
      "average": 350.75
    },
    "bookings": {
      "total": 450,
      "completionRate": "88.50"
    },
    "business": {
      "branches": 3,
      "rooms": 12,
      "uniqueCustomers": 125
    }
  }
}
```

---

### 2. Owner Revenue Trends
Get revenue trends for owner's branches.

**Endpoint:** `GET /api/v1/user/auth/customer/analytics/revenue-trends`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `groupBy` (optional): `day`, `week`, `month`, `year` (default: `day`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-10-01T00:00:00.000Z",
      "revenue": 1250.00,
      "bookingCount": 12,
      "avgBookingValue": 104.17
    }
  ]
}
```

---

### 3. Branch Performance Comparison
Compare performance across owner's branches.

**Endpoint:** `GET /api/v1/user/auth/customer/analytics/branch-performance`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "branchId": "11111111-1111-1111-1111-111111111111",
      "branchName": "Downtown Branch",
      "address": "123 Main St",
      "roomCount": 5,
      "metrics": {
        "totalBookings": 180,
        "totalRevenue": 27000.00,
        "avgBookingValue": 150.00
      }
    },
    {
      "branchId": "22222222-2222-2222-2222-222222222222",
      "branchName": "Riverside Branch",
      "address": "456 River Rd",
      "roomCount": 4,
      "metrics": {
        "totalBookings": 150,
        "totalRevenue": 22500.00,
        "avgBookingValue": 150.00
      }
    }
  ]
}
```

---

### 4. Branch Room Performance
Get detailed room performance for a specific branch.

**Endpoint:** `GET /api/v1/user/auth/customer/analytics/branch/:branchId/rooms`

**Auth Required:** Yes (Owner role)

**URL Parameters:**
- `branchId`: UUID of the branch

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "roomId": "11111111-1111-1111-1111-111111111111",
      "roomNo": "R101",
      "capacity": 3,
      "pricePerHour": 50.00,
      "metrics": {
        "totalBookings": 42,
        "totalRevenue": 10500.00,
        "hoursBooked": 210
      }
    }
  ]
}
```

---

### 5. Peak Hours Analysis
Analyze booking patterns by hour of day.

**Endpoint:** `GET /api/v1/user/auth/customer/analytics/peak-hours`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": 8,
      "bookingCount": 45,
      "revenue": 6750.00
    },
    {
      "hour": 9,
      "bookingCount": 52,
      "revenue": 7800.00
    },
    {
      "hour": 10,
      "bookingCount": 48,
      "revenue": 7200.00
    }
  ]
}
```

---

### 6. Customer Insights
Get insights about customers who book at owner's branches.

**Endpoint:** `GET /api/v1/user/auth/customer/analytics/customers`

**Auth Required:** Yes (Owner role)

**Query Parameters:**
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
- `limit` (optional): Number of results (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "customerId": "123e4501-e89b-12d3-a456-426614174000",
      "name": "Jane Smith",
      "totalBookings": 15,
      "totalSpent": 2250.00,
      "avgSpent": 150.00,
      "lastBooking": "2025-11-10T14:00:00.000Z"
    }
  ]
}
```

---

## Query Parameters

### Common Parameters

| Parameter | Type | Description | Default | Example |
|-----------|------|-------------|---------|---------|
| `startDate` | String | Start date (ISO format) | - | `2025-10-01` |
| `endDate` | String | End date (ISO format) | - | `2025-11-11` |
| `groupBy` | String | Time grouping for trends | `day` | `week`, `month` |
| `limit` | Integer | Number of results | 10 or 20 | `20` |

### Date Filtering
- If both `startDate` and `endDate` are provided, data is filtered to that range
- If only `startDate` is provided, data from that date onwards is included
- If only `endDate` is provided, data up to that date is included
- If neither is provided, all data is included

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (not authenticated)
- `403` - Forbidden (insufficient permissions)
- `500` - Internal Server Error

---

## Usage Examples

### Example 1: Get Admin Overview for October 2025
```bash
curl -X GET \
  'http://localhost:3000/api/admin/analytics/overview?startDate=2025-10-01&endDate=2025-10-31' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 2: Get Owner Revenue Trends (Weekly)
```bash
curl -X GET \
  'http://localhost:3000/api/owner/analytics/revenue-trends?startDate=2025-10-01&endDate=2025-11-11&groupBy=week' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

### Example 3: Get Top 20 Customers
```bash
curl -X GET \
  'http://localhost:3000/api/admin/analytics/top-customers?limit=20&startDate=2025-10-01' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN'
```

### Example 4: Get Room Performance for Specific Branch
```bash
curl -X GET \
  'http://localhost:3000/api/owner/analytics/branch/11111111-1111-1111-1111-111111111111/rooms?startDate=2025-10-01' \
  -H 'Authorization: Bearer YOUR_OWNER_TOKEN'
```

---

## Frontend Integration Examples

### React/JavaScript Example
```javascript
// Fetch admin overview
const fetchAdminOverview = async () => {
  try {
    const response = await fetch(
      '/api/admin/analytics/overview?startDate=2025-10-01&endDate=2025-11-11',
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Overview data:', result.data);
      // Update UI with data
    }
  } catch (error) {
    console.error('Error fetching overview:', error);
  }
};

// Fetch owner revenue trends
const fetchRevenueTrends = async (groupBy = 'day') => {
  const params = new URLSearchParams({
    startDate: '2025-10-01',
    endDate: '2025-11-11',
    groupBy: groupBy
  });
  
  try {
    const response = await fetch(
      `/api/owner/analytics/revenue-trends?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success) {
      // Process data for charts
      const chartData = result.data.map(item => ({
        date: new Date(item.period),
        revenue: item.revenue,
        bookings: item.bookingCount
      }));
      
      // Update chart component
      updateChart(chartData);
    }
  } catch (error) {
    console.error('Error fetching trends:', error);
  }
};
```

---

## Key Metrics Explained

### Revenue Metrics
- **Total Revenue**: Sum of all completed bookings
- **Average Booking Value**: Mean price per completed booking
- **Revenue by Period**: Revenue aggregated by day/week/month

### Booking Metrics
- **Total Bookings**: Count of all bookings (regardless of status)
- **Completion Rate**: Percentage of bookings with "completed" status
- **Booking Count by Status**: Distribution across pending/confirmed/cancelled/completed

### Performance Metrics
- **Room Utilization Rate**: (Hours Booked / Total Available Hours) × 100
- **Peak Hours**: Hours with highest booking count and revenue
- **Branch Performance**: Comparative metrics across branches

### Customer Metrics
- **Total Spent**: Sum of all completed bookings by customer
- **Average Spent**: Mean value per booking for each customer
- **Unique Customers**: Count of distinct customers

---

## Notes

1. All monetary values are in the database's configured currency
2. Dates are in ISO 8601 format (UTC timezone)
3. Authentication is required for all endpoints
4. Role-based access control is enforced
5. Large date ranges may impact performance
6. Consider implementing caching for frequently accessed analytics

---

## Best Practices

1. **Date Range Selection**: Use reasonable date ranges (e.g., 3-6 months max) for performance
2. **Pagination**: Use `limit` parameter for large result sets
3. **Caching**: Implement client-side caching for dashboard data
4. **Error Handling**: Always check `success` field before processing data
5. **Rate Limiting**: Be mindful of API rate limits for analytics endpoints