import DetailThread from '../DetailThread';

describe('DetailThread entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(() => new DetailThread(payload)).toThrowError('GET_THREAD.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      title: {},
      body: true,
      date: '2026-01-01T00:00:00.000Z',
      username: [],
    };

    expect(() => new DetailThread(payload)).toThrowError('GET_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detailThread object correctly', () => {
    const payload = {
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
    };

    const { id, title, body, date, username } = new DetailThread(payload);

    expect(id).toEqual(payload.id);
    expect(title).toEqual(payload.title);
    expect(body).toEqual(payload.body);
    expect(date).toEqual(payload.date);
    expect(username).toEqual(payload.username);
  });
});
