import { DictionaryResult } from "../types";



async function fetchDictionaryWord(word:string): Promise<DictionaryResult | null> {
    try {
      const response = await fetch(
        `/api/dictionary?word=${encodeURIComponent(word)}`,
      );
      const payload = (await response.json()) as
        | DictionaryResult
        | { error: string };

      if (!response.ok) {
        return null;
      }

      return payload as DictionaryResult;
    } catch {
      return null;
    }
}

export { fetchDictionaryWord };