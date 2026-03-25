class ToggleCommentLikeUseCase {
  constructor({ commentLikeRepository, commentRepository, threadRepository }) {
    this._commentLikeRepository = commentLikeRepository;
    this._commentRepository = commentRepository;
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { commentId, threadId, userId } = useCasePayload;

    await this._threadRepository.verifyThreadExists(threadId);
    await this._commentRepository.verifyCommentExistsOnThread(commentId, threadId);

    const isLiked = await this._commentLikeRepository.verifyLike(commentId, userId);

    if (!isLiked) {
      await this._commentLikeRepository.addLike(commentId, userId);
    } else {
      await this._commentLikeRepository.deleteLike(commentId, userId);
    }
  }
}

export default ToggleCommentLikeUseCase;
