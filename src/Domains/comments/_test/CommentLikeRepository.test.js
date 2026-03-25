import CommentLikeRepository from '../CommentLikeRepository';

describe('CommentLikeRepository interface', () => {
  it('should throw error when invoke abstract behavior', async () => {
    const commentLikeRepository = new CommentLikeRepository();

    await expect(commentLikeRepository.addLike('', '')).rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.deleteLike('', '')).rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.getLikeCountsByCommentIds([])).rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(commentLikeRepository.verifyLike('', '')).rejects.toThrowError('COMMENT_LIKE_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});
