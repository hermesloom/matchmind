# MatchMind

"MatchMind" is an embeddings-based, hyper-minimalist social network. All users respond to the same prompt and then their response is matched to similar responses from other users using basic cosine similarity search on the embeddings vectors of the responses, generated via OpenAI's "text-embedding-3-small" model. Users can then exchange private messages with their matches.

Current tech stack: Next.js, NextUI, Supabase (with Postgres database), Pinecone, OpenAI API, Fly.io

## Setup

Currently, the steps for local development are:

1. Have Node.js and Docker installed.
2. `cp .env.template .env`
3. Enter your OpenAI and Pinecone API keys in `.env`.
4. `npm install`
5. `npm run supabase:start`
6. Copy the displayed values for Supabase to `.env`.
7. `npm run dev`
8. You can change the prompt in `app/page.tsx`.

For cloning and deploying one's own instance with another prompt, it should be much simpler. Setup should be as trivial as possible, so that everyone can deploy their own instance. My vision here is as follows:

1. The first thing the user should need to do is to create an account at fly.io.
2. There should be a single script in this directory which does everything with a single command, including self-hosted Supabase, self-hosted vector database and Next.js setup.

## Co-creation

Please contact synergies@hermesloom.org for collaboration and co-creation.

## License

[GNU GPL v3 or later](https://spdx.org/licenses/GPL-3.0-or-later.html)
