import request from 'supertest';
import bcrypt from 'bcrypt';
import pool from '../../database/postgres/pool.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import AuthenticationsTableTestHelper from '../../../../tests/AuthenticationsTableTestHelper.js';
import container from '../../container.js';
import createServer from '../createServer.js';
import AuthenticationTokenManager from '../../../Applications/security/AuthenticationTokenManager.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper.js';
import { beforeEach, describe, it } from 'vitest';

describe('HTTP server', () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  it('should response 404 when request unregistered route', async () => {
    // Arrange
    const app = await createServer(container);

    // Action
    const response = await request(app).get('/unregisteredRoute');

    // Assert
    expect(response.status).toEqual(404);
  });

  describe('when POST /users', () => {
    it('should response 201 and persisted user', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedUser).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const requestPayload = {
        fullname: 'Dicoding Indonesia',
        password: 'secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 when request payload not meet data type specification', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
        fullname: ['Dicoding Indonesia'],
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena tipe data tidak sesuai');
    });

    it('should response 400 when username more than 50 character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicodingindonesiadicodingindonesiadicodingindonesiadicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena karakter username melebihi batas limit');
    });

    it('should response 400 when username contain restricted character', async () => {
      // Arrange
      const requestPayload = {
        username: 'dicoding indonesia',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat user baru karena username mengandung karakter terlarang');
    });

    it('should response 400 when username unavailable', async () => {
      // Arrange
      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      const requestPayload = {
        username: 'dicoding',
        fullname: 'Dicoding Indonesia',
        password: 'super_secret',
      };
      const app = await createServer(container);

      // Action
      const response = await request(app).post('/users').send(requestPayload);

      // Assert
      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak tersedia');
    });
  });

  describe('when POST /authentications', () => {
    it('should response 201 and new authentication', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should response 400 if username not found', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username tidak ditemukan');
    });

    it('should response 401 if password wrong', async () => {
      const requestPayload = {
        username: 'dicoding',
        password: 'wrong_password',
      };
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('kredensial yang Anda masukkan salah');
    });

    it('should response 400 if login payload not contain needed property', async () => {
      const requestPayload = {
        username: 'dicoding',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan username dan password');
    });

    it('should response 400 if login payload wrong data type', async () => {
      const requestPayload = {
        username: 123,
        password: 'secret',
      };
      const app = await createServer(container);

      const response = await request(app).post('/authentications').send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('username dan password harus string');
    });
  });

  describe('when PUT /authentications', () => {
    it('should return 200 and new access token', async () => {
      const app = await createServer(container);

      await request(app).post('/users').send({
        username: 'dicoding',
        password: 'secret',
        fullname: 'Dicoding Indonesia',
      });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      const { refreshToken } = loginResponse.body.data;
      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 400 payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });

    it('should return 400 if refresh token not string', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 123 });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token harus string');
    });

    it('should return 400 if refresh token not valid', async () => {
      const app = await createServer(container);

      const response = await request(app).put('/authentications').send({ refreshToken: 'invalid_refresh_token' });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak valid');
    });

    it('should return 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = await container.getInstance(AuthenticationTokenManager.name).createRefreshToken({ username: 'dicoding' });

      const response = await request(app).put('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });
  });

  describe('when DELETE /authentications', () => {
    it('should response 200 if refresh token valid', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';
      await AuthenticationsTableTestHelper.addToken(refreshToken);

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 400 if refresh token not registered in database', async () => {
      const app = await createServer(container);
      const refreshToken = 'refresh_token';

      const response = await request(app).delete('/authentications').send({ refreshToken });

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('refresh token tidak ditemukan di database');
    });

    it('should response 400 if payload not contain refresh token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete('/authentications').send({});

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('harus mengirimkan token refresh');
    });
  });

  describe('when POST /threads', () => {
    let accessToken;

    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;
    });

    it('should response 201 and persisted thread', async () => {
      const requestPayload = {
        title: 'Thread Title',
        body: 'Thread Body',
      };
      const app = await createServer(container);

      const response = await request(app).post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedThread).toBeDefined();
    });

    it('should response 401 if request not contain access token', async () => {
      const requestPayload = {
        title: 'Thread Title',
        body: 'Thread Body',
      };
      const app = await createServer(container);

      const response = await request(app).post('/threads')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const requestPayload = {
        title: 'Thread Title',
        body: 'Thread Body',
      };
      const app = await createServer(container);

      const response = await request(app).post('/threads')
        .set('Authorization', 'Bearer invalid_access_token')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 400 if request payload not contain needed property', async () => {
      const requestPayload = {
        title: 'Thread Title',
      };
      const app = await createServer(container);

      const response = await request(app).post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 if request payload not meet data type specification', async () => {
      const requestPayload = {
        title: 'Thread Title',
        body: 123,
      };
      const app = await createServer(container);

      const response = await request(app).post('/threads')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat thread baru karena tipe data tidak sesuai');
    });
  });

  describe('when GET /threads/{threadId}', () => {
    it('should response 200 and thread with comments', async () => {
      const app = await createServer(container);

      await UsersTableTestHelper.addUser({ username: 'dicoding' });
      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      await CommentsTableTestHelper.addComment({ threadId: 'thread-123', owner: 'user-123' });

      const response = await request(app).get('/threads/thread-123');

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.thread).toBeDefined();
      expect(response.body.data.thread.comments).toBeDefined();
    });

    it('should response 404 if thread not found', async () => {
      const app = await createServer(container);

      const response = await request(app).get('/threads/invalid_thread_id');

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });
  });

  describe('when POST /threads/{threadId}/comments', () => {
    let accessToken;
    let threadId;

    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });

      threadId = 'thread-123';
    });

    it('should response 201 and persisted comment', async () => {
      const requestPayload = {
        content: 'Comment Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedComment).toBeDefined();
    });

    it('should response 401 if request not contain access token', async () => {
      const requestPayload = {
        content: 'Comment Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments`)
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const requestPayload = {
        content: 'Comment Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments`)
        .set('Authorization', 'Bearer invalid_access_token')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 404 if thread not found', async () => {
      const requestPayload = {
        content: 'Comment Content',
      };

      const app = await createServer(container);

      const response = await request(app).post('/threads/invalid_thread_id/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 400 if request payload not contain needed property', async () => {
      const requestPayload = {};

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 if request payload not meet data type specification', async () => {
      const requestPayload = {
        content: 123,
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat comment baru karena tipe data tidak sesuai');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    let accessToken;
    let threadId;
    let commentId;
    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      threadId = 'thread-123';

      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      commentId = 'comment-123';
    });

    it('should response 200 and show deleted comment with placeholder content', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const getThreadResponse = await request(app).get(`/threads/${threadId}`);

      expect(getThreadResponse.status).toEqual(200);
      expect(getThreadResponse.body.status).toEqual('success');
      expect(getThreadResponse.body.data.thread.comments[0].content).toEqual('**komentar telah dihapus**');
    });

    it('should response 401 if request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}`);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', 'Bearer invalid_access_token');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 404 if comment not found', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/invalid_comment_id`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 403 if user not owner of the comment', async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe', password: hashedPassword, fullname: 'John Doe' });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'johndoe',
        password: 'secret',
      });

      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('anda tidak berhak mengakses resource ini');
    });
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    let accessToken;
    let threadId;
    let commentId;

    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      threadId = 'thread-123';

      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      commentId = 'comment-123';
    });

    it('should response 201 and persisted reply', async () => {
      const requestPayload = {
        content: 'Reply Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(201);
      expect(response.body.status).toEqual('success');
      expect(response.body.data.addedReply).toBeDefined();
    });

    it('should response 401 if request not contain access token', async () => {
      const requestPayload = {
        content: 'Reply Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const requestPayload = {
        content: 'Reply Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', 'Bearer invalid_access_token')
        .send(requestPayload);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 404 if thread not found', async () => {
      const requestPayload = {
        content: 'Reply Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/invalid_thread_id/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 if comment not found', async () => {
      const requestPayload = {
        content: 'Reply Content',
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/invalid_comment_id/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });

    it('should response 400 if request payload not contain needed property', async () => {
      const requestPayload = {};

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat reply baru karena properti yang dibutuhkan tidak ada');
    });

    it('should response 400 if request payload not meet data type specification', async () => {
      const requestPayload = {
        content: 123,
      };

      const app = await createServer(container);

      const response = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(requestPayload);

      expect(response.status).toEqual(400);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('tidak dapat membuat reply baru karena tipe data tidak sesuai');
    });
  });

  describe(' when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    let accessToken;
    let threadId;
    let commentId;
    let replyId;

    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      threadId = 'thread-123';

      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      commentId = 'comment-123';

      const addReplyResponse = await request(app).post(`/threads/${threadId}/comments/${commentId}/replies`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ content: 'Reply Content' });

      replyId = addReplyResponse.body.data.addedReply.id;
    });

    it('should response 200 and show deleted reply with placeholder content', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');

      const getThreadResponse = await request(app).get(`/threads/${threadId}`);

      expect(getThreadResponse.status).toEqual(200);
      expect(getThreadResponse.body.status).toEqual('success');

      expect(getThreadResponse.body.data.thread.comments[0].replies[0].content).toEqual('**balasan telah dihapus**');
    });

    it('should response 401 if request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', 'Bearer invalid_access_token');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 404 if reply not found', async () => {
      const app = await createServer(container);

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}/replies/invalid_reply_id`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('balasan tidak ditemukan');
    });

    it('should response 403 if user not owner of the reply', async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ id: 'user-456', username: 'johndoe', password: hashedPassword, fullname: 'John Doe' });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'johndoe',
        password: 'secret',
      });

      const accessToken = loginResponse.body.data.accessToken;

      const response = await request(app).delete(`/threads/${threadId}/comments/${commentId}/replies/${replyId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(403);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('anda tidak berhak mengakses resource ini');
    });
  });

  describe('when PUT /threads/{threadId}/comments/{commentId}/likes', () => {
    let accessToken;
    let threadId;
    let commentId;

    beforeEach(async () => {
      const app = await createServer(container);

      const hashedPassword = await bcrypt.hash('secret', 10);
      await UsersTableTestHelper.addUser({ username: 'dicoding', password: hashedPassword });

      const loginResponse = await request(app).post('/authentications').send({
        username: 'dicoding',
        password: 'secret',
      });

      accessToken = loginResponse.body.data.accessToken;

      await ThreadsTableTestHelper.addThread({ id: 'thread-123', owner: 'user-123' });
      threadId = 'thread-123';

      await CommentsTableTestHelper.addComment({ id: 'comment-123', threadId: 'thread-123', owner: 'user-123' });
      commentId = 'comment-123';
    });

    it('should response 200 and like the comment if not liked', async () => {
      const app = await createServer(container);

      const response = await request(app).put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 200 and unlike the comment if already liked', async () => {
      const app = await createServer(container);

      await request(app).put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      const response = await request(app).put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(200);
      expect(response.body.status).toEqual('success');
    });

    it('should response 401 if request not contain access token', async () => {
      const app = await createServer(container);

      const response = await request(app).put(`/threads/${threadId}/comments/${commentId}/likes`);

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('Missing authentication');
    });

    it('should response 401 if access token invalid', async () => {
      const app = await createServer(container);

      const response = await request(app).put(`/threads/${threadId}/comments/${commentId}/likes`)
        .set('Authorization', 'Bearer invalid_access_token');

      expect(response.status).toEqual(401);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('access token tidak valid');
    });

    it('should response 404 if thread not found', async () => {
      const app = await createServer(container);

      const response = await request(app).put(`/threads/invalid_thread_id/comments/${commentId}/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('thread tidak ditemukan');
    });

    it('should response 404 if comment not found', async () => {
      const app = await createServer(container);

      const response = await request(app).put(`/threads/${threadId}/comments/invalid_comment_id/likes`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toEqual(404);
      expect(response.body.status).toEqual('fail');
      expect(response.body.message).toEqual('komentar tidak ditemukan');
    });
  });

  it('should handle server error correctly', async () => {
    // Arrange
    const requestPayload = {
      username: 'dicoding',
      fullname: 'Dicoding Indonesia',
      password: 'super_secret',
    };

    const mockContainer = {
      getInstance: vi.fn().mockImplementation((name) => {
        if (name === 'AuthenticationMiddleware') {
          return {
            authenticateToken: (req, res, next) => {
              next();
            },
          };
        }
        return {};
      }),
    };

    const app = await createServer(mockContainer);

    // Action
    const response = await request(app).post('/users').send(requestPayload);

    // Assert
    expect(response.status).toEqual(500);
    expect(response.body.status).toEqual('error');
    expect(response.body.message).toEqual('terjadi kegagalan pada server kami');
  });
});
