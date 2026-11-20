import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * Application-level state that must outlive individual screens.
 *
 * Screens such as Evaluation and the multi-step application mount and unmount
 * as the banker navigates. Their working state is saved here, keyed by
 * application ID, so moving Back, switching tabs, or leaving through the
 * navigation menu never resets entered data.
 */

type Store = Record<string, unknown>;

interface ConsoleStoreValue {
  openMenu: () => void;
  read: <T>(key: string) => T | undefined;
  write: <T>(key: string, value: T) => void;
}

const ConsoleStoreContext = createContext<ConsoleStoreValue | null>(null);

export function ConsoleStoreProvider({
  children,
  onOpenMenu,
}: {
  children: ReactNode;
  onOpenMenu: () => void;
}) {
  // Kept in a ref-like object: writes must not re-render the whole tree on
  // every keystroke. Screens own their live state and persist it here.
  const [store] = useState<Store>(() => ({}));

  const read = useCallback(<T,>(key: string) => store[key] as T | undefined, [store]);
  const write = useCallback(<T,>(key: string, value: T) => {
    store[key] = value;
  }, [store]);

  const value = useMemo(() => ({ openMenu: onOpenMenu, read, write }), [onOpenMenu, read, write]);

  return <ConsoleStoreContext.Provider value={value}>{children}</ConsoleStoreContext.Provider>;
}

export function useConsoleStore(): ConsoleStoreValue {
  const ctx = useContext(ConsoleStoreContext);
  if (!ctx) {
    // Allows components to render in isolation (no provider): state simply
    // is not persisted beyond the component's lifetime.
    return {
      openMenu: () => {},
      read: () => undefined,
      write: () => {},
    };
  }
  return ctx;
}

/** useState that is seeded from, and saved back to, the console store. */
export function usePersistentState<T>(key: string, initial: () => T) {
  const { read, write } = useConsoleStore();
  const [value, setValue] = useState<T>(() => {
    const saved = read<T>(key);
    return saved !== undefined ? saved : initial();
  });
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        write(key, resolved);
        return resolved;
      });
    },
    [key, write],
  );
  // Make sure the initial value is stored even before the first update.
  if (read<T>(key) === undefined) write(key, value);
  return [value, set] as const;
}
