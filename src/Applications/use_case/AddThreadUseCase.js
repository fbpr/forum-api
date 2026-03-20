import AddThread from '../../Domains/threads/entities/AddThread.js';

class AddThreadUseCase {
  constructor({ threadRepository }) {
    this._threadRepository = threadRepository;
  }

  async execute(useCasePayload) {
    const { title, body, userId } = useCasePayload;

    const newThread = new AddThread({
      title,
      body,
      owner: userId,
      createdAt: new Date().toISOString(),
    });

    return this._threadRepository.addThread(newThread);
  }
}

export default AddThreadUseCase;
