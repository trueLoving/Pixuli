interface PixuliDeepLinkAPI {
  onOpen: (callback: (url: string) => void) => () => void;
  getPending: () => Promise<string | null>;
}

interface Window {
  pixuliDeepLink?: PixuliDeepLinkAPI;
}
