# Sales Dashboard - DataAI

A comprehensive sales dashboard with advanced analytics, transaction management, and AI-powered insights built with React, TypeScript, and Supabase.

## Features

### 🎯 Core Dashboard Features
- **Real-time Analytics**: Live sales data, revenue tracking, and performance metrics
- **Transaction Management**: Complete transaction lifecycle management (read-only for security)
- **Product Analytics**: Top-selling products, inventory insights, and performance tracking
- **Location Analysis**: Geographic sales distribution and location-based insights
- **Time-based Reports**: Daily, weekly, and monthly sales trends

### 📊 Advanced Analytics
- **Sales Velocity**: Track product movement and demand patterns
- **Customer Segmentation**: High, medium, and low-value customer analysis
- **Peak Sales Hours**: Identify optimal selling periods
- **Comprehensive Reporting**: Multi-dimensional business intelligence

### 🤖 AI-Powered Features
- **AI Chat Assistant**: Natural language queries for business insights
- **Smart Recommendations**: AI-driven product and sales suggestions
- **Predictive Analytics**: Forecast trends and identify opportunities

### 🔒 Security & Access Control
- **Row Level Security (RLS)**: Secure data access policies
- **Role-based Access**: Admin and user permission management
- **Audit Logging**: Complete activity tracking and monitoring

## Tech Stack

### Frontend
- **React 18**: Modern React with hooks and context
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast development and build tool

### Backend
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Edge Functions**: Serverless API endpoints
- **Real-time Subscriptions**: Live data updates

### Database
- **PostgreSQL**: Robust relational database
- **Row Level Security**: Database-level security policies
- **Triggers & Functions**: Automated data processing

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Dheolarh/DataAI.git
cd DataAI
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Add your Supabase credentials
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=AIzaSyD1Euh93DJzlZXJjYC_9t8s1PCCBT4Zt88

# Google Cloud
GOOGLE_PROJECT_ID=your_google_poject_ID
GOOGLE_LOCATION=your_gcp_project_region

WEAVIATE_URL=your_weviate_rest_endpoint_url
WEAVIATE_API_KEY=your_weviate_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test:transactions` - Test transaction utilities
- `npm run test:admins` - Test admin utilities

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with [Supabase](https://supabase.com) for backend infrastructure
- Styled with [Tailwind CSS](https://tailwindcss.com)
- Powered by [React](https://react.dev) and [TypeScript](https://typescriptlang.org)

---

**DataAI Sales Dashboard** - Empowering businesses with intelligent sales analytics and comprehensive transaction management.