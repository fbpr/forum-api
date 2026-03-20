import NotFoundError from '../../Commons/exceptions/NotFoundError.js';
import ThreadRepository from '../../Domains/threads/ThreadRepository.js';
import AddedThread from '../../Domains/threads/entities/AddedThread.js';
import DetailThread from '../../Domains/threads/entities/DetailThread.js';

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;
  }

  async addThread(newThread) {
    const { title, body, owner, createdAt } = newThread;
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: `INSERT INTO threads (id, title, body, owner, created_at) 
      VALUES($1, $2, $3, $4, $5) RETURNING id, title, owner`,
      values: [id, title, body, owner, createdAt],
    };

    const result = await this._pool.query(query);

    return new AddedThread({ ...result.rows[0] });
  }

  async getThreadById(threadId) {
    const query = {
      text: `SELECT threads.id, threads.title, threads.body, threads.created_at, users.username 
      FROM threads 
      JOIN users ON threads.owner = users.id
      WHERE threads.id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    const { created_at: createdAt, ...rest } = result.rows[0];

    return new DetailThread({ ...rest, date: createdAt.toISOString() });
  }

  async verifyThreadExists(threadId) {
    const query = {
      text: 'SELECT 1 FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }
}

export default ThreadRepositoryPostgres;
