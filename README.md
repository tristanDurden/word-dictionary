This is a dictionary learning app built with [Next.js](https://nextjs.org).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- Search English words from the Free Dictionary API
- View phonetic transcription, pronunciation audio, and meanings
- Select one meaning and save it to MySQL via Prisma
- Use browser text-to-speech as a fallback pronunciation button

## Backend route

- `GET /api/dictionary?word=<word>`
- Proxies requests to `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`
- Returns normalized JSON for the frontend:

```json
{
  "word": "example",
  "phonetic": "/ɪɡˈzɑːmpəl/",
  "audioUrl": "https://.../example.mp3",
  "meanings": [
    {
      "partOfSpeech": "noun",
      "definitions": ["a thing characteristic of its kind"]
    }
  ]
}
```

## Saved words API

- `GET /api/words` - list saved words (latest first)
- `POST /api/words` - create a saved word
- `DELETE /api/words/:id` - remove a saved word

## Prisma + MySQL setup (Docker)

Schema lives in `prisma/schema.prisma` with model `WordEntry`.

```bash
docker compose up -d mysql
npx prisma generate
npx prisma db push
```

Default database URL in `.env`:

```env
DATABASE_URL="mysql://worddict:worddict@localhost:3307/word_dict"
```

## Notes

- `.env` is ignored by git; update `DATABASE_URL` if you want a different database.
- In deployment containers, startup runs `prisma generate` and `prisma migrate deploy` before `next start`.
- Ensure migrations exist in `prisma/migrations` (`npx prisma migrate dev --name init`) so production deploys can apply schema changes safely.
