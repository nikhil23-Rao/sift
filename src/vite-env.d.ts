/// <reference types="vite/client" />

interface Window {
  api: {
    hideWindow: () => void;
    resizeWindow: (width: number, height: number) => void;
    onMainProcessMessage: (callback: (message: string) => void) => void;
  };
}
