import { nanoid } from 'nanoid';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import pool from '../../database/postgres/pool';
import ReplyRepositoryPostgres from '../ReplyRepositoryPostgres';
import AddReply from '../../../Domains/replies/entities/AddReply';
import AddedReply from '../../../Domains/replies/entities/AddedReply';
import { describe, expect, it } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError';

describe('ReplyRepositoryPostgres', () => {
  let userId;
  let threadId;
  let commentId;

  beforeEach(async () => {
    userId = `user-${nanoid()}`;
    threadId = `thread-${nanoid()}`;
    commentId = `comment-${nanoid()}`;

    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-reply' });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
    await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });

    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    vi.useRealTimers();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addReply function', () => {
    it('should persist add reply and return added reply correctly', async () => {
      const newReply = new AddReply({
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      await replyRepositoryPostgres.addReply(newReply);

      const reply = await CommentsTableTestHelper.findCommentById('reply-123');

      expect(reply).toHaveLength(1);
    });

    it('should return added reply correctly', async () => {
      const newReply = new AddReply({
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, fakeIdGenerator);

      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      expect(addedReply).toStrictEqual(new AddedReply({
        id: 'reply-123',
        content: newReply.content,
        owner: newReply.owner,
      }));
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return replies correctly', async () => {
      await CommentsTableTestHelper.addReply({
        id: 'reply-123',
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId(threadId);

      expect(replies).toHaveLength(1);
      expect(replies[0].id).toBe('reply-123');
    });
  });


  describe('deleteReply function', () => {
    it('should soft delete reply correctly', async () => {
      await CommentsTableTestHelper.addReply({
        id: 'reply-123',
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await replyRepositoryPostgres.deleteReply('reply-123');

      const reply = await CommentsTableTestHelper.findCommentById('reply-123');

      expect(reply[0].is_deleted).toBe(true);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw error if reply not found', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', userId, commentId))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw error if user is not the owner of the reply', async () => {
      await CommentsTableTestHelper.addReply({
        id: 'reply-123',
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-123', commentId))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error if user is the owner of the reply', async () => {
      await CommentsTableTestHelper.addReply({
        id: 'reply-123',
        content: 'Reply Content',
        commentId: commentId,
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(replyRepositoryPostgres.verifyReplyOwner('reply-123', userId, commentId))
        .resolves.not.toThrowError(AuthorizationError);
    });
  });
});
