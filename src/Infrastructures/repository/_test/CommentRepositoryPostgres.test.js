import { nanoid } from 'nanoid';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import CommentRepositoryPostgres from '../CommentRepositoryPostgres';
import pool from '../../database/postgres/pool';
import AddedComment from '../../../Domains/comments/entities/AddedComment';
import AddComment from '../../../Domains/comments/entities/AddComment';
import DetailComment from '../../../Domains/comments/entities/DetailComment';
import NotFoundError from '../../../Commons/exceptions/NotFoundError';
import AuthorizationError from '../../../Commons/exceptions/AuthorizationError';

describe('CommentRepositoryPostgres', () => {
  let userId;
  let threadId;

  beforeEach(async () => {
    userId = `user-${nanoid()}`;
    threadId = `thread-${nanoid()}`;

    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-comment' });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });

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

  describe('addComment function', () => {
    it('should persist add comment correctly', async () => {
      const newComment = new AddComment({
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      await commentRepositoryPostgres.addComment(newComment);

      const comment = await CommentsTableTestHelper.findCommentById('comment-123');

      expect(comment).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      const newComment = new AddComment({
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, fakeIdGenerator);

      const addedComment = await commentRepositoryPostgres.addComment(newComment);

      expect(addedComment).toStrictEqual(new AddedComment({
        id: 'comment-123',
        content: newComment.content,
        owner: newComment.owner,
      }));
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return comments correctly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      vi.advanceTimersByTime(1000);

      await CommentsTableTestHelper.addComment({
        id: 'comment-124',
        content: 'Comment Content 2',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(threadId);

      expect(comments).toHaveLength(2);

      expect(comments[0]).toStrictEqual(new DetailComment({
        id: 'comment-123',
        content: 'Comment Content',
        date: new Date('2026-01-01T00:00:00Z').toISOString(),
        username: 'dicoding-comment',
      }));

      expect(comments[1]).toStrictEqual(new DetailComment({
        id: 'comment-124',
        content: 'Comment Content 2',
        date: new Date('2026-01-01T00:00:01Z').toISOString(),
        username: 'dicoding-comment',
      }));
    });
  });

  describe('deleteComment function', () => {
    it('should soft delete comment correctly', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteComment('comment-123');

      const comments = await CommentsTableTestHelper.findCommentById('comment-123');

      expect(comments[0].is_deleted).toBe(true);
    });
  });

  describe('verifyCommentExistsOnThread function', () => {
    it('should throw error if comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExistsOnThread('comment-123', threadId))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw error if comment found', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentExistsOnThread('comment-123', threadId))
        .resolves.not.toThrow(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should throw error if comment not found', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', userId))
        .rejects.toThrowError(NotFoundError);
    });

    it('should throw error if user is not the owner of the comment', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-123'))
        .rejects.toThrowError(AuthorizationError);
    });

    it('should not throw error if user is the owner of the comment', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-123',
        content: 'Comment Content',
        threadId: threadId,
        owner: userId,
        createdAt: new Date().toISOString(),
      });

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(commentRepositoryPostgres.verifyCommentOwner('comment-123', userId))
        .resolves.not.toThrow(AuthorizationError);
    });
  });
});