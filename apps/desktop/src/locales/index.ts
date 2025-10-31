export const desktopLocales = {
  'zh-CN': {
    sourceManager: {
      title: '仓库源管理（GitHub）',
      add: '新增',
      open: '打开',
      openInNewWindow: '在新窗口打开',
      edit: '修改',
      delete: '删除',
      empty: '还没有配置任何仓库源，点击“新增仓库源”开始配置。',
      repoLine: '{{owner}}/{{repo}}@{{branch}}',
      subPath: '子路径',
      collapse: '收起',
      expand: '展开',
    },
  },
  'en-US': {
    sourceManager: {
      title: 'Repository Sources (GitHub)',
      add: 'Add',
      open: 'Open',
      openInNewWindow: 'Open in New Window',
      edit: 'Edit',
      delete: 'Delete',
      empty: 'No sources yet. Click "Add Source" to create one.',
      repoLine: '{{owner}}/{{repo}}@{{branch}}',
      subPath: 'Sub Path',
      collapse: 'Collapse',
      expand: 'Expand',
    },
  },
};

export type DesktopLocales = typeof desktopLocales;
