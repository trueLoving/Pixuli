declare const __VERSION_INFO__: {
  version: string;
  name: string;
  description: string;
  buildTime: string;
  buildTimestamp: number;
  frameworks: Record<string, string>;
  dependencies: Record<string, string>;
  environment: {
    node: string;
    platform: string;
    arch: string;
  };
  git: {
    commit: string;
    branch: string;
  };
};

declare const __IS_WEB__: boolean;
declare const __IS_DESKTOP__: boolean;
