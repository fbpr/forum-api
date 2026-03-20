class DeleteCommentUseCase {
  constructor({ commentRepository, threadRepository }) {
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { threadId, commentId, userId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExistsOnThread(commentId, threadId);
    await this._commentRepository.verifyCommentOwner(commentId, userId);
    await this._commentRepository.deleteComment(commentId);
  }

}

export default DeleteCommentUseCase;
