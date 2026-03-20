import AuthorizationError from '../../Commons/exceptions/AuthorizationError.js';
import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import AddedReply from '../../Domains/replies/entities/AddedReply.js';
import DetailReply from '../../Domains/replies/entities/DetailReply.js';
import ReplyRepository from '../../Domains/replies/ReplyRepository.js';

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addReply(newReply) {
    const { content, owner, threadId, commentId: parentId, createdAt } = newReply;
    const id = `reply-${this._idGenerator()}`;

    const query = {
      text: `INSERT INTO comments (id, content, owner, thread_id, parent_id, created_at)
      VALUES($1, $2, $3, $4, $5, $6) RETURNING id, content, owner`,
      values: [id, content, owner, threadId, parentId, createdAt],
    };

    const result = await this._pool.query(query);

    return new AddedReply({ ...result.rows[0] });
  }

  async getRepliesByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, comments.content, comments.created_at, comments.parent_id, comments.is_deleted, users.username
      FROM comments
      JOIN users ON comments.owner = users.id
      WHERE comments.thread_id = $1 AND comments.parent_id IS NOT NULL
      ORDER BY comments.created_at ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => new DetailReply({
      ...row,
      date: row.created_at.toISOString(),
      isDeleted: row.is_deleted,
      commentId: row.parent_id,
    }));
  }

  async deleteReply(replyId) {
    const query = {
      text: 'UPDATE comments SET is_deleted = true WHERE id = $1',
      values: [replyId],
    };

    await this._pool.query(query);
  }

  async verifyReplyExistsOnComment(replyId, commentId) {
    const query = {
      text: 'SELECT 1 FROM comments WHERE id = $1 AND parent_id = $2',
      values: [replyId, commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT owner FROM comments WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('balasan tidak ditemukan');
    }

    const replyOwner = result.rows[0].owner;
    if (replyOwner !== owner) {
      throw new AuthorizationError('anda tidak berhak mengakses resource ini');
    }
  }
}

export default ReplyRepositoryPostgres;