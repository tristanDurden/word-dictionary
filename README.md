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

- Sign in with GitHub (Auth.js) — each user has a private saved-word dictionary
- Search English words from the Free Dictionary API
- View phonetic transcription, pronunciation audio, and meanings
- Select one meaning and save it to MySQL via Prisma
- Use browser text-to-speech as a fallback pronunciation button

## Auth (GitHub)

1. Create an OAuth App at https://github.com/settings/developers
2. Set **Homepage URL** to `http://localhost:3000` (or your production URL)
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID / Client Secret into `.env` (see `.env.example`)
5. Generate `AUTH_SECRET` with `openssl rand -base64 32`
6. In production, also set `AUTH_URL` to your public app URL

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

Requires a signed-in session. Each request is scoped to the current user.

- `GET /api/words` - list your saved words (latest first)
- `POST /api/words` - create a saved word
- `DELETE /api/words/:id` - remove one of your saved words

## Prisma + MySQL setup (Docker)

Schema lives in `prisma/schema.prisma` with Auth.js models (`User`, `Account`, `Session`) and `WordEntry` owned by `userId`.

```bash
npx prisma generate
npx prisma migrate deploy
```

Default database URL in `.env`:

```env
DATABASE_URL="mysql://worddict:worddict@localhost:3307/word_dict"
```

## Notes

- `.env` is ignored by git; update `DATABASE_URL` and auth vars as needed.
- In deployment containers, startup runs `prisma migrate deploy` before `next start`.
- Pass `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, and `AUTH_URL` through Dokploy / docker-compose.
