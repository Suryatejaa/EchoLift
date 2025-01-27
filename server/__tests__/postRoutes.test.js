process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const mongoose = require('mongoose');
const Post = require('../Models/Posts');
const User = require('../Models/userSchema');

let token;
let userId;
let postId;

beforeAll(async () => {
    // Connect to the database

    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    // Create a test user and get a token
    const user = new User({
        name: 'Test User',
        username: 'testuser',
        email: 'testuser@example.com',
        phoneNumber: '1234567890',
        gender: 'male',
        role: 'creator',
        password: 'Test@1234'
    });
    await user.save();
    userId = user._id;
    token = user.generateAuthToken();

    // Create a test post
    const post = new Post({
        userId,
        content: 'Test content',
        title: 'Test title',
        detailedDescription: 'Test detailed description',
        followersRange: '10k-20k',
        category: 'fashion',
        instructions: ['Test instruction 1', 'Test instruction 2']
    });
    await post.save();
    postId = post._id;
});

afterAll(async () => {
    // Clean up the database
    await Post.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
});

describe('Post Routes', () => {
    test('Create a new post', async () => {
        const response = await request(app)
            .post('/posts')
            .set('Authorization', `Bearer ${token}`)
            .send({
                userId,
                content: 'New test content',
                title: 'New test title',
                detailedDescription: 'New test detailed description',
                followersRange: '20k-30k',
                category: 'health',
                instructions: ['New instruction 1', 'New instruction 2']
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('_id');
    });

    test('Get details of a single post', async () => {
        const response = await request(app)
            .get(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('_id', postId.toString());
    });

    test('Update an existing post', async () => {
        const response = await request(app)
            .patch(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                title: 'Updated test title'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('title', 'Updated test title');
    });

    test('Delete a post', async () => {
        const response = await request(app)
            .delete(`/posts/${postId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Post deleted successfully');
    });

    test('Apply to a promotion', async () => {
        const response = await request(app)
            .post(`/posts/${postId}/apply`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Applied to promotion successfully');
    });

    test('Withdraw application from a promotion', async () => {
        const response = await request(app)
            .post(`/posts/${postId}/withdraw`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Application withdrawn successfully');
    });

    test('Bookmark a post', async () => {
        const response = await request(app)
            .post(`/posts/${postId}/bookmark`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Post bookmarked successfully');
    });

    test('Unbookmark a post', async () => {
        const response = await request(app)
            .post(`/posts/${postId}/unbookmark`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Post unbookmarked successfully');
    });

    test('Remove like from a post', async () => {
        const response = await request(app)
            .post(`/posts/${postId}/removelike`)
            .set('Authorization', `Bearer ${token}`)
            .send({ userId });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', 'Like removed successfully');
    });
});