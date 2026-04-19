import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Branch {
  id: string;
  name: string;
  location: string;
}

interface BranchState {
  currentBranch: Branch | null;
  setCurrentBranch: (branch: Branch | null) => void;
}

export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      currentBranch: null,
      setCurrentBranch: (branch) => set({ currentBranch: branch }),
    }),
    {
      name: 'kt-pos-branch-storage',
    }
  )
);
