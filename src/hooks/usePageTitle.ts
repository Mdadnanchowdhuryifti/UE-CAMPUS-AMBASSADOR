import { useEffect } from 'react';

/** Sets the document title for the current page, e.g. "Squads – Ulterior Engineering". */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
