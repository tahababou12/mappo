# Historical Network Analysis

A web application for visualizing and analyzing historical network data, with a focus on relationship mapping through time and space.

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

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/historical-network-analysis.git
cd historical-network-analysis

# Install dependencies
pnpm install
# or with npm
npm install
```

### Running the Development Server

```bash
pnpm dev
# or with npm
npm run dev
```

The application will be available at http://localhost:5173

### Building for Production

```bash
pnpm build
# or with npm
npm run build
```

The built files will be available in the `dist` directory.

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