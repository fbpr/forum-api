class AuthenticationMiddleware {
  constructor(authenticationTokenManager) {
    this._authenticationTokenManager = authenticationTokenManager;

    this.authenticateToken = this.authenticateToken.bind(this);
  }

  async authenticateToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || authHeader.indexOf('Bearer ') !== 0) {
        return res.status(401).json({
          status: 'fail',
          message: 'Missing authentication',
        });
      }

      const token = authHeader.split('Bearer ')[1];
      await this._authenticationTokenManager.verifyAccessToken(token);

      const { username, id } = await this._authenticationTokenManager.decodePayload(token);

      req.auth = { username, id };
      return next();
    } catch (error) {
      return res.status(401).json({
        status: 'fail',
        message: error.message,
      });
    }
  }
}

export default AuthenticationMiddleware;
