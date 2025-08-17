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
      // Check if the target is a Monaco editor
      const target = e.target as HTMLElement;
      const isMonacoEditor = target?.closest('.monaco-editor') !== null;
      
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "i":
            // Only handle if not in Monaco editor (Monaco will handle its own shortcuts)
            if (!isMonacoEditor) {
              e.preventDefault();
              console.log('🎯 Ctrl+I triggered from window (not Monaco)');
              onTabChange(4); // AI tab
            }
            break;
          case "c":
            // Only handle if not in Monaco editor and no text is selected
            if (!isMonacoEditor && window.getSelection()?.toString() === '') {
              e.preventDefault();
              console.log('🎯 Ctrl+C triggered from window (no selection)');
              onTabChange(2); // Chat tab
            }
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