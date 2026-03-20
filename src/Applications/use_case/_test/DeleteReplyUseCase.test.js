import DeleteReplyUseCase from '../DeleteReplyUseCase';

describe('DeleteReplyUseCase', () => {
  it('should orchestrating the delete reply action correctly', async () => {
    const threadId = 'thread-123';
    const commentId = 'comment-123';
    const replyId = 'reply-123';
    const userId = 'user-123';

    const mockReplyRepository = {
      verifyReplyExistsOnComment: vi.fn()
        .mockImplementation(() => Promise.resolve()),
      verifyReplyOwner: vi.fn()
        .mockImplementation(() => Promise.resolve()),
      deleteReply: vi.fn()
        .mockImplementation(() => Promise.resolve()),
    };

    const mockCommentRepository = {
      verifyCommentExistsOnThread: vi.fn()
        .mockImplementation(() => Promise.resolve()),
    };

    const mockThreadRepository = {
      verifyThreadExists: vi.fn()
        .mockImplementation(() => Promise.resolve()),
    };

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    await deleteReplyUseCase.execute({
      userId,
      replyId,
      commentId,
      threadId
    });

    expect(mockThreadRepository.verifyThreadExists)
      .toHaveBeenCalledWith(threadId);
    expect(mockCommentRepository.verifyCommentExistsOnThread)
      .toHaveBeenCalledWith(commentId, threadId);
    expect(mockReplyRepository.verifyReplyExistsOnComment)
      .toHaveBeenCalledWith(replyId, commentId);
    expect(mockReplyRepository.verifyReplyOwner)
      .toHaveBeenCalledWith(replyId, userId);
    expect(mockReplyRepository.deleteReply)
      .toHaveBeenCalledWith(replyId);
  });
});