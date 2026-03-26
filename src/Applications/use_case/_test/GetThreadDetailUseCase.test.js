import { expect } from 'vitest';
import CommentLikeRepository from '../../../Domains/comments/CommentLikeRepository';
import CommentRepository from '../../../Domains/comments/CommentRepository';
import ReplyRepository from '../../../Domains/replies/ReplyRepository';
import ThreadRepository from '../../../Domains/threads/ThreadRepository';
import GetThreadDetailUseCase from '../GetThreadDetailUseCase';

describe('GetThreadDetailUseCase', () => {
  it('should orchestrating the get thread detail action correctly', async () => {
    const useCasePayload = {
      threadId: 'thread-123',
    };

    const mockThread = {
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
    };

    const mockComments = [
      {
        id: 'comment-123',
        username: 'user-123',
        date: '2026-01-01T01:00:00.000Z',
        content: 'Comment Content 1',
      },
      {
        id: 'comment-456',
        username: 'user-456',
        date: '2026-01-01T02:00:00.000Z',
        content: 'Comment Content 2',
      },
      {
        id: 'comment-789',
        username: 'user-123',
        date: '2026-01-01T03:00:00.000Z',
        content: 'Comment Content 3',
      },
    ];

    const mockReplies = [
      {
        id: 'reply-123',
        content: 'Reply Content 1',
        username: 'user-456',
        date: '2026-01-01T02:00:00.000Z',
        commentId: 'comment-123',
      },
      {
        id: 'reply-456',
        content: 'Reply Content 2',
        username: 'user-123',
        date: '2026-01-01T03:00:00.000Z',
        commentId: 'comment-123',
      },
      {
        id: 'reply-789',
        content: 'Reply Content 1',
        username: 'user-123',
        date: '2026-01-01T04:00:00.000Z',
        commentId: 'comment-456',
      },
    ];

    const mockCommentLikeCounts = [
      {
        commentId: 'comment-123',
        count: 2,
      },
      {
        commentId: 'comment-456',
        count: 1,
      },
    ];

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();
    const mockCommentLikeRepository = new CommentLikeRepository();

    mockThreadRepository.getThreadById = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockThread));

    mockCommentRepository.getCommentsByThreadId = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockComments));

    mockReplyRepository.getRepliesByThreadId = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockReplies));

    mockCommentLikeRepository.getLikeCountsByCommentIds = vi
      .fn()
      .mockImplementation(() => Promise.resolve(mockCommentLikeCounts));

    const getThreadDetailUseCase = new GetThreadDetailUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
      commentLikeRepository: mockCommentLikeRepository,
    });

    const threadDetail = await getThreadDetailUseCase.execute(useCasePayload);

    expect(threadDetail).toStrictEqual({
      id: 'thread-123',
      title: 'Thread Title',
      body: 'Thread Body',
      date: '2026-01-01T00:00:00.000Z',
      username: 'user-123',
      comments: [
        {
          id: 'comment-123',
          username: 'user-123',
          date: '2026-01-01T01:00:00.000Z',
          content: 'Comment Content 1',
          likeCount: 2,
          replies: [
            {
              id: 'reply-123',
              content: 'Reply Content 1',
              username: 'user-456',
              date: '2026-01-01T02:00:00.000Z',
            },
            {
              id: 'reply-456',
              content: 'Reply Content 2',
              username: 'user-123',
              date: '2026-01-01T03:00:00.000Z',
            },
          ],
        },
        {
          id: 'comment-456',
          username: 'user-456',
          date: '2026-01-01T02:00:00.000Z',
          content: 'Comment Content 2',
          likeCount: 1,
          replies: [
            {
              id: 'reply-789',
              content: 'Reply Content 1',
              username: 'user-123',
              date: '2026-01-01T04:00:00.000Z',
            },
          ],
        },
        {
          id: 'comment-789',
          username: 'user-123',
          date: '2026-01-01T03:00:00.000Z',
          content: 'Comment Content 3',
          likeCount: 0,
          replies: [],
        },
      ],
    });

    expect(mockThreadRepository.getThreadById).toBeCalledWith(useCasePayload.threadId);

    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(useCasePayload.threadId);

    expect(mockReplyRepository.getRepliesByThreadId).toBeCalledWith(useCasePayload.threadId);

    expect(mockCommentLikeRepository.getLikeCountsByCommentIds).toBeCalledWith(
      mockComments.map((comment) => comment.id),
    );
  });
});
