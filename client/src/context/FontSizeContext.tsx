import { createContext, useState, ReactNode } from "react";

interface FontSizeContextProps {
  fontSize: number;
  setFontSize: (size: number) => void;
}

export const FontSizeContext = createContext<FontSizeContextProps>({
  fontSize: 18,
  setFontSize: () => {},
});

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [fontSize, setFontSize] = useState(18);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};
