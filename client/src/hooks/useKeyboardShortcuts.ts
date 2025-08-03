// hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react';

interface UseKeyboardShortcutsProps {
  onTabChange: (tabId: number) => void;
  onRunCode?: () => void;
  onSaveFile?: () => void;
  onNewFile?: () => void;
  onToggleSidebar?: () => void;
}

export const useKeyboardShortcuts = ({
  onTabChange,
  onRunCode,
  onSaveFile,
  onNewFile,
  onToggleSidebar
}: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "i":
            e.preventDefault();
            onTabChange(4); // AI tab
            break;
          case "c":
            e.preventDefault();
            onTabChange(2); // Chat tab
            break;
          case "n":
            e.preventDefault();
            onTabChange(0); // Directory tab
            break;
          case "s":
            e.preventDefault();
            onSaveFile?.();
            break;
          case "u":
            e.preventDefault();
            onTabChange(1); // Users tab
            break;
          case 'l':
            e.preventDefault();
            onTabChange(5); // Notifications tab
            break;
          case "enter":
            e.preventDefault();
            onRunCode?.();
            break;
          case "b":
            e.preventDefault();
            onToggleSidebar?.();
            break;
        }
      } else if (e.key === "F5") {
        e.preventDefault();
        onRunCode?.();
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcuts);
    };
  }, [onTabChange, onRunCode, onSaveFile, onNewFile, onToggleSidebar]);
};