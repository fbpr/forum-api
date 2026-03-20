class AddReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const { content, owner, threadId, commentId, createdAt } = payload;

    this.content = content;
    this.owner = owner;
    this.threadId = threadId;
    this.commentId = commentId;
    this.createdAt = createdAt;
  }

  _verifyPayload({ content, owner, threadId, commentId }) {
    if (!content || !owner || !threadId || !commentId) {

      throw new Error('ADD_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof content !== 'string' || typeof owner !== 'string' || typeof threadId !== 'string' || typeof commentId !== 'string') {
      throw new Error('ADD_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default AddReply;
