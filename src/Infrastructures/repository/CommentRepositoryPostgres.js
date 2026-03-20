import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import CommentRepository from '../../Domains/comments/CommentRepository.js';
import AddedComment from '../../Domains/comments/entities/AddedComment.js';
import DetailComment from '../../Domains/comments/entities/DetailComment.js';

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addComment(newComment) {
    const { content, owner, threadId, createdAt } = newComment;
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: `INSERT INTO comments (id, content, owner, thread_id, created_at) 
      VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner`,
      values: [id, content, owner, threadId, createdAt],
    };

    const result = await this._pool.query(query);

    return new AddedComment({ ...result.rows[0] });
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, comments.content, comments.created_at, comments.is_deleted, users.username 
      FROM comments 
      JOIN users ON comments.owner = users.id
      WHERE comments.thread_id = $1 AND comments.parent_id IS NULL
      ORDER BY comments.created_at ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => {
      const { created_at: createdAt, is_deleted: isDeleted, ...rest } = row;
      return new DetailComment({
        ...rest,
        date: createdAt.toISOString(),
        isDeleted,
      });
    });
  }

  async deleteComment(commentId) {
    const query = {
      text: 'UPDATE comments SET is_deleted = true WHERE id = $1',
      values: [commentId],
    };

    await this._pool.query(query);
  }

  async verifyCommentExistsOnThread(commentId, threadId) {
    const query = {
      text: 'SELECT 1 FROM comments WHERE id = $1 AND thread_id = $2 AND parent_id IS NULL',
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('komentar tidak ditemukan');
    }

    const commentOwner = result.rows[0].owner;
    if (commentOwner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }
}

export default CommentRepositoryPostgres;
