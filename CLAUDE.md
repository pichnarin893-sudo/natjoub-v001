# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NatJoub is a real-time room booking platform backend built with Node.js, Express, PostgreSQL, and Socket.IO. The platform supports three user roles: Admin, Owner (business owners who manage branches and rooms), and Customer (users who book rooms).

## Development Commands

### Running the Application
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon (auto-reload)

### Database Commands
- `npm run db:migrate` - Run all pending migrations
- `npm run db:migrate:undo` - Rollback all migrations
- `npm run db:seed` - Run all seeders
- `npm run db:seed:undo` - Rollback all seeders

### Testing
- `npm test` - Run Jest test suite

### Docker
- `docker-compose up` - Start application with PostgreSQL in containers
- Database accessible on port 5435 (mapped from container's 5432)

## Architecture

### Entry Point
- `index.js` - Main server file that:
  - Initializes Express app
  - Tests database and Cloudinary connections
  - Creates HTTP server and attaches Socket.IO
  - Registers routes under `/api/v1/user` and `/api/v1/admin`
  - Listens on port 3000 (or PORT env variable)

### Authentication & Authorization Flow

**Three-step authentication system:**
1. User submits credentials via `/login` endpoint
2. OTP sent via email (for email auth) or SMS (for phone auth)
3. User verifies OTP via `/verify` endpoint to receive JWT tokens

**JWT token management:**
- Access tokens stored in secure token store (`utils/secureStore`)
- Tokens can be invalidated (blacklisted) on logout
- Refresh tokens used to obtain new access tokens
- Token verification in `middlewares/authentication.middleware.js`

**Role-based access control:**
- Roles defined: admin, owner, customer
- Passport configuration in `config/passport.js` wraps authentication middleware
- Middleware chain: `passport.authenticateJwt` → `passport.checkAdminRole/checkOwnerRole/checkCustomerRole`
- Route protection: public routes → private routes → role-specific routes

### Route Organization

**User Routes** (`routes/user/user.routes.js`):
- Public routes: registration, login, OTP verification
- Private routes protected by JWT authentication
- Two role-specific sub-routers:
  - `ownerRouter` - Branch/room management, analytics, promotions
  - `customerRouter` - Room browsing, booking, favorites, filtering

**Admin Routes** (`routes/admin/admin.routes.js`):
- Public: admin login/OTP verification
- Private: All routes require both JWT + admin role
- Admin capabilities: user management, branch/room CRUD, analytics

### Models & Associations

Key Sequelize models in `models/`:
- `users` - Has role_id, belongs to roles, has many branches (as owner), bookings (as customer)
- `branches` - Belongs to users (owner), has many rooms
- `rooms` - Belongs to branches, has many bookings
- `bookings` - Belongs to users (customer), rooms, and promotions
- `promotions` - Can be attached to branches or rooms via junction tables
- `credentials` - Email/password for email-based auth
- `sms_credentials` - Phone/OTP for SMS-based auth
- `payments` & `aba_transactions` - Payment processing

Model associations defined in each model's `associate()` method and loaded via `models/index.js`.

### Service Layer

Services organized by domain in `services/admin/` and `services/user/`:
- **Auth services**: Handle OTP generation, token creation, login/logout
- **Branch services**: CRUD operations, photo uploads (Cloudinary)
- **Room services**: CRUD operations, availability checking, photo uploads
- **Booking services**: Room reservation, payment verification (ABA), time slot validation
- **Analytics services**: Revenue trends, branch/room performance, customer insights
- **Filtering services**: Complex search/filter logic for branches and rooms

### Real-time Communication (Socket.IO)

Socket.IO configuration in `config/socket.js`:
- Authenticated via `middlewares/socket.auth.middleware.js` (JWT verification)
- Event handlers organized in `socket/events/`:
  - `connection.events.js` - Connection/disconnection handling
  - `booking.events.js` - Real-time booking updates
  - `room.events.js` - Room availability updates
- Socket handler registration in `socket/socket.handler.js`
- Access Socket.IO instance via `req.app.get('io')` in route handlers

### Middleware

Key middleware in `middlewares/`:
- `authentication.middleware.js` - JWT verification and role checking
- `validation.middleware.js` - express-validator schemas for request validation
- `rateLimiter.middleware.js` - Rate limiting for auth/OTP endpoints
- `socket.auth.middleware.js` - Socket.IO authentication

### Configuration Files

In `config/`:
- `config.js` - Sequelize database configuration (development/test/production)
- `passport.js` - Passport wrapper for authentication middleware
- `socket.js` - Socket.IO initialization
- `cloudinary.js` - Cloudinary configuration for photo uploads
- `firebase.js` - Firebase configuration (notifications)
- `db.test.connection.js` - Database connection testing utility

### Database Configuration

PostgreSQL connection configured via environment variables:
- `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`
- Sequelize models auto-loaded from `models/` directory
- Migrations in `migrations/`, seeders in `seeders/`

### Payment Integration

ABA payment gateway integration:
- `models/aba_transactions.js` - Transaction records
- Payment verification in booking service
- Transaction status tracking: pending, completed, failed

## Important Implementation Notes

### Photo Uploads
- Cloudinary used for branch and room photos
- Upload endpoints separate from entity creation
- Photos stored in `photos` model with public_id for deletion
- Services: `branchService.uploadBranchPhotos()`, `roomService.uploadRoomPhotos()`, `branchService.deletePhoto()`

### Booking Time Slots
- Room availability based on existing bookings
- Time slot validation prevents double-booking
- Real-time updates via Socket.IO when bookings change
- Check `booking.service.js` for slot validation logic

### Promotions
- Promotions can be attached to branches or rooms
- Junction tables: `branch_promotions`, `room_promotions`
- Discount applied during booking creation
- Owner-only feature for their own branches/rooms

### Role-based Route Access
Routes follow this pattern:
```
router (public)
  ↓
privateRouter (JWT required via passport.authenticateJwt)
  ↓
roleRouter (specific role via passport.checkAdminRole/checkOwnerRole/checkCustomerRole)
```

### OTP Security
- OTP rate limiting enforced
- Separate limiters for login attempts, OTP requests, and branch creation
- OTP expiration handled in auth services
- Both email and SMS OTP supported

## Environment Variables

Required in `.env`:
- Database: `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`
- Server: `PORT`, `BASE_URL`
- Auth: JWT secret configuration
- Email: `EMAIL_USER`, `EMAIL_PASS` (nodemailer)
- Cloudinary: API credentials
- Firebase: Push notification credentials
- Twilio: SMS credentials (for SMS auth)
- Socket.IO: `SOCKET_IO_URL` for CORS

## Testing

Jest configured for testing. Test files should be placed in `test/` directory or use `.test.js` suffix to be excluded from model auto-loading.
