# Gaunbasti Backend API

A comprehensive Node.js backend for the Gaunbasti rural tourism platform, built with Express.js and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Support for guests, hosts, and admins
- **Listings Management**: CRUD operations for homestay listings
- **Booking System**: Complete booking workflow with availability checking
- **Reviews & Ratings**: Review system with detailed ratings
- **Admin Operations**: Comprehensive admin dashboard and moderation tools
- **File Uploads**: Image upload support via Cloudinary
- **Security**: Rate limiting, input validation, and secure headers

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Cloudinary account (for image uploads)

### Installation

1. **Clone and setup**:
```bash
cd backend
npm install
```

2. **Environment Configuration**:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gaunbasti
JWT_SECRET=your_super_secret_jwt_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:8080
```

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Seed the database**:
```bash
npm run seed
```

5. **Start the server**:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token

### Listings
- `GET /api/listings` - Get all listings (with filtering)
- `GET /api/listings/featured` - Get featured listings
- `GET /api/listings/:id` - Get single listing
- `GET /api/listings/:id/availability` - Check availability
- `POST /api/listings` - Create listing (host only)
- `PUT /api/listings/:id` - Update listing (host/admin)
- `DELETE /api/listings/:id` - Delete listing (host/admin)
- `GET /api/listings/host/my-listings` - Get host's listings

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user's bookings
- `GET /api/bookings/host/bookings` - Get host's bookings
- `GET /api/bookings/:id` - Get single booking
- `PATCH /api/bookings/:id/status` - Update booking status (host)
- `PATCH /api/bookings/:id/cancel` - Cancel booking (guest)

### Reviews
- `GET /api/reviews/listing/:listingId` - Get listing reviews
- `POST /api/reviews` - Create review
- `GET /api/reviews/my-reviews` - Get user's reviews
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `POST /api/reviews/:id/respond` - Host response to review
- `POST /api/reviews/:id/flag` - Flag review for moderation

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/analytics` - Platform analytics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `PATCH /api/admin/users/:id/deactivate` - Deactivate user
- `PATCH /api/admin/users/:id/reactivate` - Reactivate user
- `GET /api/admin/listings` - Get all listings
- `PATCH /api/admin/listings/:id/verify` - Verify listing
- `DELETE /api/admin/listings/:id` - Delete listing
- `GET /api/admin/reviews/flagged` - Get flagged reviews
- `PATCH /api/admin/reviews/:id/moderate` - Moderate review

### Users
- `GET /api/users/:id` - Get user profile (public)
- `PUT /api/users/:id` - Update user profile

## Demo Accounts

After running the seed script, you can use these demo accounts:

- **Guest**: `guest@example.com` / `password`
- **Host**: `host@example.com` / `password`
- **Admin**: `admin@example.com` / `password`

## Frontend Integration

### API Base URL
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

### Authentication Headers
```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
};
```

### Example API Calls

**Login**:
```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
```

**Get Listings**:
```javascript
const response = await fetch(`${API_BASE_URL}/listings?location=Pokhara&guests=2`);
const data = await response.json();
```

**Create Booking**:
```javascript
const response = await fetch(`${API_BASE_URL}/bookings`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    listing: listingId,
    startDate: '2024-03-15',
    endDate: '2024-03-20',
    guests: { adults: 2, children: 0 }
  })
});
```

## Database Schema

### User Model
- Authentication and profile information
- Role-based access (guest, host, admin)
- Host-specific profile data

### Listing Model
- Property details and amenities
- Location and pricing information
- Availability calendar
- Verification status

### Booking Model
- Reservation details and dates
- Guest and pricing information
- Status tracking and cancellation

### Review Model
- Rating and comment system
- Detailed category ratings
- Host responses and moderation

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS configuration
- Security headers with Helmet
- Role-based authorization

## Error Handling

The API uses consistent error response format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
backend/
├── controllers/     # Business logic
├── models/         # Database schemas
├── routes/         # API routes
├── middlewares/    # Custom middleware
├── utils/          # Helper functions
├── scripts/        # Database scripts
└── server.js       # Main application file
```

### Adding New Features

1. Create model in `models/`
2. Add controller logic in `controllers/`
3. Define routes in `routes/`
4. Add validation in `middlewares/validation.js`
5. Update this README

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a production MongoDB instance
3. Configure proper JWT secret
4. Set up SSL/HTTPS
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging

## Support

For issues and questions, please contact the development team or create an issue in the project repository.# GAAUBASTI
# GAAUBASTI
