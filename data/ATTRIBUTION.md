# Data attribution

Synonym data in `wordnet-index.json` is derived from
[Open English Wordnet (OEWN)](https://en-word.net/) 2025, itself derived from
Princeton WordNet.

Licensed under
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/).

The raw OEWN JSON dump (`data/oewn-raw/`) is not committed. Rebuild the index
with:

```bash
npm run build:wordnet
# or
npx tsx scripts/build-wordnet-index.ts --source /path/to/english-wordnet-2025-json
```
