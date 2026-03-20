import AddComment from '../../Domains/comments/entities/AddComment.js';

class AddCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { content, threadId, userId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);

    const newComment = new AddComment({
      content,
      owner: userId,
      threadId,
      createdAt: new Date().toISOString(),
    });

    return this._commentRepository.addComment(newComment);
  }
}

export default AddCommentUseCase;