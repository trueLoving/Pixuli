/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Demo 模式配置
  readonly VITE_DEMO_MODE: string;
  readonly VITE_DEMO_GITHUB_OWNER: string;
  readonly VITE_DEMO_GITHUB_REPO: string;
  readonly VITE_DEMO_GITHUB_BRANCH: string;
  readonly VITE_DEMO_GITHUB_TOKEN: string;
  readonly VITE_DEMO_GITHUB_PATH: string;
  readonly VITE_DEMO_GITEE_OWNER: string;
  readonly VITE_DEMO_GITEE_REPO: string;
  readonly VITE_DEMO_GITEE_BRANCH: string;
  readonly VITE_DEMO_GITEE_TOKEN: string;
  readonly VITE_DEMO_GITEE_PATH: string;

  // Gitee 代理配置
  readonly VITE_USE_GITEE_PROXY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
