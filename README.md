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

- Sign in with Google or GitHub (Auth.js) — one email = one account / dictionary
- Search English words from the Free Dictionary API
- View phonetic transcription, pronunciation audio, and meanings
- Select one meaning and save it to MySQL via Prisma
- Use browser text-to-speech as a fallback pronunciation button

## Auth (Google + GitHub)

One verified email maps to a single user. Signing in with Google and GitHub using the same address links both providers to the same account.

1. Generate `AUTH_SECRET` with `openssl rand -base64 32`
2. In production, also set `AUTH_URL` to your public app URL

### GitHub

1. Create an OAuth App at https://github.com/settings/developers
2. Set **Homepage URL** to `http://localhost:3000` (or your production URL)
3. Set **Authorization callback URL** to `http://localhost:3000/api/auth/callback/github`
4. Set `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`

### Google

1. Create an OAuth client (Web application) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Set **Authorized JavaScript origins** to `http://localhost:3000`
3. Set **Authorized redirect URIs** to `http://localhost:3000/api/auth/callback/google`
4. Set `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`

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
- Pass `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, and `AUTH_URL` through Dokploy / docker-compose.
