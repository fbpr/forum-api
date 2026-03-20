import AddReply from '../../Domains/replies/entities/AddReply.js';

class AddReplyUseCase {
  constructor({ replyRepository, commentRepository, threadRepository }) {
    this._replyRepository = replyRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { content, userId, threadId, commentId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExistsOnThread(commentId, threadId);

    const newReply = new AddReply({
      content,
      commentId,
      threadId,
      owner: userId,
      createdAt: new Date().toISOString(),
    });

    return this._replyRepository.addReply(newReply);
  }
}

export default AddReplyUseCase;