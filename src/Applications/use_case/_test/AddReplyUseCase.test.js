import { afterEach, beforeEach, expect } from 'vitest';
import CommentRepository from '../../../Domains/comments/CommentRepository';
import AddedReply from '../../../Domains/replies/entities/AddedReply';
import AddReply from '../../../Domains/replies/entities/AddReply';
import ReplyRepository from '../../../Domains/replies/ReplyRepository';
import AddReplyUseCase from '../AddReplyUseCase';
import ThreadRepository from '../../../Domains/threads/ThreadRepository';

describe('AddReplyUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should orchestrating the add reply action correctly', async () => {
    const useCasePayload = {
      content: 'Reply Content',
      threadId: 'thread-123',
      commentId: 'comment-123',
      userId: 'user-123',
    };


    const mockAddedReply = new AddedReply({
      id: 'reply-123',
      content: useCasePayload.content,
      owner: useCasePayload.userId,
    });

    const expectedAddedReply = new AddedReply({
      id: 'reply-123',
      content: 'Reply Content',
      owner: 'user-123',
    });

    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockThreadRepository = new ThreadRepository();

    mockThreadRepository.verifyThreadExists = vi
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockCommentRepository.verifyCommentExistsOnThread = vi
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.addReply = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockAddedReply));

    const addReplyUseCase = new AddReplyUseCase({
      replyRepository: mockReplyRepository,
      commentRepository: mockCommentRepository,
      threadRepository: mockThreadRepository,
    });

    const addedReply = await addReplyUseCase.execute(useCasePayload);

    expect(addedReply).toStrictEqual(expectedAddedReply);

    expect(mockCommentRepository.verifyCommentExistsOnThread).toBeCalledWith(useCasePayload.commentId, useCasePayload.threadId);
    expect(mockThreadRepository.verifyThreadExists).toBeCalledWith(useCasePayload.threadId);
    expect(mockReplyRepository.addReply).toBeCalledWith(new AddReply({
      ...useCasePayload,
      commentId: useCasePayload.commentId,
      threadId: useCasePayload.threadId,
      owner: useCasePayload.userId,
      createdAt: new Date().toISOString(),
    }));
  });
});