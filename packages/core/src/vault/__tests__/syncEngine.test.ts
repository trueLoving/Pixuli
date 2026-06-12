import { describe, expect, it, vi } from 'vitest';
import { createSyncEngine } from '../syncEngine';

describe('createSyncEngine', () => {
  it('tracks enqueuePush in status', async () => {
    const onEnqueue = vi.fn();
    const engine = createSyncEngine({ onEnqueue });

    await engine.enqueuePush({ type: 'upload', relativePath: 'images/a.jpg' });
    expect(onEnqueue).toHaveBeenCalledOnce();

    const status = await engine.getStatus();
    expect(status.pendingPush).toBe(1);
    expect(status.conflicts).toBe(0);
  });

  it('run clears push queue and updates lastSyncAt', async () => {
    const engine = createSyncEngine();
    await engine.enqueuePush({ type: 'upload', relativePath: 'images/a.jpg' });
    await engine.enqueuePush({
      type: 'metadata',
      relativePath: 'images/b.jpg',
    });

    const result = await engine.run({ direction: 'push' });
    expect(result.pushed).toBe(2);
    expect(result.pulled).toBe(0);

    const status = await engine.getStatus();
    expect(status.pendingPush).toBe(0);
    expect(status.lastSyncAt).toBeTruthy();
  });
});
