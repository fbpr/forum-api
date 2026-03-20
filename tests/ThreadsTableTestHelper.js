/* istanbul ignore file */
import pool from '../src/Infrastructures/database/postgres/pool.js';

const ThreadsTableTestHelper = {
  async addThread({
    id = 'thread-123', title = 'Thread Title', body = 'Thread Body', owner = 'user-123', createdAt = new Date().toISOString(),
  }) {
    const query = {
      text: `INSERT INTO threads (id, title, body, owner, created_at) 
      VALUES($1, $2, $3, $4, $5)`,
      values: [id, title, body, owner, createdAt],
    };

    await pool.query(query);
  },

  async findThreadById(id) {
    const query = {
      text: 'SELECT * FROM threads WHERE id = $1',
      values: [id],
    };

    const result = await pool.query(query);
    return result.rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM threads WHERE 1=1');
  },
};

export default ThreadsTableTestHelper;
