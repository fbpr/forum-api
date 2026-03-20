import RepliesHandler from './handler.js';
import createRepliesRouter from './routes.js';

export default (container) => {
  const repliesHandler = new RepliesHandler(container);

  const authMiddleware = container.getInstance('AuthenticationMiddleware');

  return createRepliesRouter(repliesHandler, authMiddleware);
};
