# NestJS API Documentation

## Base URL
```
http://localhost:3001/api/v1
```

## Available Endpoints

### Health Check Endpoints

#### GET /health
Basic health check endpoint

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-15T08:24:34.055Z",
  "service": "newpennine-api",
  "version": "1.0.0"
}
```

#### GET /health/detailed
Detailed health check with database connection status

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-07-15T08:24:34.055Z",
  "service": "newpennine-api",
  "version": "1.0.0",
  "database": {
    "status": "connected",
    "latency": 45
  }
}
```

### Authentication Endpoints

#### POST /auth/login
User login endpoint

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2025-07-15T10:00:00.000Z"
  },
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here"
}
```

#### POST /auth/register
User registration endpoint

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "created_at": "2025-07-15T10:00:00.000Z"
  },
  "access_token": "jwt-token-here",
  "refresh_token": "refresh-token-here"
}
```

#### POST /auth/refresh
Refresh access token

**Request Body:**
```json
{
  "refresh_token": "refresh-token-here"
}
```

**Response:**
```json
{
  "access_token": "new-jwt-token-here",
  "refresh_token": "new-refresh-token-here"
}
```

#### GET /auth/profile
Get current user profile (requires authentication)

**Authorization:** Bearer Token required

**Response:**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "created_at": "2025-07-15T10:00:00.000Z"
}
```

#### GET /auth/verify
Verify JWT token

**Authorization:** Bearer Token required

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

#### POST /auth/logout
Logout user (requires authentication)

**Authorization:** Bearer Token required

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Widget Endpoints

#### GET /widgets/stats
Get warehouse statistics

**Response:**
```json
{
  "totalPallets": 1250,
  "activeTransfers": 23,
  "todayGRN": 45,
  "pendingOrders": 67,
  "timestamp": "2025-07-15T08:24:34.055Z"
}
```

#### GET /widgets/inventory
Get inventory data with pagination

**Query Parameters:**
- `limit` (optional): Number of items per page (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Example Request:**
```
GET /api/v1/widgets/inventory?limit=10&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "id": "123",
      "code": "PROD001",
      "description": "Product 1",
      "quantity": 100,
      "location": "A1-01",
      "lastUpdated": "2025-07-15T08:00:00.000Z"
    }
  ],
  "total": 500,
  "limit": 10,
  "offset": 0
}
```

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Environment Configuration

Create a `.env` file in the project root with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Running the Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start

# Watch mode
npm run start:debug
```

### Pallets Endpoints

#### GET /pallets
Get a list of pallets with pagination and filtering

**Query Parameters:**
- `warehouse` (optional): Filter by warehouse
- `productCode` (optional): Filter by product code
- `series` (optional): Filter by series
- `limit` (optional): Number of items per page (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Example Request:**
```
GET /api/v1/pallets?warehouse=WH1&limit=20&offset=0
```

**Response:**
```json
{
  "data": [
    {
      "plt_num": "P123456",
      "product_code": "PROD001",
      "generate_time": "2025-07-15T10:00:00.000Z",
      "series": "A",
      "plt_remark": "Remark text",
      "product_qty": 100,
      "pdf_url": "https://example.com/label.pdf",
      "product_description": "Product Description",
      "location": "A-01-01",
      "warehouse": "WH1"
    }
  ],
  "total": 500,
  "limit": 20,
  "offset": 0
}
```

#### GET /pallets/:id
Get detailed information about a specific pallet

**Parameters:**
- `id`: Pallet number (plt_num)

**Example Request:**
```
GET /api/v1/pallets/P123456
```

**Response:**
```json
{
  "plt_num": "P123456",
  "product_code": "PROD001",
  "generate_time": "2025-07-15T10:00:00.000Z",
  "series": "A",
  "plt_remark": "Remark text",
  "product_qty": 100,
  "pdf_url": "https://example.com/label.pdf",
  "product_description": "Product Description",
  "location": "A-01-01",
  "warehouse": "WH1",
  "transfers": [...],
  "history": [...],
  "current_inventory": {...}
}
```

## Orders Endpoints

### ACO Orders

#### GET /orders/aco
Get a list of ACO (Anticipated Change Order) orders

**Query Parameters:**
- `supplierCode` (optional): Filter by supplier code
- `status` (optional): Filter by order status
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `limit` (optional): Number of items per page (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "ACO001",
      "supplierCode": "SUP001",
      "status": "pending",
      "orderDate": "2025-07-15T10:00:00.000Z",
      "totalAmount": 1500.50,
      "items": [...]
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

#### GET /orders/aco/:id
Get detailed information about a specific ACO order

### GRN Orders

#### GET /orders/grn
Get a list of GRN (Goods Received Note) orders

**Query Parameters:**
- `supplierCode` (optional): Filter by supplier code
- `materialCode` (optional): Filter by material code
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `limit` (optional): Number of items per page (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": "GRN001",
      "supplierCode": "SUP001",
      "materialCode": "MAT001",
      "receivedDate": "2025-07-15T10:00:00.000Z",
      "quantity": 100,
      "palletId": "P123456"
    }
  ],
  "total": 150,
  "limit": 50,
  "offset": 0
}
```

#### GET /orders/grn/:id
Get detailed information about a specific GRN order

## Inventory Endpoints

#### GET /inventory
Get inventory records with advanced filtering

**Query Parameters:**
- `warehouse` (optional): Filter by warehouse
- `location` (optional): Filter by location
- `productCode` (optional): Filter by product code
- `palletId` (optional): Filter by pallet ID
- `stockType` (optional): Filter by stock type (good/damaged/all)
- `limit` (optional): Number of items per page (default: 50)
- `offset` (optional): Number of items to skip (default: 0)

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "palletId": "P123456",
      "productCode": "PROD001",
      "location": "A-01-01",
      "warehouse": "WH1",
      "quantity": 100,
      "damage": 0,
      "lastUpdated": "2025-07-15T10:00:00.000Z"
    }
  ],
  "total": 500,
  "limit": 50,
  "offset": 0
}
```

#### GET /inventory/summary
Get inventory summary statistics

#### GET /inventory/:id
Get detailed information about a specific inventory record

## Transfers Endpoints

#### GET /transfers
Get transfer records with filtering and pagination

**Query Parameters:**
- `palletId` (optional): Filter by pallet ID
- `productCode` (optional): Filter by product code
- `fromLocation` (optional): Filter by source location
- `toLocation` (optional): Filter by destination location
- `status` (optional): Filter by transfer status
- `userId` (optional): Filter by user ID
- `fromDate` (optional): Filter by start date (ISO format)
- `toDate` (optional): Filter by end date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `sortBy` (optional): Sort field (default: created_at)
- `sortOrder` (optional): Sort order (asc/desc, default: desc)
- `search` (optional): Search text for pallet ID or product code

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "palletId": "P123456",
      "productCode": "PROD001",
      "fromLocation": "A-01-01",
      "toLocation": "B-02-02",
      "quantity": 50,
      "status": "completed",
      "userId": 1001,
      "transferDate": "2025-07-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalRecords": 100
  }
}
```

## History Endpoints

#### GET /history
Get operation history records

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `palletId` (optional): Filter by pallet ID
- `productCode` (optional): Filter by product code
- `action` (optional): Filter by action type
- `location` (optional): Filter by location
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of items per page (default: 20)
- `sortBy` (optional): Sort field
- `sortOrder` (optional): Sort order (asc/desc)
- `search` (optional): Search text

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "palletId": "P123456",
      "productCode": "PROD001",
      "action": "TRANSFER",
      "location": "A-01-01",
      "userId": 1001,
      "userName": "John Doe",
      "timestamp": "2025-07-15T10:00:00.000Z",
      "details": "Transferred from A-01-01 to B-02-02"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 10,
    "totalRecords": 200
  }
}
```

#### GET /history/pallet/:palletId
Get history records for a specific pallet

#### GET /history/user/:userId
Get history records for a specific user

## RPC Endpoints

#### GET /rpc/await-location-count
Get count of items awaiting location assignment

**Query Parameters:**
- `location` (optional): Filter by location
- `date` (optional): Filter by date (ISO format)

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 150,
    "locations": [
      {"location": "A1", "count": 50},
      {"location": "B2", "count": 100}
    ],
    "lastUpdated": "2025-07-15T10:30:00Z"
  },
  "metadata": {
    "executionTime": 245,
    "functionName": "await_location_count"
  }
}
```

#### GET /rpc/stock-level-history
Get historical stock level data

**Query Parameters:**
- `productCode` (optional): Filter by product code
- `startDate` (optional): Filter by start date (ISO format)
- `endDate` (optional): Filter by end date (ISO format)
- `location` (optional): Filter by location
- `limit` (optional): Limit results (default: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "productCode": "ABC123",
    "history": [
      {
        "date": "2025-07-15",
        "stockLevel": 100,
        "location": "A1",
        "changeType": "IN",
        "previousLevel": 80,
        "newLevel": 100
      }
    ],
    "summary": {
      "totalRecords": 50,
      "averageLevel": 85.5,
      "maxLevel": 150,
      "minLevel": 20
    }
  }
}
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```
