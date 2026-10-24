import './App.css';
import '@/features/tools/registerUtilityToolPort';
import { SearchProvider } from '@/features/library/SearchContext';
import { ThemeSync } from '@/features/theme/ThemeSync';
import { useAppOrchestration } from '@/hooks/useAppOrchestration';
import { MainLayout } from '@/layouts/MainLayout';
import { AppRoutes } from '@/router/routes';

function App() {
  const { mainLayoutProps, routesProps } = useAppOrchestration();

  return (
    <SearchProvider>
      <ThemeSync />
      <MainLayout {...mainLayoutProps}>
        <AppRoutes {...routesProps} />
      </MainLayout>
    </SearchProvider>
  );
}

export default App;
