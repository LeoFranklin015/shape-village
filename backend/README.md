# ShapeTheVillage Backend

A simple Express TypeScript server for the ShapeTheVillage project.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the root directory:

```bash
PORT=3001
NODE_ENV=development
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

## API Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/villages` - Get all villages
- `POST /api/villages` - Create a village
- `GET /api/villages/:id` - Get a specific village
- `GET /api/characters` - Get all characters
- `POST /api/characters` - Create a character
- `GET /api/characters/:id` - Get a specific character

## Development

The server runs on port 3001 by default. You can change this by setting the `PORT` environment variable.
