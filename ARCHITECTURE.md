# Car Dealership App - Architecture Documentation

## Overview

This is a full-stack Next.js application for managing car listings with Supabase as the backend database and storage solution.

## Project Structure

```
src/
├── app/
│   ├── api/                    # Backend API routes
│   │   ├── cars/              # Car CRUD endpoints
│   │   │   ├── route.ts       # GET all, POST new
│   │   │   └── [id]/route.ts  # GET, PUT, DELETE single car
│   │   └── upload/            # Image upload endpoint
│   ├── cars/                  # Car listing pages
│   ├── dashboard/             # Seller dashboard
│   └── layout.tsx             # Root layout
├── components/                # Reusable React components
├── hooks/                     # Custom React hooks
├── lib/
│   └── supabase.ts           # Supabase client configuration
├── services/
│   ├── carService.ts         # Car business logic
│   └── imageService.ts       # Image upload/deletion logic
└── types/
    └── index.ts              # TypeScript interfaces
```

## Architecture Layers

### 1. **Frontend (Client)**
- Next.js App Router with TypeScript
- React components in `src/components/`
- Custom hooks for data fetching (`src/hooks/`)
- Server components for improved performance

### 2. **Backend (API Routes)**
- Next.js API routes in `src/app/api/`
- Handles business logic and Supabase operations
- Server-side authentication and validation

### 3. **Database (Supabase PostgreSQL)**
```sql
-- Required tables to create in Supabase:

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  avatar_url TEXT,
  user_type TEXT, -- 'buyer', 'seller', 'dealer'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  mileage INTEGER,
  year INTEGER,
  make TEXT,
  model TEXT,
  condition TEXT, -- 'new', 'used', 'refurbished'
  fuel_type TEXT, -- 'gasoline', 'diesel', 'hybrid', 'electric'
  transmission TEXT, -- 'manual', 'automatic'
  color TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id UUID NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'sold', 'expired'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create search index (optional but recommended)
CREATE INDEX cars_search_idx ON cars USING GIN(to_tsvector('english', title || ' ' || description));
```

### 4. **Storage (Supabase Storage)**
- Bucket name: `car-images`
- Organization: `{carId}/{filename}`
- Public access enabled for image serving
- Images stored per car listing

## Data Flow

### Getting Cars
```
User Browser
    ↓
Client Component
    ↓
Custom Hook (useCars)
    ↓
Client Service (carService)
    ↓
Supabase Client (@supabase/supabase-js)
    ↓
Supabase PostgreSQL
```

### Creating/Updating Cars
```
User Browser → Form Submission
    ↓
API Route (/api/cars)
    ↓
Server-side Validation
    ↓
Supabase Server Client (service role)
    ↓
Supabase PostgreSQL
```

### Image Upload
```
User selects file
    ↓
/api/upload endpoint
    ↓
Upload to Supabase Storage
    ↓
Return public URL
    ↓
Save URL in cars.images array
```

## Key Components & Services

### Services (`src/services/`)

**carService.ts**
- `getAllCars()` - Fetch paginated listings
- `getCarById()` - Get single car details
- `searchCars()` - Search with filters
- `createCar()` - Create new listing
- `updateCar()` - Edit listing
- `deleteCar()` - Remove listing

**imageService.ts**
- `uploadCarImage()` - Upload single image
- `uploadCarImages()` - Batch upload
- `deleteImage()` - Remove image
- `deleteCarImages()` - Batch delete by car

### Hooks (`src/hooks/`)

**useCars()**
- Fetches all available cars
- Returns: `{ cars, loading, error }`

**useCarById(id)**
- Fetches single car
- Returns: `{ car, loading, error }`

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_STORAGE_BUCKET=car-images
```

## Security Considerations

1. **Row Level Security (RLS)**
   - Enable on all tables in Supabase
   - Sellers can only modify their own listings
   - Users can only see public data

2. **Service Role Key**
   - Keep in `.env.local` (server-side only)
   - Never expose to client
   - Used in API routes for privileged operations

3. **Authentication**
   - Use Supabase Auth for user management
   - Verify user identity before creating/updating listings
   - Implement permission checks in API routes

4. **File Upload Security**
   - Validate file types (whitelist jpg, png, webp)
   - Limit file size
   - Store in organized paths by carId
   - Set cache control headers

## API Endpoints

### Cars
- `GET /api/cars` - Get all cars with pagination
- `POST /api/cars` - Create new car
- `GET /api/cars/[id]` - Get car details
- `PUT /api/cars/[id]` - Update car
- `DELETE /api/cars/[id]` - Delete car

### Images
- `POST /api/upload` - Upload image file

## Performance Optimization

1. **Client-Side**
   - Use custom hooks for data fetching
   - Implement pagination
   - Cache frequently accessed data

2. **Server-Side**
   - Use index on `cars(seller_id)`
   - Paginate large result sets
   - Use database-level search with text search

3. **Storage**
   - Compress images before upload (frontend)
   - Set cache control headers
   - Use CDN served through Supabase

## Future Enhancements

- [ ] User authentication with Supabase Auth
- [ ] Email notifications for new listings
- [ ] Wishlist/favorites feature
- [ ] Offers/negotiations system
- [ ] Review system
- [ ] Payment integration
- [ ] Image optimization & WebP conversion
- [ ] Advanced search filters
- [ ] Email notifications

## Deployment

1. Deploy to Vercel/Netlify
2. Set environment variables in production
3. Enable Row Level Security in Supabase
4. Configure CORS if needed
5. Set up backup strategy in Supabase

---

For more details, check the individual service and component files.
