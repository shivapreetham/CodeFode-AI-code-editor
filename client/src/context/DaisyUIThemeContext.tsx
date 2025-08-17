import { createContext, useState, ReactNode, useEffect } from "react";

interface DaisyUIThemeContextProps {
  daisyTheme: string;
  setDaisyTheme: (theme: string) => void;
}

export const DaisyUIThemeContext = createContext<DaisyUIThemeContextProps>({
  daisyTheme: "dark",
  setDaisyTheme: () => {},
});

export const DaisyUIThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [daisyTheme, setDaisyTheme] = useState("dark");

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", daisyTheme);
  }, [daisyTheme]);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("daisyui-theme");
    if (savedTheme) {
      setDaisyTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem("daisyui-theme", daisyTheme);
  }, [daisyTheme]);

  return (
    <DaisyUIThemeContext.Provider value={{ daisyTheme, setDaisyTheme }}>
      {children}
    </DaisyUIThemeContext.Provider>
  );
};