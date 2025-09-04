# Frontend-Backend Integration Guide

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install
npm run seed  # Creates demo data
npm run dev   # Starts server on http://localhost:3000
```

### 2. Start Frontend
```bash
npm install
npm run dev   # Starts frontend on http://localhost:8080
```

## Testing Guide

### Authentication Testing
1. **Demo Login**: Use these accounts:
   - Guest: `guest@example.com` / `password`
   - Host: `host@example.com` / `password` 
   - Admin: `admin@example.com` / `password`

2. **Registration**: Create new account with any email/password

### Features to Test

#### 1. Browse Listings
- Visit `/listings` to see all homestays
- Search by location (e.g., "Pokhara")
- Filter by guests, price range

#### 2. Listing Details
- Click any listing to view details
- Check availability calendar
- Make a booking (requires login)

#### 3. User Account
- Login and visit `/account`
- View your bookings
- See booking status and details

#### 4. Admin Dashboard (admin@example.com)
- Visit `/admin` after admin login
- View users, listings, bookings tables
- Edit user roles and listing status

#### 5. Payment Flow
- Make a booking from listing detail page
- Complete payment with demo card (any 16 digits)
- See confirmation page

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `GET /api/auth/profile` - Get current user

### Listings
- `GET /api/listings` - Get all listings
- `GET /api/listings/featured` - Get featured listings
- `GET /api/listings/:id` - Get single listing
- `POST /api/listings` - Create listing (host only)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/my-bookings` - Get user bookings
- `GET /api/bookings/host/bookings` - Get host bookings

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - All users
- `GET /api/admin/listings` - All listings
- `GET /api/admin/bookings` - All bookings

## Error Handling

The app includes fallback mechanisms:
- If backend is unavailable, frontend uses dummy data
- Demo authentication works without backend
- Graceful error messages for users

## Database Setup

1. Install MongoDB locally or use MongoDB Atlas
2. Update `MONGODB_URI` in backend/.env
3. Run `npm run seed` to create demo data

## Troubleshooting

### CORS Issues
- Backend configured for `http://localhost:8080`
- Check FRONTEND_URL in backend/.env

### Port Conflicts
- Backend: http://localhost:3000
- Frontend: http://localhost:8080
- Change ports in respective config files if needed

### Authentication Issues
- JWT tokens stored in localStorage
- Demo accounts work without backend
- Check browser console for API errors

### Database Connection
- Ensure MongoDB is running
- Check connection string in .env
- Run seed script after connection established