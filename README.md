# Pool Scoring Frontend

A modern web application for scoring pool games with a focus on straight pool. Built with React and features a beautiful, responsive UI with real-time scoring capabilities.

## Features

- Real-time scoring interface
- User authentication and account management
- Beautiful, responsive design with dark mode
- Advanced statistics tracking
- Tournament support with handicap system

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory and add:
```
REACT_APP_API_URL=http://localhost:3001
```

3. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App

## Project Structure

```
src/
├── components/     # Reusable UI components
├── context/       # React context providers
├── pages/         # Page components
├── poolScoring/   # Pool scoring logic and components
└── App.js         # Main application component
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request # pool-scoring-frontend
