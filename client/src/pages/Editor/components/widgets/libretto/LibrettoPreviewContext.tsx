/**
 * Context per sincronizzare la pagina mostrata dal LibrettoMobileViewer
 * (nel canvas dell'editor / public mobile) con quella in edit nella
 * LibrettoSidebar mobile compact (tab "Pagine").
 *
 * Tap chip sidebar → updates pageIdx → viewer mostra quella pagina nel canvas.
 * Frecce Indietro/Avanti del viewer → updates pageIdx → chip sidebar segue.
 *
 * Il contesto è opzionale: i consumer cadono su state interno se il Provider
 * non è presente (es. public view standalone).
 */
import React from 'react';

interface LibrettoPreviewState {
  pageIdx: number;
  setPageIdx: (i: number) => void;
}

export const LibrettoPreviewContext = React.createContext<LibrettoPreviewState | null>(null);

export const LibrettoPreviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pageIdx, setPageIdx] = React.useState(0);
  const value = React.useMemo(() => ({ pageIdx, setPageIdx }), [pageIdx]);
  return (
    <LibrettoPreviewContext.Provider value={value}>
      {children}
    </LibrettoPreviewContext.Provider>
  );
};
