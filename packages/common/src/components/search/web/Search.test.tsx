import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Search from './Search';
import type { ImageItem } from '../../../types/image';
import type { FilterOptions } from '../../image-browser/web/image-filter/ImageFilter';

// Mock 依赖
vi.mock('../../../locales', () => ({
  defaultTranslate: (key: string) => {
    const translations: Record<string, string> = {
      'search.header.placeholder': '搜索图片...',
      'search.header.placeholderDisabled': '请先配置存储',
      'search.image.placeholder': '搜索...',
      'search.placeholder': 'Search...',
      'search.header.filter': '筛选',
      'search.header.clearFilters': '清除',
      'search.image.filterByTags': '按标签筛选',
      'search.image.clearFilters': '清除筛选',
      'image.filter.imageType': '图片类型',
      'image.filter.tags': '标签',
    };
    return translations[key] || key;
  },
}));

describe('Search', () => {
  const mockImages: ImageItem[] = [
    {
      id: '1',
      name: 'image1.jpg',
      url: 'https://example.com/image1.jpg',
      githubUrl: 'https://github.com/image1.jpg',
      size: 102400,
      width: 1920,
      height: 1080,
      type: 'image/jpeg',
      tags: ['tag1', 'tag2'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    },
    {
      id: '2',
      name: 'image2.png',
      url: 'https://example.com/image2.png',
      githubUrl: 'https://github.com/image2.png',
      size: 204800,
      width: 1920,
      height: 1080,
      type: 'image/png',
      tags: ['tag2', 'tag3'],
      createdAt: '2024-01-02',
      updatedAt: '2024-01-02',
    },
  ];

  const mockFilters: FilterOptions = {
    searchTerm: '',
    selectedTypes: [],
    selectedTags: [],
  };

  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    variant: 'basic' as const,
    hasConfig: true,
    images: mockImages,
    externalFilters: mockFilters,
    onFiltersChange: vi.fn(),
    showFilter: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic variant', () => {
    it('应该渲染基础搜索框', () => {
      const { container } = render(
        <Search {...defaultProps} variant="basic" />,
      );
      const searchBar = container.querySelector('.search-bar');
      expect(searchBar).toBeInTheDocument();
    });

    it('应该在禁用时禁用搜索框', () => {
      const { container } = render(
        <Search {...defaultProps} variant="basic" disabled={true} />,
      );
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('应该在 hasConfig 为 false 时禁用搜索框', () => {
      const { container } = render(
        <Search {...defaultProps} variant="basic" hasConfig={false} />,
      );
      const input = container.querySelector('input');
      expect(input).toBeDisabled();
    });

    it('应该使用自定义占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="basic" placeholder="自定义占位符" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('自定义占位符');
    });
  });

  describe('header variant', () => {
    it('应该渲染 header 变体', () => {
      const { container } = render(
        <Search {...defaultProps} variant="header" />,
      );
      const wrapper = container.querySelector('.search-wrapper--header');
      expect(wrapper).toBeInTheDocument();
    });

    it('应该显示搜索框', () => {
      const { container } = render(
        <Search {...defaultProps} variant="header" />,
      );
      const searchBar = container.querySelector('.search-bar');
      expect(searchBar).toBeInTheDocument();
    });

    it('应该在 showFilter 为 true 时显示筛选按钮', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
        />,
      );
      const filterButton = container.querySelector('.search-filter-button');
      expect(filterButton).toBeInTheDocument();
    });

    it('应该点击筛选按钮时显示筛选面板', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      const filterPanel = container.querySelector('.search-filter-panel');
      expect(filterPanel).toBeInTheDocument();
    });

    it('应该显示可用的图片类型', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      expect(screen.getByText('image/jpeg')).toBeInTheDocument();
      expect(screen.getByText('image/png')).toBeInTheDocument();
    });

    it('应该显示可用的标签', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });

    it('应该可以选择图片类型', () => {
      const onFiltersChange = vi.fn();
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
          onFiltersChange={onFiltersChange}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      const jpegCheckbox = screen.getByLabelText(
        'image/jpeg',
      ) as HTMLInputElement;
      fireEvent.click(jpegCheckbox);

      expect(onFiltersChange).toHaveBeenCalled();
    });

    it('应该可以选择标签', () => {
      const onFiltersChange = vi.fn();
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
          onFiltersChange={onFiltersChange}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      const tag1Checkbox = screen.getByLabelText('tag1') as HTMLInputElement;
      fireEvent.click(tag1Checkbox);

      expect(onFiltersChange).toHaveBeenCalled();
    });

    it('应该在有活动筛选条件时显示清除按钮', () => {
      const filtersWithSelection: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg'],
        selectedTags: [],
      };
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
          externalFilters={filtersWithSelection}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      const clearButton = screen.getByText('清除');
      expect(clearButton).toBeInTheDocument();
    });

    it('应该点击清除按钮时清除所有筛选条件', () => {
      const onFiltersChange = vi.fn();
      const filtersWithSelection: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg'],
        selectedTags: ['tag1'],
      };
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
          externalFilters={filtersWithSelection}
          onFiltersChange={onFiltersChange}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      const clearButton = screen.getByText('清除');
      fireEvent.click(clearButton);

      expect(onFiltersChange).toHaveBeenCalledWith(
        expect.objectContaining({
          selectedTypes: [],
          selectedTags: [],
        }),
      );
    });

    it('应该在有活动筛选条件时高亮筛选按钮', () => {
      const filtersWithSelection: FilterOptions = {
        searchTerm: '',
        selectedTypes: ['image/jpeg'],
        selectedTags: [],
      };
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
          externalFilters={filtersWithSelection}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button.active',
      );
      expect(filterButton).toBeInTheDocument();
    });

    it('应该点击外部时关闭筛选面板', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          hasConfig={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      expect(
        container.querySelector('.search-filter-panel'),
      ).toBeInTheDocument();

      // 点击外部
      fireEvent.mouseDown(document.body);

      waitFor(() => {
        expect(
          container.querySelector('.search-filter-panel'),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('image variant', () => {
    it('应该渲染 image 变体', () => {
      const { container } = render(
        <Search {...defaultProps} variant="image" />,
      );
      const wrapper = container.querySelector('.search-wrapper--image');
      expect(wrapper).toBeInTheDocument();
    });

    it('应该显示搜索框', () => {
      const { container } = render(
        <Search {...defaultProps} variant="image" />,
      );
      const searchBar = container.querySelector('.search-bar');
      expect(searchBar).toBeInTheDocument();
    });

    it('应该在提供标签时显示标签容器', () => {
      const allTags = ['tag1', 'tag2', 'tag3'];
      const { container } = render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          onTagsChange={vi.fn()}
        />,
      );
      const tagsContainer = container.querySelector('.search-tags-container');
      expect(tagsContainer).toBeInTheDocument();
    });

    it('应该显示所有标签', () => {
      const allTags = ['tag1', 'tag2', 'tag3'];
      const { container } = render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          onTagsChange={vi.fn()}
        />,
      );
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
      expect(screen.getByText('tag3')).toBeInTheDocument();
    });

    it('应该可以切换标签选择', () => {
      const onTagsChange = vi.fn();
      const allTags = ['tag1', 'tag2'];
      render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          onTagsChange={onTagsChange}
        />,
      );

      const tag1Button = screen.getByText('tag1');
      fireEvent.click(tag1Button);

      expect(onTagsChange).toHaveBeenCalledWith(['tag1']);
    });

    it('应该可以取消选择标签', () => {
      const onTagsChange = vi.fn();
      const allTags = ['tag1', 'tag2'];
      render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          selectedTags={['tag1']}
          onTagsChange={onTagsChange}
        />,
      );

      const tag1Button = screen.getByText('tag1');
      fireEvent.click(tag1Button);

      expect(onTagsChange).toHaveBeenCalledWith([]);
    });

    it('应该高亮显示选中的标签', () => {
      const allTags = ['tag1', 'tag2'];
      const { container } = render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          selectedTags={['tag1']}
          onTagsChange={vi.fn()}
        />,
      );
      const tag1Button = container.querySelector('.search-tag-button.selected');
      expect(tag1Button).toBeInTheDocument();
      expect(tag1Button).toHaveTextContent('tag1');
    });

    it('应该在选中标签时显示清除按钮', () => {
      const onTagsChange = vi.fn();
      const allTags = ['tag1', 'tag2'];
      render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          selectedTags={['tag1', 'tag2']}
          onTagsChange={onTagsChange}
        />,
      );

      const clearButton = screen.getByText(/清除筛选.*2/);
      expect(clearButton).toBeInTheDocument();
    });

    it('应该点击清除按钮时清除所有标签', () => {
      const onTagsChange = vi.fn();
      const allTags = ['tag1', 'tag2'];
      render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={allTags}
          selectedTags={['tag1', 'tag2']}
          onTagsChange={onTagsChange}
        />,
      );

      const clearButton = screen.getByText(/清除筛选.*2/);
      fireEvent.click(clearButton);

      expect(onTagsChange).toHaveBeenCalledWith([]);
    });

    it('应该在没有提供 allTags 时使用从图片中提取的标签', () => {
      const { container } = render(
        <Search {...defaultProps} variant="image" onTagsChange={vi.fn()} />,
      );
      const tagsContainer = container.querySelector('.search-tags-container');
      expect(tagsContainer).toBeInTheDocument();
    });
  });

  describe('搜索功能', () => {
    it('应该调用 onSearchChange 当搜索词改变时', () => {
      const onSearchChange = vi.fn();
      const { container } = render(
        <Search {...defaultProps} onSearchChange={onSearchChange} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;

      fireEvent.change(input, { target: { value: 'test' } });

      expect(onSearchChange).toHaveBeenCalledWith('test');
    });

    it('应该显示当前的搜索词', () => {
      const { container } = render(
        <Search {...defaultProps} searchQuery="test query" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('test query');
    });
  });

  describe('占位符', () => {
    it('应该使用 header variant 的默认占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="header" hasConfig={true} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('搜索图片...');
    });

    it('应该在 hasConfig 为 false 时使用禁用占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="header" hasConfig={false} />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('请先配置存储');
    });

    it('应该使用 image variant 的默认占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="image" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('搜索...');
    });

    it('应该使用 basic variant 的默认占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="basic" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('Search...');
    });

    it('应该优先使用自定义占位符', () => {
      const { container } = render(
        <Search {...defaultProps} variant="header" placeholder="自定义" />,
      );
      const input = container.querySelector('input') as HTMLInputElement;
      expect(input.placeholder).toBe('自定义');
    });
  });

  describe('边界情况', () => {
    it('应该处理空图片列表', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          images={[]}
          variant="header"
          showFilter={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      // 不应该显示任何类型或标签
      expect(screen.queryByText('image/jpeg')).not.toBeInTheDocument();
    });

    it('应该处理没有标签的图片', () => {
      const imagesWithoutTags: ImageItem[] = [
        {
          ...mockImages[0],
          tags: [],
        },
      ];
      const { container } = render(
        <Search
          {...defaultProps}
          images={imagesWithoutTags}
          variant="header"
          showFilter={true}
        />,
      );
      const filterButton = container.querySelector(
        '.search-filter-button',
      ) as HTMLButtonElement;
      fireEvent.click(filterButton);

      // 不应该显示标签部分
      expect(screen.queryByText('标签')).not.toBeInTheDocument();
    });

    it('应该处理没有 onFiltersChange 的情况', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="header"
          showFilter={true}
          onFiltersChange={undefined}
        />,
      );
      // 当没有 onFiltersChange 时，筛选按钮不应该显示
      const filterButton = container.querySelector('.search-filter-button');
      expect(filterButton).not.toBeInTheDocument();
    });

    it('应该处理没有 onTagsChange 的情况', () => {
      const { container } = render(
        <Search
          {...defaultProps}
          variant="image"
          allTags={['tag1']}
          onTagsChange={undefined}
        />,
      );
      // 不应该显示标签容器
      const tagsContainer = container.querySelector('.search-tags-container');
      expect(tagsContainer).not.toBeInTheDocument();
    });
  });
});
