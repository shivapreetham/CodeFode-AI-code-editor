import { createContext, useState, ReactNode } from "react";

// Define your file interface (adjust properties as needed)
export interface IFile {
  name: string;
  content: string;
  language: string;
  path: string;
}

// Define the context properties for the active file
interface ActiveFileContextProps {
  activeFileGlobal: IFile | null;
  setActiveFileGlobal: (file: IFile | null) => void;
}

// Create the context with a default value.
export const ActiveFileContext = createContext<ActiveFileContextProps>({
  activeFileGlobal: null,
  setActiveFileGlobal: () => {},
});

// Create a provider component for the active file context.
export const ActiveFileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeFileGlobal, setActiveFileGlobal] = useState<IFile | null>(null);

  return (
    <ActiveFileContext.Provider value={{ activeFileGlobal, setActiveFileGlobal }}>
      {children}
    </ActiveFileContext.Provider>
  );
};
