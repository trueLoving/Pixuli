import { cleanup } from '@testing-library/react-native';
import { afterEach } from 'vitest';

// 每个测试后清理
afterEach(() => {
  cleanup();
});
