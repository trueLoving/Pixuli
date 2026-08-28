import './App.css';
import '@/features/access/registerPublishPort';
import { SearchProvider } from '@/features/library/SearchContext';
import { useAppOrchestration } from '@/hooks/useAppOrchestration';
import { MainLayout } from '@/layouts/MainLayout';
import { AppRoutes } from '@/router/routes';

function App() {
  const { mainLayoutProps, routesProps } = useAppOrchestration();

  return (
    <SearchProvider>
      <MainLayout {...mainLayoutProps}>
        <AppRoutes {...routesProps} />
      </MainLayout>
    </SearchProvider>
  );
}

export default App;
