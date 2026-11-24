export type EmptyStateProviderAction = {
  pluginId: string;
  name: string;
  onAdd: () => void;
};

export interface EmptyStateProps {
  providers: EmptyStateProviderAction[];
  t?: (key: string) => string;
}
