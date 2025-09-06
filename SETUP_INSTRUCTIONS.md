# Gaun Basti - Complete Setup Instructions

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Git

## Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment Configuration**:
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/gaunbasti
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
FRONTEND_URL=http://localhost:8080
```

4. **Start MongoDB** (if running locally):
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

5. **Seed the database with test data**:
```bash
npm run seed
```

6. **Start the backend server**:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`

## Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Environment Configuration**:
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
VITE_API_URL=http://localhost:3000/api
VITE_NODE_ENV=development
```

4. **Start the frontend development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:8080`

## Testing the Application

### Demo Accounts

After running the seed script, you can use these demo accounts:

- **Guest/Traveler**: `guest@example.com` / `password`
- **Host**: `host@example.com` / `password`
- **Host**: `aryalkiran@gmail.com` / `111111`
- **Admin**: `admin@example.com` / `password`
- **Admin**: `aryalkiran@gmail.com` / `111111`
### Role-Based Features

#### Guest/Traveler Features:
- Browse and search listings
- View listing details and reviews
- Make bookings and payments
- Manage personal bookings
- Leave reviews for completed stays

#### Host Features:
- Access host dashboard at `/host`
- Create, edit, and delete own listings
- Manage bookings for their properties
- Update booking status (confirm/cancel)
- View and respond to reviews

#### Admin Features:
- Access admin dashboard at `/admin`
- View platform statistics
- Manage all users, listings, and bookings
- Verify/reject listings
- Moderate reviews and content

### Testing Workflow

1. **Browse Listings**:
   - Visit `/listings` to see all homestays
   - Use search filters (location, price, guests)
   - Click on any listing for details

2. **Make a Booking** (as Guest):
   - Login with guest account
   - Go to a listing detail page
   - Check availability for specific dates
   - Complete booking and payment flow

3. **Manage Listings** (as Host):
   - Login with host account
   - Visit `/host` dashboard
   - Create new listings
   - Manage existing listings and bookings

4. **Admin Operations**:
   - Login with admin account
   - Visit `/admin` dashboard
   - View and manage all platform data

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get current user profile

### Listings
- `GET /api/listings` - Get all listings (public)
- `GET /api/listings/:id` - Get single listing (public)
- `POST /api/listings` - Create listing (host only)
- `PUT /api/listings/:id` - Update listing (host/admin)
- `DELETE /api/listings/:id` - Delete listing (host/admin)

### Bookings
- `POST /api/bookings` - Create booking (traveler only)
- `GET /api/bookings/my-bookings` - Get user bookings (traveler)
- `GET /api/bookings/host/bookings` - Get host bookings (host)
- `PATCH /api/bookings/:id/status` - Update booking status (host)

### Admin
- `GET /api/admin/dashboard` - Dashboard stats (admin only)
- `GET /api/admin/users` - All users (admin only)
- `GET /api/admin/listings` - All listings (admin only)
- `GET /api/admin/bookings` - All bookings (admin only)

## Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
   - Check that both servers are running on correct ports

2. **Database Connection**:
   - Verify MongoDB is running
   - Check `MONGODB_URI` in backend `.env`
   - Run `npm run seed` after successful connection

3. **Authentication Issues**:
   - Clear browser localStorage if experiencing login issues
   - Verify JWT_SECRET is set in backend `.env`

4. **API Not Found Errors**:
   - Ensure backend server is running on port 3000
   - Check `VITE_API_URL` in frontend `.env`

### Development Tips

- Use browser developer tools to monitor API calls
- Check backend console for detailed error messages
- Frontend falls back to dummy data if backend is unavailable
- All demo accounts use password: `password`

## Production Deployment

1. **Backend**:
   - Set `NODE_ENV=production`
   - Use production MongoDB instance
   - Configure proper JWT secret
   - Set up SSL/HTTPS

2. **Frontend**:
   - Update `VITE_API_URL` to production backend URL
   - Build with `npm run build`
   - Deploy static files to hosting service

## Support

For issues and questions, refer to the integration guide or check the API documentation in each controller file.