import DetailReply from '../DetailReply';

describe('DetailReply entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      id: 'reply-123',
      content: 'Reply Content',
      date: '2026-01-01T00:00:00.000Z',
    };

    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      id: 123,
      content: 'Reply Content',
      date: '2026-01-01T00:00:00.000Z',
      username: {},
      commentId: [],
    };

    expect(() => new DetailReply(payload)).toThrowError('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
  });

  it('should create detailReply object correctly', () => {
    const payload = {
      id: 'reply-123',
      content: 'Reply Content',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
      commentId: 'comment-123',
    };

    const { id, content, date, username, commentId } = new DetailReply(payload);

    expect(id).toEqual(payload.id);
    expect(content).toEqual(payload.content);
    expect(date).toEqual(payload.date);
    expect(username).toEqual(payload.username);
    expect(commentId).toEqual(payload.commentId);
  });

  it('should create detailReply object with placeholder content if isDeleted is true', () => {
    const payload = {
      id: 'reply-123',
      content: 'Reply Content',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
      commentId: 'comment-123',
      isDeleted: true,
    };

    const { id, content } = new DetailReply(payload);

    expect(id).toEqual(payload.id);
    expect(content).toEqual('**balasan telah dihapus**');
  });
});
