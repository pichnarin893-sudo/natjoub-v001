# NatJoub Backend API

A comprehensive real-time room booking platform backend that enables business owners to manage their branches and rooms, while allowing customers to browse, book, and manage reservations with real-time updates.

## 🌟 Features

### For Customers
- **Browse & Search**: Advanced filtering for branches and rooms
- **Real-time Booking**: Reserve rooms with live availability updates
- **Payment Integration**: ABA payment gateway with QR code generation
- **Favorites**: Save favorite rooms for quick access
- **Booking Management**: View history and cancel bookings
- **SMS/Email Auth**: Dual authentication options

### For Business Owners
- **Branch Management**: Create and manage multiple branch locations
- **Room Management**: Add, update, and delete rooms with photo uploads
- **Promotions**: Create and attach discounts to branches or specific rooms
- **Analytics Dashboard**: Revenue trends, peak hours, customer insights
- **Performance Metrics**: Track branch and room performance

### For Administrators
- **User Management**: Create and manage platform users
- **Platform Analytics**: System-wide metrics and reporting
- **Branch & Room Oversight**: Full CRUD operations
- **Top Performers**: Identify top branches, rooms, and customers

### Technical Features
- **Real-time Communication**: Socket.IO for live booking updates
- **Role-based Access Control**: Admin, Owner, Customer roles
- **Two-factor Authentication**: OTP via email or SMS
- **JWT Token Management**: Secure authentication with refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Image Upload**: Cloudinary integration for photo management
- **RESTful API**: Well-structured API endpoints

## 🛠️ Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Database**: PostgreSQL 15
- **ORM**: Sequelize
- **Real-time**: Socket.IO
- **Authentication**: JWT, Passport.js
- **Payment**: ABA Payment Gateway
- **Cloud Storage**: Cloudinary
- **Email**: Nodemailer
- **SMS**: Twilio
- **Push Notifications**: Firebase
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest, Supertest

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.x
- **npm** >= 9.x
- **PostgreSQL** >= 15.x
- **Docker** (optional, for containerized setup)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd NatJoub-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=net_joub_v1
DB_HOST=127.0.0.1
DB_PORT=5432

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Nodemailer)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_number

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# ABA Payment Gateway
ABA_PAYWAY_API_URL=https://checkout-sandbox.payway.com.kh
ABA_MERCHANT_ID=your_merchant_id
ABA_API_KEY=your_aba_api_key

# Socket.IO Configuration
SOCKET_IO_URL=http://localhost:5000
```

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create database
createdb net_joub_v1

# Run migrations
npm run db:migrate

# (Optional) Seed database
npm run db:seed
```

#### Option B: Docker Compose

```bash
# Start PostgreSQL and application
docker-compose up

# Migrations run automatically when MIGRATE=true in docker-compose.yml
```

### 5. Run the Application

#### Development Mode (with auto-reload)

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

The server will start at `http://localhost:3000`

## 🐳 Docker Deployment

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services

- **app**: Node.js application (port 3000)
- **db**: PostgreSQL database (port 5435 → 5432)

## 📚 API Documentation

Comprehensive API documentation is available in the `docs/` directory:

- **[API Documentation](docs/API-DOUCUMENT.md)** - Complete endpoint reference
- **[API Quick Reference](docs/API-QUICK-REFERENCES.md)** - Quick lookup guide
- **[Analytics API](docs/ANALYTICS-API-DOCUMENT.md)** - Analytics endpoints
- **[Postman Guide](docs/POSTMAN-GUIDE.md)** - Postman collection setup

### Quick API Overview

#### Base URLs
- User (Public): `http://localhost:3000/api/v1/user`
- User (Private): `http://localhost:3000/api/v1/user/auth`
- Customer: `http://localhost:3000/api/v1/user/auth/customer`
- Owner: `http://localhost:3000/api/v1/user/auth/owner`
- Admin (Public): `http://localhost:3000/api/v1/admin`
- Admin (Private): `http://localhost:3000/api/v1/admin/auth`

### Authentication Flow

1. **Register**: `POST /api/v1/user/register`
2. **Verify OTP**: `POST /api/v1/user/verify-registration-otp`
3. **Login**: `POST /api/v1/user/login` (sends OTP)
4. **Verify Login**: `POST /api/v1/user/verify` (returns JWT tokens)
5. **Use Token**: Include `Authorization: Bearer <token>` in headers
6. **Refresh Token**: `POST /api/v1/user/refresh-token`

## 📁 Project Structure

```
NatJoub-backend/
├── config/                 # Configuration files
│   ├── auth.config.js      # Authentication config
│   ├── cloudinary.js       # Cloudinary setup
│   ├── config.js           # Database config
│   ├── firebase.js         # Firebase setup
│   ├── passport.js         # Passport strategies
│   └── socket.js           # Socket.IO configuration
├── controllers/            # Request handlers
│   └── api/v1/
│       ├── admin/          # Admin controllers
│       ├── owner/          # Owner controllers
│       └── user/           # User controllers
├── middlewares/            # Express middlewares
│   ├── authentication.middleware.js
│   ├── rateLimiter.middleware.js
│   ├── socket.auth.middleware.js
│   └── validation.middleware.js
├── migrations/             # Database migrations
├── models/                 # Sequelize models
├── routes/                 # API routes
│   ├── admin/
│   └── user/
├── seeders/                # Database seeders
├── services/               # Business logic
│   ├── admin/
│   └── user/
├── socket/                 # Socket.IO handlers
│   ├── events/             # Socket event handlers
│   └── emitters/           # Socket emitters
├── utils/                  # Utility functions
├── docs/                   # API documentation
├── index.js                # Application entry point
├── docker-compose.yml      # Docker compose config
└── package.json            # Dependencies
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

## 🗄️ Database Commands

```bash
# Run migrations
npm run db:migrate

# Rollback all migrations
npm run db:migrate:undo

# Run seeders
npm run db:seed

# Rollback all seeders
npm run db:seed:undo
```

## 🔐 Role-Based Access

### User Roles

1. **Admin**
   - Full platform access
   - User management
   - System-wide analytics
   - All CRUD operations

2. **Owner**
   - Manage own branches and rooms
   - Upload photos
   - Create promotions
   - View analytics for owned properties
   - Accept/reject bookings

3. **Customer**
   - Browse branches and rooms
   - Create bookings
   - Manage favorites
   - View booking history
   - Make payments

### Route Protection

Routes are protected using a middleware chain:
```
Public → JWT Auth → Role Check
```

## 🔌 WebSocket Events

### Client → Server

- `join:room` - Join a room for updates
- `booking:create` - Real-time booking creation
- `booking:update` - Update booking status

### Server → Client

- `booking:new` - New booking notification
- `booking:updated` - Booking status changed
- `room:availability` - Room availability updated

## 📊 Analytics Available

### Owner Analytics
- Overview (total revenue, bookings, branches)
- Revenue trends (daily, weekly, monthly)
- Branch performance comparison
- Room performance per branch
- Peak hours analysis
- Customer insights

### Admin Analytics
- Platform-wide overview
- Revenue trends across all branches
- Top performing branches
- Booking status distribution
- Top customers
- Room utilization rates

## 🔧 Development

### Code Organization

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic layer
- **Models**: Database schema and associations
- **Middlewares**: Request processing pipeline
- **Utils**: Reusable utility functions

### Key Patterns

- **Service Layer Pattern**: Controllers delegate to services
- **Repository Pattern**: Models encapsulate data access
- **Middleware Pattern**: Request pipeline processing
- **Event-Driven**: Socket.IO for real-time features

## 🚨 Error Handling

The API uses standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

ISC

## 👥 Team

NetJoub Team

## 📞 Support

For support, please contact the development team or open an issue in the repository.

---

**Built with ❤️ by the NetJoub Team**
