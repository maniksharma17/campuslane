import request from 'supertest';
import app from '../src/app';
import { Admin } from '../src/models/Admin';
import { Class } from '../src/models/Class';

describe('Content Management', () => {
  let adminToken: string;

  beforeEach(async () => {
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
  });

  describe('Classes', () => {
    it('should create a new class', async () => {
      const classData = {
        name: 'Test Class',
        description: 'Test class description',
      };

      const response = await request(app)
        .post('/api/v1/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(classData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(classData.name);
    });

    it('should get all classes', async () => {
      await Class.create({
        name: 'Class 1',
        description: 'First class',
      });

      const response = await request(app)
        .get('/api/v1/classes')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should update a class', async () => {
      const classItem = await Class.create({
        name: 'Original Name',
        description: 'Original description',
      });

      const updateData = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/v1/classes/${classItem._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should soft delete a class', async () => {
      const classItem = await Class.create({
        name: 'To Delete',
        description: 'This will be deleted',
      });

      const response = await request(app)
        .delete(`/api/v1/classes/${classItem._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify soft delete
      const deletedClass = await Class.findById(classItem._id);
      expect(deletedClass?.isDeleted).toBe(true);
    });
  });
});