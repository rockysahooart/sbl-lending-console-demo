import { useCallback } from 'react';
import { ConsoleStoreProvider } from './state/ConsoleStore';
import { DemoProvider } from '../demo/DemoContext';
import { DemoShell, beforeMenu } from '../demo/Shell';

/**
 * Portfolio demo entry. The original console (src/app/components) is hosted
 * unchanged as the BEFORE experience; src/demo/after is the redesign.
 * All data is fictional.
 */
export default function App() {
  const openMenu = useCallback(() => beforeMenu.open(), []);
  return (
    <DemoProvider>
      <ConsoleStoreProvider onOpenMenu={openMenu}>
        <DemoShell />
      </ConsoleStoreProvider>
    </DemoProvider>
  );
}
