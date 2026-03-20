class GetThreadDetailUseCase {
  constructor({ threadRepository, commentRepository, replyRepository }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    const { threadId } = useCasePayload;

    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(threadId);
    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

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
      })),
    };
  }
}

export default GetThreadDetailUseCase;
