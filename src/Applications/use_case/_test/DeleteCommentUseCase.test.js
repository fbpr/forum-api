import DeleteCommentUseCase from '../DeleteCommentUseCase';

describe('DeleteCommentUseCase', () => {
  it('should orchestrating the delete comment action correctly', async () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const userId = 'user-123';

    const mockCommentRepository = {
      verifyCommentExistsOnThread: vi.fn()
        .mockImplementation(() => Promise.resolve()),
      verifyCommentOwner: vi.fn()
        .mockImplementation(() => Promise.resolve()),
      deleteComment: vi.fn()
        .mockImplementation(() => Promise.resolve()),
    };

    const mockThreadRepository = {
      verifyThreadExists: vi.fn()
        .mockImplementation(() => Promise.resolve()),
    };

    const deleteCommentUseCase = new DeleteCommentUseCase({
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await deleteCommentUseCase.execute({
      userId: userId,
      commentId: commentId,
      threadId: threadId,
    });

    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExistsOnThread)
      .toHaveBeenCalledWith(commentId, threadId);
    expect(mockCommentRepository.verifyCommentOwner)
      .toHaveBeenCalledWith(commentId, userId);
    expect(mockCommentRepository.deleteComment)
      .toHaveBeenCalledWith(commentId);
  });
});