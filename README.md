# Historical Network Analysis

This project provides tools for historical network analysis and visualization.

## Project Structure

The project is split into two main parts:

- **Frontend**: A React application built with Vite, TypeScript, and Chakra UI for data visualization
- **Backend**: A Node.js Express API that provides data processing and access to the frontend

## Setup and Installation

### Prerequisites

- Node.js (v16+)
- npm or pnpm

### Installation

1. Install dependencies for both frontend and backend:

```bash
npm install
```

This will install dependencies for both projects.

## Running the Application

You can run both frontend and backend together:

```bash
npm start
```

Or run them separately:

### Backend

```bash
npm run start:backend
```

The backend API will run on http://localhost:3001.

### Frontend

```bash
npm run start:frontend
```

The frontend will run on http://localhost:5173.

## Building for Production

To build both projects:

```bash
npm run build
```

The frontend build will be in `frontend/dist/` and the backend build will be in `backend/dist/`.

## API Endpoints

- `GET /api` - Root endpoint
- `GET /api/data/sample` - Get sample historical network data
- `GET /api/data/excel` - Get data from the Excel file

## Features

- Interactive 3D force-directed graph visualization
- Map-based visualization of historical connections
- Data loading from Excel spreadsheets
- Optimized rendering for large historical networks
- Responsive design with light/dark mode support

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Framework**: Chakra UI
- **Data Visualization**: D3.js, Three.js, Leaflet
- **Graph Visualization**: react-force-graph-3d
- **Bundler**: Vite
- **Styling**: Tailwind CSS

## Data Format

The application expects historical network data in Excel format (`.xlsx`) with the following structure:
- Node information (people, places, organizations)
- Edge information (relationships, connections, interactions)

A sample dataset is included for demonstration purposes.

## Project Structure

- `src/`: Source code
  - `components/`: Reusable UI components
  - `data/`: Data loading and processing utilities
  - `layouts/`: Page layouts and structure
  - `theme/`: Chakra UI theme customization
  - `types/`: TypeScript type definitions
  - `utils/`: Utility functions

## Acknowledgments

- Built with React, Chakra UI, and Three.js
- Visualization powered by D3.js and react-force-graph-3d