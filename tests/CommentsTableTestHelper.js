/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const CommentsTableTestHelper = {
  async addComment({
    id = 'comment-123', content = 'Comment Content', threadId = 'thread-123', owner = 'user-123', createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: `INSERT INTO comments(id, content, owner, thread_id, created_at) 
      VALUES($1, $2, $3, $4, $5)`,
      values: [id, content, owner, threadId, createdAt],
    };

    await pool.query(query);
  },

  async findCommentById(id) {
    const query = {
      text: 'SELECT * FROM comments WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);

    return result.rows;
  },

  async addReply({
    id = 'reply-123', content = 'Reply Content', threadId = 'thread-123', commentId = 'comment-123', owner = 'user-123', createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: `INSERT INTO comments(id, content, owner, thread_id, parent_id, created_at) 
      VALUES($1, $2, $3, $4, $5, $6)`,
      values: [id, content, owner, threadId, commentId, createdAt],
    };

    await pool.query(query);
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments WHERE 1=1');
  },
};

export default CommentsTableTestHelper;
