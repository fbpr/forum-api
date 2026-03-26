class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository, commentLikeRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._commentLikeRepository = commentLikeRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    const commentIds = comments.map((comment) => comment.id);

    const likeCounts = await this._commentLikeRepository.getLikeCountsByCommentIds(commentIds);

    const likeCountByCommentId = likeCounts.reduce((acc, likeCount) => {
      acc[likeCount.commentId] = likeCount.count;
      return acc;
    }, {});

    const repliesByCommentId = replies.reduce((acc, reply) => {
      if (!acc[reply.commentId]) {
        acc[reply.commentId] = [];
      }

      acc[reply.commentId].push({
        id: reply.id,
        content: reply.content,
        date: reply.date,
        username: reply.username,
      });
      return acc;
    }, {});

    return {
      ...thread,
      comments: comments.map((comment) => ({
        ...comment,
        replies: repliesByCommentId[comment.id] || [],
        likeCount: likeCountByCommentId[comment.id] || 0,
      })),
    };
  }
}

export default GetThreadDetailUseCase;
