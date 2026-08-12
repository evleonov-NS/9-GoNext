import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

type AddSheetContextValue = {
  open: () => void;
  close: () => void;
  visible: boolean;
};

const AddSheetContext = createContext<AddSheetContextValue | null>(null);

export function AddSheetProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const value = useMemo(
    () => ({
      visible,
      open: () => setVisible(true),
      close: () => setVisible(false),
    }),
    [visible],
  );

  return (
    <AddSheetContext.Provider value={value}>{children}</AddSheetContext.Provider>
  );
}

export function useAddSheet() {
  const ctx = useContext(AddSheetContext);
  if (!ctx) {
    throw new Error('useAddSheet must be used within AddSheetProvider');
  }
  return ctx;
}
