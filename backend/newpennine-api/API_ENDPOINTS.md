# NewPennine API Endpoints

Base URL: `http://localhost:3001/api/v1`

## Health Check Endpoints

### Basic Health Check
```
GET /api/v1/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-15T10:30:00.000Z",
  "service": "newpennine-api",
  "version": "1.0.0"
}
```

### Detailed Health Check
```
GET /api/v1/health/detailed
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-07-15T10:30:00.000Z",
  "service": "newpennine-api",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "latency": "45ms"
  },
  "environment": "development",
  "uptime": 3600,
  "memory": {
    "used": "128MB",
    "total": "512MB"
  }
}
```

## Widgets Endpoints

### Statistics
```
GET /api/v1/widgets/stats
```

Query Parameters (optional):
- `startDate`: Start date for filtering (ISO format)
- `endDate`: End date for filtering (ISO format)

Response:
```json
{
  "totalPallets": 1234,
  "activeTransfers": 45,
  "todayGRN": 23,
  "pendingOrders": 67,
  "timestamp": "2025-07-15T10:30:00.000Z"
}
```

### Inventory
```
GET /api/v1/widgets/inventory
```

Query Parameters (optional):
- `warehouse`: Filter by warehouse code
- `limit`: Number of records to return (default: 100)
- `offset`: Number of records to skip (default: 0)

Response:
```json
{
  "data": [
    {
      "id": 1,
      "palletId": "P12345",
      "productCode": "ABC123",
      "productDescription": "Product Name",
      "quantity": 100,
      "unit": "PCS",
      "material": "Steel",
      "warehouse": "WH1",
      "location": "A-01-01",
      "timestamp": "2025-07-15T10:30:00.000Z"
    }
  ],
  "total": 500,
  "limit": 100,
  "offset": 0
}
```

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CORS_ORIGIN=http://localhost:3000
API_VERSION=1.0.0
NODE_ENV=development
```

## Running the API

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "status": 500,
  "error": "Failed to fetch data",
  "message": "Detailed error message"
}
```

Common HTTP status codes:
- 200: Success
- 400: Bad Request
- 500: Internal Server Error
