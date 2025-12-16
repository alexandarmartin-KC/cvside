# CV Matcher

An AI-powered CV analysis and job matching application built with Next.js.

## Features

- 📄 PDF CV upload with drag & drop
- 🤖 AI-powered CV analysis using OpenAI
- 🎯 Intelligent job matching with scoring
- 📊 Clean, professional UI with Tailwind CSS
- ⚡ Built with Next.js 14 App Router

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```bash
   OPENAI_API_KEY=your_openai_api_key_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000/upload](http://localhost:3000/upload) in your browser

## Deployment to Vercel

### Environment Variables

Make sure to add the following environment variable in your Vercel project settings:

- `OPENAI_API_KEY` - Your OpenAI API key

### Deploy

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variable
4. Deploy!

Or use the Vercel CLI:

```bash
vercel
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS 3
- **PDF Processing:** pdf-parse
- **AI:** OpenAI GPT-4
- **Language:** TypeScript
- **Deployment:** Vercel

## File Size Limits

- Maximum CV file size: 4MB
- Accepts PDF files only

## Project Structure

```
cvside/
├── app/
│   ├── api/
│   │   └── cv/
│   │       └── parse/
│   │           └── route.ts       # API endpoint for CV processing
│   ├── upload/
│   │   └── page.tsx              # Main upload page
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── public/                       # Static assets
├── .env.local.example           # Environment variables template
└── package.json                 # Dependencies
```

## License

MIT