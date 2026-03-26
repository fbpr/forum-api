import { nanoid } from 'nanoid';
import { afterAll, beforeEach, describe, it } from 'vitest';
import CommentLikesTableTestHelper from '../../../../tests/CommentLikesTableTestHelper';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper';
import CommentsTableTestHelper from '../../../../tests/CommentsTableTestHelper';
import pool from '../../database/postgres/pool';
import CommentLikeRepositoryPostgres from '../CommentLikeRepositoryPostgres';

describe('CommentLikeRepositoryPostgres', () => {
  let userId;
  let threadId;
  let commentId;

  beforeEach(async () => {
    userId = `user-${nanoid()}`;
    threadId = `thread-${nanoid()}`;
    commentId = `comment-${nanoid()}`;

    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-comment-like' });
    await ThreadsTableTestHelper.addThread({ id: threadId, owner: userId });
    await CommentsTableTestHelper.addComment({ id: commentId, threadId, owner: userId });

    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addLike function', () => {
    it('should persist and return added comment like correctly', async () => {
      const fakeIdGenerator = () => '123';
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, fakeIdGenerator);

      await commentLikeRepositoryPostgres.addLike(commentId, userId);

      const commentLike = await CommentLikesTableTestHelper.findLikeById('like-123');

      expect(commentLike).toHaveLength(1);
      expect(commentLike[0].id).toBe('like-123');
      expect(commentLike[0].comment_id).toBe(commentId);
      expect(commentLike[0].user_id).toBe(userId);
    });
  });

  describe('deleteLike function', () => {
    it('should delete comment like correctly', async () => {
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', commentId, userId });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      await commentLikeRepositoryPostgres.deleteLike(commentId, userId);

      const commentLike = await CommentLikesTableTestHelper.findLikeById('like-123');

      expect(commentLike).toHaveLength(0);
    });
  });

  describe('getLikeCountsByCommentIds function', () => {
    it('should return comment like counts correctly', async () => {
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', commentId, userId });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByCommentIds([commentId]);

      expect(likeCounts).toEqual([{ commentId, count: 1 }]);
    });

    it('should return empty array if comments have no likes', async () => {
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      const likeCounts = await commentLikeRepositoryPostgres.getLikeCountsByCommentIds([commentId]);

      expect(likeCounts).toEqual([]);
    });
  });

  describe('verifyLike function', () => {
    it('should return true if comment like exists', async () => {
      await CommentLikesTableTestHelper.addLike({ id: 'like-123', commentId, userId });

      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, {});

      const isLiked = await commentLikeRepositoryPostgres.verifyLike(commentId, userId);

      expect(isLiked).toBe(true);
    });

    it('should return false if comment like does not exist', async () => {
      const commentLikeRepositoryPostgres = new CommentLikeRepositoryPostgres(pool, () => '123');

      const isLiked = await commentLikeRepositoryPostgres.verifyLike(commentId, userId);

      expect(isLiked).toBe(false);
    });
  });
});
