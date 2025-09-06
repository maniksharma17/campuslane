import request from 'supertest';
import app from '../src/app';
import { Admin } from '../src/models/Admin';
import { User } from '../src/models/User';

describe('Authentication', () => {
  describe('POST /api/v1/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      // Create test admin
      const admin = new Admin({
        email: 'test@admin.com',
        password: 'password123',
        name: 'Test Admin',
      });
      await admin.save();

      const response = await request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'test@admin.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.admin.email).toBe('test@admin.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'wrong@admin.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Routes', () => {
    let adminToken: string;
    let userToken: string;

    beforeEach(async () => {
      // Create admin and get token
      const admin = new Admin({
        email: 'admin@test.com',
        password: 'password123',
        name: 'Test Admin',
      });
      await admin.save();

      const adminResponse = await request(app)
        .post('/api/v1/admin/login')
        .send({
          email: 'admin@test.com',
          password: 'password123',
        });

      adminToken = adminResponse.body.data.token;

      // Create user for user token simulation
      const user = new User({
        name: 'Test Student',
        email: 'student@test.com',
        role: 'student',
        age: 10,
        studentCode: 'STU-TEST-123',
        googleId: 'google-test-123',
      });
      await user.save();

      // Simulate user token (in real app this would come from Google Sign-In)
      const jwt = require('jsonwebtoken');
      userToken = jwt.sign(
        { userId: user._id.toString(), role: 'student' },
        process.env.JWT_SECRET || 'test-secret'
      );
    });

    it('should require authentication for protected routes', async () => {
      const response = await request(app)
        .get('/api/v1/classes');

      expect(response.status).toBe(401);
    });

    it('should allow access with valid user token', async () => {
      const response = await request(app)
        .get('/api/v1/classes')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
    });

    it('should allow admin access to admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject user access to admin routes', async () => {
      const response = await request(app)
        .get('/api/v1/admin/teachers')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(401);
    });
  });
});