test('session has threadId', async () => {
    const session = await createSession(userId);
    expect(session.threadId).toBeTruthy();
    expect(typeof session.threadId).toBe('string');
  });
  
  test('config preserves threadId', () => {
    const config = createRunnableConfig('test-123', userId);
    expect(config.configurable.thread_id).toBe('test-123');
  });