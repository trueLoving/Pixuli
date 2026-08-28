import { LibraryWorkbench } from '@/features/library/LibraryWorkbench';
import { useLibraryRoute } from '@/features/library/useLibraryRoute';
import React from 'react';

interface LibraryPageProps {
  onOpenConfigModal: () => void;
}

export const LibraryPage: React.FC<LibraryPageProps> = ({
  onOpenConfigModal,
}) => {
  const {
    t,
    hasConfig,
    error,
    clearError,
    visibleImages,
    loading,
    handleDeleteImage,
    handleDeleteMultipleImages,
    handleUpdateImage,
    search,
  } = useLibraryRoute();

  return (
    <div className="library-page h-full min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 overflow-hidden">
        <LibraryWorkbench
          hasConfig={hasConfig}
          error={error}
          onClearError={clearError}
          images={visibleImages}
          loading={loading}
          onDeleteImage={handleDeleteImage}
          onDeleteMultipleImages={handleDeleteMultipleImages}
          onUpdateImage={handleUpdateImage}
          onOpenConfigModal={onOpenConfigModal}
          search={search}
          t={t}
        />
      </div>
    </div>
  );
};

export default LibraryPage;
