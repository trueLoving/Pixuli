import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useI18n } from '@/i18n/useI18n';
import { FilterOption, SortOption, useImageStore } from '@/stores/imageStore';
import { useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '../ui/IconSymbol';
import { ThemedText } from '../ui/ThemedText';

type BrowseMode = 'file' | 'slide' | 'wall' | 'gallery3d';

interface SearchAndFilterProps {
  onFilterChange?: () => void;
  currentBrowseMode?: BrowseMode;
  onBrowseModeChange?: (mode: BrowseMode) => void;
}

export function SearchAndFilter({
  onFilterChange,
  currentBrowseMode = 'file',
  onBrowseModeChange,
}: SearchAndFilterProps) {
  const { t } = useI18n();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const {
    searchQuery,
    filterOptions,
    sortOption,
    setSearchQuery,
    setFilterOptions,
    setSortOption,
    clearFilters,
    getAllTags,
  } = useImageStore();

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [browseModeModalVisible, setBrowseModeModalVisible] = useState(false);
  const allTags = getAllTags();
  const [selectedTags, setSelectedTags] = useState<string[]>(
    filterOptions.tags || [],
  );

  const hasActiveFilters =
    (filterOptions.tags && filterOptions.tags.length > 0) ||
    filterOptions.dateFrom !== undefined ||
    filterOptions.dateTo !== undefined;

  const handleApplyFilters = () => {
    const newFilters: FilterOption = {
      tags: selectedTags.length > 0 ? selectedTags : undefined,
    };
    setFilterOptions(newFilters);
    setFilterModalVisible(false);
    onFilterChange?.();
  };

  const handleClearFilters = () => {
    setSelectedTags([]);
    clearFilters();
    setFilterModalVisible(false);
    onFilterChange?.();
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'date-desc', label: t('search.sort.dateDesc') },
    { value: 'date-asc', label: t('search.sort.dateAsc') },
    { value: 'name-asc', label: t('search.sort.nameAsc') },
    { value: 'name-desc', label: t('search.sort.nameDesc') },
    { value: 'size-desc', label: t('search.sort.sizeDesc') },
    { value: 'size-asc', label: t('search.sort.sizeAsc') },
  ];

  const browseModes: Array<{
    mode: BrowseMode;
    icon: string;
    label: string;
    disabled?: boolean;
  }> = [
    {
      mode: 'file',
      icon: 'doc.text.fill',
      label: t('browseMode.file') || '文件模式',
    },
    {
      mode: 'slide',
      icon: 'play.fill',
      label: t('browseMode.slide') || '幻灯片模式',
    },
    {
      mode: 'wall',
      icon: 'square.grid.2x2.fill',
      label: t('browseMode.wall') || '照片墙模式',
      disabled: true,
    },
    {
      mode: 'gallery3d',
      icon: 'cube.fill',
      label: t('browseMode.gallery3d') || '3D画廊模式',
      disabled: true,
    },
  ];

  const handleBrowseModeSelect = (mode: BrowseMode) => {
    if (
      onBrowseModeChange &&
      !browseModes.find(m => m.mode === mode)?.disabled
    ) {
      onBrowseModeChange(mode);
      setBrowseModeModalVisible(false);
    }
  };

  const dynamicStyles = StyleSheet.create({
    searchContainer: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    searchInput: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7',
      color: colors.text,
      borderColor: colors.cardBorder,
    },
    filterButton: {
      backgroundColor: hasActiveFilters
        ? colors.primary
        : colors.cardBackground,
      borderColor: colors.cardBorder,
    },
    filterButtonText: {
      color: hasActiveFilters ? '#fff' : colors.text,
    },
    modalContainer: {
      backgroundColor: colors.background,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
    },
    modalHeader: {
      borderBottomColor: colors.cardBorder,
    },
    input: {
      backgroundColor: colorScheme === 'dark' ? '#1C1C1E' : '#FFFFFF',
      color: colors.text,
      borderColor: colors.cardBorder,
    },
    tagButton: {
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
      borderColor: colors.cardBorder,
    },
    tagButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tagText: {
      color: colors.text,
    },
    tagTextSelected: {
      color: '#fff',
    },
    sortOption: {
      backgroundColor: colors.cardBackground,
      borderBottomColor: colors.cardBorder,
    },
    sortOptionSelected: {
      backgroundColor: colorScheme === 'dark' ? '#2C2C2E' : '#F2F2F7',
    },
  });

  return (
    <View
      style={[
        styles.container,
        dynamicStyles.searchContainer,
        { paddingTop: Math.max(insets.top + 8, 12) },
      ]}
    >
      {/* 搜索栏 */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputContainer}>
          <IconSymbol
            name="magnifyingglass"
            size={20}
            color={colors.sectionTitle}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, dynamicStyles.searchInput]}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.sectionTitle}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.searchClearButton}
            >
              <IconSymbol
                name="xmark.circle.fill"
                size={20}
                color={colors.sectionTitle}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 筛选按钮 */}
        <TouchableOpacity
          style={[styles.filterButton, dynamicStyles.filterButton]}
          onPress={() => setFilterModalVisible(true)}
        >
          <IconSymbol
            name="line.3.horizontal.decrease.circle"
            size={20}
            color={hasActiveFilters ? '#fff' : colors.text}
          />
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <ThemedText style={styles.filterBadgeText}>
                {filterOptions.tags?.length || 0}
              </ThemedText>
            </View>
          )}
        </TouchableOpacity>

        {/* 排序按钮 */}
        <TouchableOpacity
          style={[styles.sortButton, dynamicStyles.filterButton]}
          onPress={() => setSortModalVisible(true)}
        >
          <IconSymbol
            name="arrow.up.arrow.down"
            size={20}
            color={colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* 筛选模态框 */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalContainer]}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <ThemedText style={styles.modalTitle}>
                {t('search.filter.title')}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {/* 标签筛选 */}
              {allTags.length > 0 && (
                <View style={styles.filterSection}>
                  <ThemedText style={styles.filterSectionTitle}>
                    {t('search.filter.tags')}
                  </ThemedText>
                  <View style={styles.tagsContainer}>
                    {allTags.map(tag => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.tagButton,
                            dynamicStyles.tagButton,
                            isSelected && dynamicStyles.tagButtonSelected,
                          ]}
                          onPress={() => toggleTag(tag)}
                        >
                          <ThemedText
                            style={[
                              styles.tagText,
                              dynamicStyles.tagText,
                              isSelected && dynamicStyles.tagTextSelected,
                            ]}
                          >
                            {tag}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={handleClearFilters}
              >
                <ThemedText style={styles.clearButtonText}>
                  {t('search.filter.clear')}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.applyButton]}
                onPress={handleApplyFilters}
              >
                <ThemedText style={styles.applyButtonText}>
                  {t('search.filter.apply')}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 排序模态框 */}
      <Modal
        visible={sortModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSortModalVisible(false)}
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalContainer]}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <ThemedText style={styles.modalTitle}>
                {t('search.sort.title')}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setSortModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {sortOptions.map(option => {
                const isSelected = sortOption === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      dynamicStyles.sortOption,
                      isSelected && dynamicStyles.sortOptionSelected,
                    ]}
                    onPress={() => {
                      setSortOption(option.value);
                      setSortModalVisible(false);
                      onFilterChange?.();
                    }}
                  >
                    <ThemedText style={styles.sortOptionText}>
                      {option.label}
                    </ThemedText>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 浏览模式选择模态框 */}
      <Modal
        visible={browseModeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBrowseModeModalVisible(false)}
      >
        <View style={[styles.modalOverlay, dynamicStyles.modalContainer]}>
          <View style={[styles.modalContent, dynamicStyles.modalContent]}>
            <View style={[styles.modalHeader, dynamicStyles.modalHeader]}>
              <ThemedText style={styles.modalTitle}>
                {t('browseMode.title') || '浏览模式'}
              </ThemedText>
              <TouchableOpacity
                onPress={() => setBrowseModeModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
            >
              {browseModes.map((mode, index) => {
                const isSelected = currentBrowseMode === mode.mode;
                const isDisabled = mode.disabled;
                return (
                  <TouchableOpacity
                    key={mode.mode}
                    style={[
                      styles.sortOption,
                      dynamicStyles.sortOption,
                      isSelected && dynamicStyles.sortOptionSelected,
                      index === browseModes.length - 1 && {
                        borderBottomWidth: 0,
                      },
                    ]}
                    onPress={() => handleBrowseModeSelect(mode.mode)}
                    disabled={isDisabled}
                    activeOpacity={0.6}
                  >
                    <View style={styles.browseModeItemLeft}>
                      <IconSymbol
                        name={mode.icon as any}
                        size={22}
                        color={
                          isSelected ? colors.primary : colors.sectionTitle
                        }
                      />
                      <ThemedText
                        style={[
                          styles.sortOptionText,
                          isSelected && { color: colors.primary },
                          isDisabled && { opacity: 0.5 },
                        ]}
                      >
                        {mode.label}
                      </ThemedText>
                      {isDisabled && (
                        <ThemedText
                          style={[
                            styles.comingSoonText,
                            { color: colors.sectionTitle },
                          ]}
                        >
                          {t('common.comingSoon') || '即将推出'}
                        </ThemedText>
                      )}
                    </View>
                    {isSelected && (
                      <IconSymbol
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  searchClearButton: {
    padding: 4,
    marginLeft: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  browseModeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  comingSoonText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: '#F2F2F7',
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    backgroundColor: '#007AFF',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sortOptionText: {
    fontSize: 16,
  },
});
