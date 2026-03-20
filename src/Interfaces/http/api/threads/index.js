import ThreadsHandler from './handler.js';
import createThreadsRouter from './routes.js';

export default (container) => {
  const threadsHandler = new ThreadsHandler(container);

  const authMiddleware = container.getInstance('AuthenticationMiddleware');

  return createThreadsRouter(threadsHandler, authMiddleware);
};
