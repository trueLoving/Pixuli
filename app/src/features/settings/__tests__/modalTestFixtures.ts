import { vi } from 'vitest';

/** 配置 Modal 测试共用文案 */
export const commonConfigModalMessages: Record<string, string> = {
  'storage.configuration': '配置',
  'common.cancel': '取消',
  'messages.configSaved': '配置已成功保存！',
  'messages.configCleared': '配置已成功清除！',
  'messages.configExported': '配置已成功导出！',
  'messages.configImported': '配置已成功导入！',
  'messages.saveFailed': '保存配置失败',
  'messages.clearFailed': '清除配置失败',
  'messages.exportFailed': '导出配置失败',
  'messages.importFailed': '导入配置失败',
  'messages.invalidFormat': '配置文件格式不正确',
  'messages.noConfigToExport': '没有可导出的配置',
};

export const githubConfigModalTranslations: Record<string, string> = {
  ...commonConfigModalMessages,
  'github.config.title': 'GitHub 仓库配置',
  'github.config.username': 'GitHub 用户名',
  'github.config.repository': '仓库名称',
  'github.config.branch': '分支名称',
  'github.config.path': '图片存储路径',
  'github.config.token': 'GitHub Token',
  'github.config.import': '↑ 导入',
  'github.config.export': '导出',
  'github.config.clearConfig': '清除配置',
  'github.config.saveConfig': '保存配置',
  'github.config.usernamePlaceholder': '您的 GitHub 用户名或组织名',
  'github.config.repositoryPlaceholder': '用于存储图片的仓库名称',
  'github.config.branchPlaceholder': '通常为 main 或 master',
  'github.config.pathPlaceholder': '仓库中存储图片的文件夹路径',
  'github.config.tokenPlaceholder': 'ghp_xxxxxxxxxxxxxxxxxxxx',
  'github.config.tokenDescription': '需要 repo 权限的 Personal Access Token',
  'github.help.title': '配置帮助',
  'messages.configSaved': 'GitHub 配置已成功保存！',
  'messages.configCleared': 'GitHub 配置已成功清除！',
  'messages.configExported': 'GitHub 配置已成功导出！',
  'messages.configImported': 'GitHub 配置已成功导入！',
};

export const giteeConfigModalTranslations: Record<string, string> = {
  ...commonConfigModalMessages,
  'gitee.config.title': 'Gitee 配置',
  'gitee.config.username': '用户名/组织名',
  'gitee.config.repository': '仓库名',
  'gitee.config.branch': '分支',
  'gitee.config.path': '路径',
  'gitee.config.token': '个人访问令牌',
  'gitee.config.import': '导入',
  'gitee.config.export': '导出',
  'gitee.config.clearConfig': '清除配置',
  'gitee.config.saveConfig': '保存配置',
  'gitee.config.close': '关闭',
  'gitee.config.required': '*',
  'gitee.config.usernamePlaceholder': '请输入 Gitee 用户名或组织名',
  'gitee.config.repositoryPlaceholder': '请输入仓库名',
  'gitee.config.branchPlaceholder': 'master',
  'gitee.config.pathPlaceholder': 'images',
  'gitee.config.tokenPlaceholder': '请输入 Gitee 个人访问令牌',
  'gitee.config.tokenDescription': 'Token 用于访问 Gitee API，请妥善保管。',
  'gitee.help.title': '帮助信息',
  'messages.configSaved': 'Gitee 配置已成功保存！',
  'messages.configCleared': 'Gitee 配置已成功清除！',
  'messages.configExported': 'Gitee 配置已成功导出！',
  'messages.configImported': 'Gitee 配置已成功导入！',
  'messages.unknownError': '未知错误',
  'messages.fileFormatError': '文件格式错误',
};

export function makeModalTranslate(translations: Record<string, string>) {
  return (key: string) => translations[key] || key;
}

export function createConfigModalDefaultProps() {
  return {
    isOpen: true,
    onClose: vi.fn(),
    onSaveConfig: vi.fn(),
    onClearConfig: vi.fn(),
  };
}

export function resetModalBodyOverflow() {
  document.body.style.overflow = '';
}
