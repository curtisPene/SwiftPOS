# SwiftPOS

A modern, multi-tenant Point of Sale (POS) system built with hexagonal architecture, TypeScript, and the MERN stack.

## 🎯 Project Overview

SwiftPOS is a comprehensive POS system designed for retail businesses. It features offline-first architecture, real-time capabilities, and multi-tenant data isolation for scalable, maintainable operations.

## 🏗️ Architecture

### Hexagonal Architecture (Ports & Adapters)
```
domains/
├── stores/
│   ├── domain/           # Business entities and rules
│   ├── application/      
│   │   ├── ports/        # Interfaces (Repository contracts)
│   │   └── use-cases/    # Business logic orchestration
│   └── infrastructure/
│       ├── primary/      # Controllers, Routes (driving adapters)
│       └── secondary/    # DB models, Repositories (driven adapters)
```

### Tech Stack
- **Backend**: Node.js, TypeScript, Express.js
- **Frontend**: React, TypeScript, Vite
- **Database**: MongoDB with Mongoose ODM  
- **Cache**: Redis for sessions and real-time data
- **Real-time**: Socket.IO for WebSocket communication
- **Offline**: Dexie (IndexedDB) for client-side storage

## ✨ Key Features

### Core Functionality
- **Multi-tenant Store Management** with complete data isolation
- **Offline-first POS Operations** - works without internet connectivity
- **Real-time Notifications** across devices and users
- **Role-based Access Control** (Admin/Manager/Cashier)
- **Comprehensive Product Catalog** with categories and variants
- **Transaction Processing** with VAT-inclusive pricing
- **Inventory Management** with stock tracking and movements
- **Audit Logging** for all system operations

### Technical Features
- **WebSocket Notifications** with store-scoped channels
- **Offline Sync** with conflict resolution
- **Optimistic Updates** for responsive user experience
- **Secure Authentication** with token blacklisting
- **Mobile-first Responsive Design** (mobile → tablet → desktop)
- **Performance Optimized** with proper database indexing

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB 6.0+
- Redis 6.0+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/curtisPene/SwiftPOS.git
   cd SwiftPOS
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Environment setup**
   ```bash
   cd ../server
   cp .env.example .env
   # Edit .env with your database and configuration settings
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Server
   cd server
   npm run dev

   # Terminal 2 - Client
   cd client
   npm run dev
   ```

## 📁 Project Structure

```
SwiftPOS/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── features/       # Feature-based architecture
│   │   ├── components/     # Shared UI components
│   │   ├── shared/         # Shared utilities and types
│   │   └── lib/            # Third-party integrations
│   └── ...
├── server/                 # Node.js backend application
│   ├── src/
│   │   ├── domains/        # Business domains (hexagonal architecture)
│   │   ├── config/         # Application configuration
│   │   └── shared/         # Shared utilities
│   └── ...
└── design/                 # Figma design files
```

## 🔧 Available Scripts

### Server
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests

### Client
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🌐 Multi-Tenant Architecture

SwiftPOS implements complete multi-tenant data isolation:
- **Store-scoped data** - All collections include `storeId` for isolation
- **JWT with store context** - Authentication includes store information
- **API routing** - All endpoints scoped to `/api/stores/:storeId/*`
- **WebSocket channels** - Real-time updates isolated by store
- **Offline storage** - Local data scoped to authenticated store

## 🔒 Security Features

- **JWT authentication** with HTTP-only cookies
- **Token blacklisting** for secure logout
- **Role-based permissions** (Admin/Manager/Cashier)
- **Account lockout** after failed attempts
- **Session timeout** and management
- **Input validation** and sanitization
- **CORS protection** and security headers

## 📱 Offline Capability

- **Dexie IndexedDB** for local data storage
- **Action queue system** for offline operations
- **Automatic sync** when connection restored
- **Optimistic updates** for responsive UX
- **Conflict resolution** with configurable strategies
- **Network status detection** and user feedback

## 🔄 Real-Time Features

- **WebSocket integration** with Socket.IO
- **Store-scoped channels** for multi-tenant isolation
- **Real-time notifications** for:
  - Transaction alerts to managers
  - Inventory updates across devices
  - User activity monitoring
  - System-wide announcements

## 🏪 Business Features

### For Retail Stores in Fiji
- **VAT-inclusive pricing** - No separate tax calculations
- **Multi-currency support** with FJD as default
- **Mobile-first design** optimized for tablets and phones
- **Offline POS operations** for reliable service
- **Multi-store management** with complete isolation
- **Comprehensive reporting** and analytics

## 🚧 Development Status

**Current Phase:** Foundation Development  
**Sprint 1:** Multi-tenant foundation + WebSocket + Offline architecture  
**Target:** September 2025

## 📄 License

ISC License - See LICENSE file for details

## 🤝 Contributing

This project follows professional development practices:
- TypeScript strict mode
- ESLint + Prettier for code quality
- Hexagonal architecture patterns
- Comprehensive testing (planned)
- Git conventional commits

---

Built with modern web technologies for reliable, scalable point-of-sale operations.