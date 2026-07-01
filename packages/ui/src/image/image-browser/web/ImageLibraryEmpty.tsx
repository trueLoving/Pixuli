import { Image as ImageIcon, SearchX } from 'lucide-react';
import React from 'react';

export type ImageLibraryEmptyVariant = 'library' | 'filtered';

export interface ImageLibraryEmptyProps {
  variant?: ImageLibraryEmptyVariant;
  t: (key: string) => string;
  className?: string;
}

const ImageLibraryEmpty: React.FC<ImageLibraryEmptyProps> = ({
  variant = 'library',
  t,
  className = '',
}) => {
  const isFiltered = variant === 'filtered';
  const Icon = isFiltered ? SearchX : ImageIcon;
  const titleKey = isFiltered
    ? 'image.empty.filteredTitle'
    : 'image.list.emptyTitle';
  const descriptionKey = isFiltered
    ? 'image.empty.filteredDescription'
    : 'image.list.emptyDescription';

  return (
    <div className={`image-browser-empty ${className}`.trim()}>
      <div className="image-browser-empty-icon" aria-hidden>
        <Icon className="h-16 w-16 opacity-50" />
      </div>
      <h3 className="image-browser-empty-title">{t(titleKey)}</h3>
      <p className="image-browser-empty-description">{t(descriptionKey)}</p>
    </div>
  );
};

export default ImageLibraryEmpty;
