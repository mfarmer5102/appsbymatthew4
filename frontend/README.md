# Portfolio Frontend

A React + Vite application for displaying portfolio applications, skills, and related data.

## Environment Configuration

The application uses environment variables to configure the API endpoint:

### Development
- Default API URL: `http://localhost:5011/api`
- No environment file needed for development

### Production
- Production API URL: `https://r2ccrdqgnu.us-east-1.awsapprunner.com/api`
- Copy `.env.example` to `.env.production` and uncomment the production URL

### Environment Variables
- `VITE_API_BASE_URL` - The base URL for the API backend

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
