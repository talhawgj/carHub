# Car Dealership App

A full-stack Next.js application for managing car listings with Supabase backend and image storage.

## Quick Start

### 1. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard:
   - Go to **Settings → API** and copy:
     - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
     - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

3. Create the database tables (see [ARCHITECTURE.md](./ARCHITECTURE.md) for SQL)

4. Create a storage bucket named `car-images`:
   - Go to **Storage → New bucket**
   - Name: `car-images`
   - Make it public

### 2. Environment Configuration

Update `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_STORAGE_BUCKET=car-images
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

Key directories:
- `src/app/api/` - Backend API routes
- `src/services/` - Business logic (car & image services)
- `src/hooks/` - Custom React hooks
- `src/components/` - Reusable React components
- `src/lib/` - Utilities and configurations

## Features

✅ List all available cars  
✅ Create new car listings  
✅ Upload multiple images per car  
✅ Search and filter cars  
✅ Update/delete listings  
✅ Responsive design with Tailwind CSS  
✅ TypeScript for type safety  

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cars` | Get all cars (paginated) |
| POST | `/api/cars` | Create new car |
| GET | `/api/cars/[id]` | Get car details |
| PUT | `/api/cars/[id]` | Update car |
| DELETE | `/api/cars/[id]` | Delete car |
| POST | `/api/upload` | Upload image |

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Language**: TypeScript
- **Validation**: Zod
- **HTTP Client**: Axios

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Security

- Use Row Level Security (RLS) in Supabase
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to client
- Validate file uploads (type & size)
- Implement user authentication
- Add permission checks in API routes

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed security guidelines.

## Next Steps

1. Set up Supabase authentication
2. Add user profile pages
3. Implement car search with filters
4. Add image upload UI
5. Build seller dashboard
6. Add payment integration
7. Implement notifications

## License

MIT
