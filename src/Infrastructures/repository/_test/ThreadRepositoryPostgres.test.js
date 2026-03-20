import pool from '../../database/postgres/pool.js';
import AddThead from '../../../Domains/threads/entities/AddThread.js';
import AddedThread from '../../../Domains/threads/entities/AddedThread.js';
import ThreadRepositoryPostgres from '../ThreadRepositoryPostgres.js';
import ThreadsTableTestHelper from '../../../../tests/ThreadsTableTestHelper.js';
import UsersTableTestHelper from '../../../../tests/UsersTableTestHelper.js';
import DetailThread from '../../../Domains/threads/entities/DetailThread.js';
import { nanoid } from 'nanoid';
import { it } from 'vitest';
import NotFoundError from '../../../Commons/exceptions/NotFoundError.js';

describe('ThreadRepositoryPostgres', () => {
  let userId;

  beforeEach(async () => {
    userId = `user-${nanoid()}`;

    await UsersTableTestHelper.addUser({ id: userId, username: 'dicoding-thread' });

    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();

    vi.useRealTimers();
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('addThread function', () => {
    it('should persist add thread and return added thread correctly', async () => {
      const newThread = new AddThead({
        title: 'Thread Title',
        body: 'Thread Body',
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      await threadRepositoryPostgres.addThread(newThread);

      const threads = await ThreadsTableTestHelper.findThreadById('thread-123');
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      const newThread = new AddThead({
        title: 'Thread Title',
        body: 'Thread Body',
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const fakeIdGenerator = () => '123';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, fakeIdGenerator);

      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      expect(addedThread).toStrictEqual(new AddedThread({
        id: 'thread-123',
        title: newThread.title,
        owner: newThread.owner,
      }));
    });
  });

  describe('getThreadById function', () => {
    it('should throw error if thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.getThreadById('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should return thread correctly', async () => {
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      const thread = await threadRepositoryPostgres.getThreadById('thread-123');

      expect(thread).toStrictEqual(new DetailThread({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: new Date().toISOString(),
        username: 'dicoding-thread',
      }));
    });
  });

  describe('verifyThreadExists function', () => {
    it('should throw error if thread not found', async () => {
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .rejects.toThrowError(NotFoundError);
    });

    it('should not throw error if thread found', async () => {
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        owner: userId,
        createdAt: new Date().toISOString(),
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      await expect(threadRepositoryPostgres.verifyThreadExists('thread-123'))
        .resolves.not.toThrowError(NotFoundError);
    });
  });
});
