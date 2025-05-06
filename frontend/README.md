# Historical Network Analysis

This is a unified codebase that includes both the frontend and backend components of the Historical Network Analysis application running on a single port.

## Project Structure

- `/src` - Frontend React application
  - `/server` - Backend Express API server that also serves the frontend
    - `/data` - Data processing and loading utilities
    - `/routes` - API endpoint routes
    - `/types` - TypeScript type definitions

## Development

To run the development server with both frontend and backend on the same port:

```bash
npm run dev
```

This will start:
- A unified development server on port 5173 that hosts both the frontend and the backend API

## Building for Production

```bash
npm run build
```

This builds both the frontend and backend code:
- Frontend is built to `/dist`
- Backend is built to `/dist/server`

## Running in Production

```bash
npm run start
```

This starts the production server which:
1. Serves the static frontend files
2. Handles API requests
All on the same domain and port (5173 by default)

## Available Scripts

- `npm run dev` - Run unified development server (frontend + backend)
- `npm run build` - Build frontend and backend for production
- `npm run start` - Start production server
- `npm run lint` - Run linter
- `npm run preview` - Preview production build locally 