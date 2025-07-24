// hooks/useKeyboardShortcuts.ts
import { useEffect } from "react";

interface UseKeyboardShortcutsProps {
  onTabChange: (tabId: number) => void;
}

export const useKeyboardShortcuts = ({ onTabChange }: UseKeyboardShortcutsProps) => {
  useEffect(() => {
    const handleKeyboardShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
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
            onTabChange(3); // Settings tab
            break;
          case "u":
            e.preventDefault();
            onTabChange(1); // Users tab
            break;
          case "l":
            e.preventDefault();
            onTabChange(5); // Notifications tab
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyboardShortcuts);
    return () => window.removeEventListener("keydown", handleKeyboardShortcuts);
  }, [onTabChange]);
};