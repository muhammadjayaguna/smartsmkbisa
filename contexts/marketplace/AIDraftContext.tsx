"use client";

import { createContext, useContext, useState, ReactNode } from 'react';

interface AIDraft {
  description?: string;
  imageUrl?: string;
}

interface AIDraftContextType {
  draft: AIDraft;
  setDescription: (text: string) => void;
  setImageUrl: (url: string) => void;
  clearDraft: () => void;
  hasDraft: boolean;
}

const AIDraftContext = createContext<AIDraftContextType | null>(null);

export const useAIDraft = () => {
  const ctx = useContext(AIDraftContext);
  if (!ctx) throw new Error('useAIDraft must be inside AIDraftProvider');
  return ctx;
};

export const AIDraftProvider = ({ children }: { children: ReactNode }) => {
  const [draft, setDraft] = useState<AIDraft>({});

  return (
    <AIDraftContext.Provider value={{
      draft,
      setDescription: (text) => setDraft(prev => ({ ...prev, description: text })),
      setImageUrl: (url) => setDraft(prev => ({ ...prev, imageUrl: url })),
      clearDraft: () => setDraft({}),
      hasDraft: !!(draft.description || draft.imageUrl),
    }}>
      {children}
    </AIDraftContext.Provider>
  );
};
