import CommentRepository from '../../../Domains/comments/CommentRepository';
import CommentLikeRepository from '../../../Domains/comments/CommentLikeRepository';
import ThreadRepository from '../../../Domains/threads/ThreadRepository';
import ToggleCommentLikeUseCase from '../ToggleCommentLikeUseCase';

describe('ToggleCommentLikeUseCase', () => {
  it('should orchestrating the like comment action correctly', async () => {
    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 'thread-123',
      userId: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyCommentExistsOnThread = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.verifyLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve(false));

    mockCommentLikeRepository.addLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.deleteLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await toggleCommentLikeUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExistsOnThread).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.threadId,
    );
    expect(mockCommentLikeRepository.verifyLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.userId,
    );
    expect(mockCommentLikeRepository.addLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.userId,
    );
    expect(mockCommentLikeRepository.deleteLike).not.toBeCalled();
  });

  it('should orchestrating the unlike comment action correctly', async () => {
    const useCasePayload = {
      commentId: 'comment-123',
      threadId: 'thread-123',
      userId: 'user-123',
    };

    const mockCommentLikeRepository = new CommentLikeRepository();
    const mockCommentRepository = new CommentRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentRepository.verifyCommentExistsOnThread = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.verifyLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve(true));

    mockCommentLikeRepository.addLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    mockCommentLikeRepository.deleteLike = vi
      .fn()
      .mockImplementation(() => Promise.resolve());

    const toggleCommentLikeUseCase = new ToggleCommentLikeUseCase({
      commentLikeRepository: mockCommentLikeRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await toggleCommentLikeUseCase.execute(useCasePayload);

    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockCommentRepository.verifyCommentExistsOnThread).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.threadId,
    );
    expect(mockCommentLikeRepository.verifyLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.userId,
    );
    expect(mockCommentLikeRepository.deleteLike).toBeCalledWith(
      useCasePayload.commentId,
      useCasePayload.userId,
    );
    expect(mockCommentLikeRepository.addLike).not.toBeCalled();
  });
});
