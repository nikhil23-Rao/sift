/// <reference types="vite/client" />

interface Window {
  api: {
    hideWindow: () => void;
    onMainProcessMessage: (callback: (message: string) => void) => void;
  };
}
