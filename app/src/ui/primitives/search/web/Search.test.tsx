import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Search from './Search';

vi.mock('@/ui/locales', () => ({
  defaultTranslate: (key: string) => {
    const map: Record<string, string> = {
      'search.placeholder': '搜索...',
      'search.header.placeholder': '搜索或输入查询语法…',
      'search.header.placeholderDisabled': '添加仓库源后即可搜索',
      'search.header.expandSearch': '展开搜索',
      'search.header.collapseSearch': '收起搜索',
      'search.help.title': '查询语法帮助',
      'search.help.intro': '介绍',
      'search.help.exBare': '封面',
      'search.help.descBare': '文件名包含',
      'search.help.exName': 'name:logo',
      'search.help.descName': '仅文件名',
      'search.help.exKind': 'kind:pdf',
      'search.help.descKind': '类型',
      'search.help.exSize': 'size:>1mb',
      'search.help.descSize': '大小',
      'search.help.exCombo': 'kind:image size:<500kb',
      'search.help.descCombo': '组合',
      'search.image.placeholder': '搜索图片',
      'search.image.filterByTags': '按标签筛选',
      'search.image.clearFilters': '清除筛选',
    };
    return map[key] || key;
  },
}));

describe('Search', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    variant: 'basic' as const,
    hasConfig: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic search', () => {
    const { container } = render(<Search {...defaultProps} />);
    expect(container.querySelector('.search-bar')).toBeInTheDocument();
  });

  it('renders header search with help button', () => {
    const { container } = render(
      <Search {...defaultProps} variant="header" hasConfig={true} />,
    );
    expect(
      container.querySelector('.search-wrapper--header'),
    ).toBeInTheDocument();
    expect(container.querySelector('.search-help-button')).toBeInTheDocument();
    expect(
      container.querySelector('.search-filter-button'),
    ).not.toBeInTheDocument();
  });

  it('opens help panel on help click', () => {
    const { container } = render(
      <Search {...defaultProps} variant="header" hasConfig={true} />,
    );
    fireEvent.click(container.querySelector('.search-help-button')!);
    expect(screen.getByText('查询语法帮助')).toBeInTheDocument();
    expect(screen.getByText('kind:pdf')).toBeInTheDocument();
  });

  it('updates draft while typing without requiring commit props', () => {
    const onDraftChange = vi.fn();
    const onSearchChange = vi.fn();
    const { container } = render(
      <Search
        {...defaultProps}
        variant="header"
        draftQuery=""
        onDraftChange={onDraftChange}
        onSearchChange={onSearchChange}
        onCommitSearch={vi.fn()}
      />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'kind:pdf' } });
    expect(onDraftChange).toHaveBeenCalledWith('kind:pdf');
    expect(onSearchChange).not.toHaveBeenCalled();
  });

  it('commits query on Enter', () => {
    const onCommitSearch = vi.fn();
    const { container } = render(
      <Search
        {...defaultProps}
        variant="header"
        draftQuery="kind:pdf"
        onDraftChange={vi.fn()}
        onCommitSearch={onCommitSearch}
      />,
    );
    const input = container.querySelector('input') as HTMLInputElement;
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommitSearch).toHaveBeenCalledWith('kind:pdf');
  });
});
