import express from 'express';

const createRepliesRouter = (handler, authMiddleware) => {
  const router = express.Router({ mergeParams: true });

  router.post('/', authMiddleware.authenticateToken, handler.postReplyHandler);
  router.delete('/:replyId', authMiddleware.authenticateToken, handler.deleteReplyHandler);

  return router;
};

export default createRepliesRouter;
