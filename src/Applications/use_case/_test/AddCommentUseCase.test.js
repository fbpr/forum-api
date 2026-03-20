import CommentRepository from '../../../Domains/comments/CommentRepository';
import AddedComment from '../../../Domains/comments/entities/AddedComment';
import ThreadRepository from '../../../Domains/threads/ThreadRepository';
import AddCommentUseCase from '../AddCommentUseCase';

describe('AddCommentUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should orchestrating the add comment action correctly', async () => {
    const useCasePayload = {
      content: 'Comment Content',
      threadId: 'thread-123',
      userId: 'user-123',
    };

    const mockAddedComment = new AddedComment({
      id: 'comment-123',
      content: useCasePayload.content,
      owner: useCasePayload.userId,
    });

    const expectedAddedComment = new AddedComment({
      id: 'comment-123',
      content: 'Comment Content',
      owner: 'user-123',
    });

    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.addComment = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockAddedComment));

    const addCommentUseCase = new AddCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    const addedComment = await addCommentUseCase.execute(useCasePayload);

    expect(addedComment).toStrictEqual(expectedAddedComment);

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.addComment).toBeCalledWith({
      content: useCasePayload.content,
      owner: useCasePayload.userId,
      threadId: useCasePayload.threadId,
      createdAt: new Date().toISOString(),
    });
  });
});
