class DetailReply {
  constructor(payload) {
    this._verifyPayload(payload);

    const { id, content, date, username, isDeleted, commentId } = payload;

    this.id = id;
    this.content = isDeleted ? '**balasan telah dihapus**' : content;
    this.date = date;
    this.username = username;
    this.commentId = commentId;
  }

  _verifyPayload({ id, content, date, username, commentId }) {
    if (!id || !content || !date || !username || !commentId) {
      throw new Error('DETAIL_REPLY.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof id !== 'string' ||
      typeof content !== 'string' ||
      typeof date !== 'string' ||
      typeof username !== 'string' ||
      typeof commentId !== 'string'
    ) {
      throw new Error('DETAIL_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

export default DetailReply;
