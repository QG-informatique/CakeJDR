# CakeJDR

CakeJDR is a Next.js application for playing tabletop RPGs online. It provides collaborative drawing, real‑time chat and dice tracking, along with character sheet management. Liveblocks powers the synchronization layer and stores room data, Cloudinary hosts canvas images and Vercel Blob stores character sheets only.

> **Note**
> This project is still in active development. Online features remain incomplete and the application currently works only when run locally.

## Installation

1. Clone this repository and install the dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and provide the required secrets. The file lists
   the following variables:
   - `CLOUDINARY_URL`
   - `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
   - `LIVEBLOCKS_SECRET_KEY`
   - `BLOB_READ_WRITE_TOKEN`
   - `VERCEL_OIDC_TOKEN`

3. Start the development server:

```bash
npm run dev
```

The app will then be available at [http://localhost:3000](http://localhost:3000).

## Usage

- `npm run dev` – start the server in development mode.
- `npm run build` – generate an optimized production build.
- `npm start` – run the app after `npm run build`.
- `npm run lint` – run ESLint.

Once running you can:

- Create or join a room using the dice button on the menu page.
- Draw and drop images on the shared canvas.
- Chat in real time and view dice statistics.
- Import or export character sheets locally or from the cloud.

## Technologies

- **Next.js** and **React** for the frontend.
- **Tailwind CSS** for styling.
- **Liveblocks** for real‑time synchronization (canvas, chat, stats…) and to store room metadata.
- **Cloudinary** for canvas image hosting.
- **Vercel Blob** for storing character sheets on the menu page only.
- **Framer Motion** and **Lucide React** for animations and icons.

## Backgrounds

Backgrounds are handled through a global React context. To add a new animated background:

1. Create a component under `components/ui` that renders your animated SVG.
2. Register this component in `components/context/BackgroundContext.tsx` by extending `BackgroundType` and the `cycleOrder` array.
3. Update `BackgroundWrapper.tsx` so it returns your component when the context value matches.

The background switch button in the menu will then cycle through all available backgrounds.

