import DetailComment from '../DetailComment';

describe('DetailComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'comment-123',
      content: 'Comment Content',
      date: '2026-01-01T00:00:00.000Z',
    };

    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      content: 'Comment Content',
      date: '2026-01-01T00:00:00.000Z',
      username: {},
    };

    expect(() => new DetailComment(payload)).toThrowError('DETAIL_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detailComment object correctly', () => {
    const payload = {
      id: 'comment-123',
      content: 'Comment Content',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
    };

    const { id, content, date, username } = new DetailComment(payload);

    expect(id).toEqual(payload.id);
    expect(content).toEqual(payload.content);
    expect(date).toEqual(payload.date);
    expect(username).toEqual(payload.username);
  });

  it('should create detailComment object with placeholder content if isDeleted is true', () => {
    const payload = {
      id: 'comment-123',
      content: 'Comment Content',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
      isDeleted: true,
    };

    const { id, content } = new DetailComment(payload);

    expect(id).toEqual(payload.id);
    expect(content).toEqual('**komentar telah dihapus**');
  });
});
