import CommentLikeRepository from '../../Domains/comments/CommentLikeRepository.js';

class CommentLikeRepositoryPostgres extends CommentLikeRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this.idGenerator = idGenerator;
  }

  async addLike(commentId, userId) {
    const id = `like-${this.idGenerator()}`;
    const query = {
      text: 'INSERT INTO user_comment_likes (id, comment_id, user_id) VALUES ($1, $2, $3)',
      values: [id, commentId, userId],
    };

    await this._pool.query(query);
  }

  async deleteLike(commentId, userId) {
    const query = {
      text: 'DELETE FROM user_comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    await this._pool.query(query);
  }

  async getLikeCountsByCommentIds(commentIds) {
    const query = {
      text: `SELECT comment_id, COUNT(*)
      FROM user_comment_likes
      WHERE comment_id = ANY($1)
      GROUP BY comment_id`,
      values: [commentIds],
    };

    const result = await this._pool.query(query);

    return result.rows.map((row) => ({
      commentId: row.comment_id,
      count: parseInt(row.count, 10),
    }));
  }

  async verifyLike(commentId, userId) {
    const query = {
      text: 'SELECT 1 FROM user_comment_likes WHERE comment_id = $1 AND user_id = $2',
      values: [commentId, userId],
    };

    const result = await this._pool.query(query);

    return result.rowCount > 0;
  }
}

export default CommentLikeRepositoryPostgres;
