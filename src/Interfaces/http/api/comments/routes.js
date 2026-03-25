import express from 'express';

const createCommentsRouter = (handler, authMiddleware) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authMiddleware.authenticateToken, handler.postCommentHandler);
  router.delete('/:commentId', authMiddleware.authenticateToken, handler.deleteCommentHandler);
  router.put('/:commentId/likes', authMiddleware.authenticateToken, handler.putCommentLikeHandler);

  return router;
};

export default createCommentsRouter;
