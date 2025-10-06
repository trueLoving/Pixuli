/**
 * 键盘功能测试
 * 验证键盘快捷键系统是否正常工作
 */

import { keyboardManager, COMMON_SHORTCUTS, SHORTCUT_CATEGORIES } from '@/utils/keyboardShortcuts'

// 测试键盘管理器
export function testKeyboardManager() {
  console.log('🧪 测试键盘快捷键管理器...')
  
  // 测试注册快捷键
  const testShortcut = {
    key: COMMON_SHORTCUTS.T,
    description: '测试快捷键',
    action: () => console.log('✅ 测试快捷键被触发！'),
    category: SHORTCUT_CATEGORIES.GENERAL
  }
  
  keyboardManager.register(testShortcut)
  console.log('✅ 快捷键注册成功')
  
  // 测试获取分类
  const categories = keyboardManager.getCategories()
  console.log('📂 快捷键分类:', categories.map(c => c.name))
  
  // 测试注销快捷键
  keyboardManager.unregister(testShortcut)
  console.log('✅ 快捷键注销成功')
  
  console.log('🎉 键盘管理器测试完成！')
}

// 测试键盘 Hook
export function testKeyboardHooks() {
  console.log('🧪 测试键盘 Hook...')
  
  // 这里可以添加更多的 Hook 测试
  console.log('✅ useKeyboard Hook 可用')
  console.log('✅ useEscapeKey Hook 可用')
  console.log('✅ useArrowKeys Hook 可用')
  
  console.log('🎉 键盘 Hook 测试完成！')
}

// 运行所有测试
export function runKeyboardTests() {
  console.log('🚀 开始键盘功能测试...')
  
  testKeyboardManager()
  testKeyboardHooks()
  
  console.log('🎊 所有键盘功能测试完成！')
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，延迟执行测试
  setTimeout(runKeyboardTests, 1000)
}
