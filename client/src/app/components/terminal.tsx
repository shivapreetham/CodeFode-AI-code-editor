import { Terminal as XTerminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

import "@xterm/xterm/css/xterm.css";

const Terminal = () => {
  const terminalRef = useRef<HTMLDivElement>(null);

  const isRendered = useRef(false);

  useEffect(() => {
    if (isRendered.current) return;
    isRendered.current = true;

    const term = new XTerminal({
      rows: 10,
      cursorBlink: true,
      cursorStyle: "bar",
    });

    term.open(terminalRef.current!);

    var currLine = "";
    var entries = [];
    term.onKey((ev) => {
        if (ev.domEvent.key == "Enter") {
            if (currLine) {
                entries.push(currLine);
                term.write("\r\n");
                //Send cmd to backend here!
            }
        } else if (ev.domEvent.key == "Backspace") {
            if (currLine) {
                currLine = currLine.slice(0, currLine.length - 1);
                term.write("\b \b");
            }
        } else {
            currLine += ev.key
            term.write(ev.key);
        }
    });

  }, []);

  return <div ref={terminalRef} id="terminal" />;
};

export default Terminal;
