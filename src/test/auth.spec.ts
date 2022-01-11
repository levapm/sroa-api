import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();
import app from '../app';
import assert from 'assert';


describe('Test Auth routes', function () {

  test('should handle login error', async () => {
    await request(app)
     .post('/api/login')
     .send({email: 'noexists@gmail.com', password: 'TestPassword'})
     .expect(403)
     .expect((response) => {
      assert.ok(response.text.includes('User does not exist'));
     });
     
  });

  const fakeEmail = `newUser${Date.now()}@gmail.com`;

  test('should register new User', async () => {
    await request(app)
     .post('/api/register')
     .send({email: fakeEmail, password: 'TestPassword', name: 'Test'})
     .expect(201)
     .expect((response) => {
      assert.ok(response.text.includes('success'));
     });
  });

  test('should handle error for exist user', async () => {
     await request(app)
     .post('/api/register')
     .send({email: fakeEmail, password: 'TestPassword', name: 'Test'})
     .expect(403)
     .expect((response) => {
      assert.ok(response.text.includes('User already exists'));
     });
  });
  
  test('should login User and return token', async () => {
     await request(app)
     .post('/api/login')
     .send({email: fakeEmail, password: 'TestPassword'})
     .expect(200)
     .expect((response) => {
      assert.ok(response.text.includes('token'));
     });
  });
  
  test('should handle invalid credentials ', async () => {
    await request(app)
    .post('/api/login')
    .send({email: fakeEmail, password: 'TestPassword123'})
    .expect(403)
    .expect((response) => {
     assert.ok(response.text.includes('Invalid Credentials'));
    });
 });

});