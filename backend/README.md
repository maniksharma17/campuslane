# Campus Lane - EdTech Platform Backend

A production-ready Express.js + TypeScript backend for a kids educational platform with comprehensive features including authentication, content management, progress tracking, and e-commerce.

## 🚀 Features

- **Multi-Role Authentication**: Google Sign-In for users, email/password for admin
- **Content Hierarchy**: Class → Subject → Chapter → Content with approval workflows
- **Progress Tracking**: Video time tracking, quiz scoring, completion status
- **Parent-Child Linking**: Secure approval system for parent access to child progress
- **E-commerce**: Products, cart, orders, wishlist, reviews with school-specific uniforms
- **Analytics**: Real-time aggregated insights for admins and teachers
- **Notifications**: Event-driven notification system
- **File Uploads**: S3 integration with pre-signed URLs

## 🛠 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens, Google OAuth
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, rate limiting, input sanitization
- **Testing**: Jest + Supertest
- **Documentation**: Swagger/OpenAPI

## 📦 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB instance
- AWS S3 bucket
- Google OAuth credentials

### Installation

1. **Clone and install dependencies**:
```bash
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Database Setup**:
```bash
# Seed the database with sample data
npm run seed
```

4. **Development**:
```bash
# Start development server
npm run dev
```

5. **Production**:
```bash
# Build and start
npm run build
npm start
```

## 🔧 Environment Variables

Create a `.env` file with the following variables:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/campus-lane
JWT_SECRET=your-super-secret-jwt-key-here
GOOGLE_CLIENT_ID=your-google-client-id
ADMIN_EMAIL=admin@campuslane.com
ADMIN_PASSWORD=admin123
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=campus-lane-uploads
NODE_ENV=development
```

## 📚 API Documentation

After starting the server, visit:
- **Swagger UI**: `http://localhost:4000/api-docs`
- **Health Check**: `http://localhost:4000/api/v1/health`

## 🎯 User Roles & Permissions

### Student
- View approved content
- Track learning progress
- Approve/reject parent link requests
- Manage cart, orders, wishlist, reviews

### Teacher
- Upload content (pending approval)
- Edit own pending content
- View analytics for own content
- Must be approved by admin to access features

### Parent
- Request links to children
- View linked children's progress
- Purchase items from store

### Admin
- Approve teachers and content
- Full CRUD on all content hierarchy
- Manage e-commerce (schools, categories, products)
- Access comprehensive analytics
- Manage orders and users

## 🔗 Key API Endpoints

### Authentication
```bash
# Google Sign-In (Students, Teachers, Parents)
POST /api/v1/auth/google
Content-Type: application/json
{
  "idToken": "google-jwt-token",
  "role": "student",
  "age": 10
}

# Admin Login
POST /api/v1/admin/login
Content-Type: application/json
{
  "email": "admin@campuslane.com",
  "password": "admin123"
}
```

### Content Management
```bash
# Get approved content (students/parents)
GET /api/v1/content?classId=XXXX&approvalStatus=approved
Authorization: Bearer <user-token>

# Upload content (teachers/admin)
POST /api/v1/content
Authorization: Bearer <teacher-token>
Content-Type: application/json
{
  "title": "Lesson Title",
  "classId": "class-id",
  "subjectId": "subject-id", 
  "chapterId": "chapter-id",
  "type": "video",
  "videoUrl": "https://example.com/video.mp4"
}

# Approve content (admin only)
PATCH /api/v1/admin/content/CONTENT_ID/approve
Authorization: Bearer <admin-token>
```

### Progress Tracking
```bash
# Start content (students)
POST /api/v1/progress/open
Authorization: Bearer <student-token>
{
  "contentId": "content-id"
}

# Record video time
POST /api/v1/progress/video/ping
Authorization: Bearer <student-token>
{
  "contentId": "content-id",
  "secondsSinceLastPing": 30
}

# Complete content
POST /api/v1/progress/complete
Authorization: Bearer <student-token>
{
  "contentId": "content-id",
  "quizScore": 85
}
```

### Parent-Child Linking
```bash
# Parent requests link
POST /api/v1/parent/links
Authorization: Bearer <parent-token>
{
  "studentCode": "STU-SAMPLE-12345"
}

# Student approves link
PATCH /api/v1/student/links/LINK_ID/approve
Authorization: Bearer <student-token>

# Parent views child progress
GET /api/v1/progress/child/CHILD_ID
Authorization: Bearer <parent-token>
```

### E-commerce
```bash
# Add to cart
POST /api/v1/cart/items
Authorization: Bearer <user-token>
{
  "productId": "product-id",
  "variantId": "variant-id",
  "quantity": 2
}

# Checkout
POST /api/v1/orders/checkout
Authorization: Bearer <user-token>
{
  "paymentType": "COD",
  "shippingAddress": {
    "name": "John Doe",
    "phone": "+1234567890",
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipcode": "400001",
    "country": "India"
  }
}
```

### File Uploads
```bash
# Get pre-signed URL (admin/teachers)
POST /api/v1/admin/presign
Authorization: Bearer <admin-token>
{
  "fileName": "lesson-video.mp4",
  "contentType": "video/mp4",
  "fileSize": 10485760
}

# Then upload to the returned S3 URL using PUT method
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment Considerations

1. **Database**: Use MongoDB Atlas for production
2. **File Storage**: Configure AWS S3 with proper IAM policies
3. **Environment**: Set `NODE_ENV=production`
4. **Security**: Use strong JWT secrets and enable HTTPS
5. **Monitoring**: Add application monitoring and logging
6. **Scaling**: Consider horizontal scaling with load balancers

## 📊 Database Schema

### Core Models
- **User**: Students, teachers, parents with role-based fields
- **Admin**: Separate admin accounts with email/password auth
- **Class/Subject/Chapter**: Educational content hierarchy
- **Content**: Learning materials with approval workflow
- **Progress**: Student learning progress and time tracking

### E-commerce Models
- **School**: Educational institutions for uniform linking
- **Category**: Product categorization
- **Product**: Items with variants and school associations
- **Cart/Order**: Shopping and order management
- **Wishlist/Review**: User preferences and feedback

### System Models
- **ParentChildLink**: Secure parent-child connections
- **Notification**: Event-driven messaging system

## 🔐 Security Features

- JWT-based authentication with role verification
- Input validation and sanitization
- Rate limiting on authentication and upload endpoints
- Soft-delete patterns for data integrity
- Row-level security through ownership checks
- S3 pre-signed URLs for secure file uploads

## 📈 Analytics & Insights

### Admin Analytics
- User registration and approval statistics
- Content creation and approval metrics  
- Student engagement and completion rates
- E-commerce sales and revenue tracking

### Teacher Analytics
- Personal content performance metrics
- Student engagement with teacher's content
- Approval status tracking for uploaded materials

## 🎨 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "pagination": { 
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "stack": "... (development only)"
  }
}
```

---

**Campus Lane Backend** - Built for scalable educational technology with comprehensive features for students, teachers, parents, and administrators.