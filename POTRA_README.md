# Potra — Web3 Trading Platform

A production-ready Web3 application built for the Portaldot ecosystem. Potra serves as the launch, bridge, and liquidity layer for the network.

## Application Structure

### Pages

1. **Landing Page** (`/`)
   - Hero section with ecosystem overview
   - Key statistics
   - Feature highlights
   - Live activity preview
   - CTA to launch app

2. **Dashboard** (`/app`)
   - Portfolio overview
   - Token holdings
   - Recent swaps
   - Trending tokens
   - Quick actions

3. **Swap** (`/app/swap`)
   - Token swap interface
   - Slippage settings
   - Price impact calculation
   - Transaction preview
   - Recent swap history

4. **Bridge** (`/app/bridge`)
   - Cross-chain bridge interface
   - Network selection
   - Asset transfer
   - Bridge status tracking
   - Bridge history

5. **Launch Token** (`/app/launch`)
   - Token creation form
   - Token details input
   - Logo upload
   - Social links
   - Initial liquidity seeding
   - Launch preview

6. **Portfolio** (`/app/portfolio`)
   - Holdings overview
   - Portfolio chart
   - LP positions
   - Transaction history
   - Performance tracking

7. **Ecosystem** (`/app/ecosystem`)
   - Trending tokens
   - New launches
   - Liquidity pools
   - Featured projects
   - Discovery interface

8. **Activity** (`/app/activity`)
   - Real-time transaction feed
   - Filter by type
   - Transaction details
   - Network activity stats

## Design System

### Color Palette
- **Primary**: Purple gradient (#8b5cf6)
- **Accent**: Cyan (#06b6d4)
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Destructive**: Red (#ef4444)

### Dark Mode
- Background: #0a0a0f
- Card: #13131a
- Border: Subtle opacity overlays
- Glassmorphism effects throughout

### Typography
- Clean, readable fonts
- Hierarchical sizing
- Consistent weights

## Component Architecture

### Reusable Components
- `AppSidebar` - Navigation sidebar
- `AppHeader` - Top navigation with wallet
- `LiveActivityPanel` - Real-time activity feed
- `TransactionModal` - Transaction status modals
- `WalletConnectModal` - Wallet connection flow
- `TokenIcon` - Token display component
- `StatCard` - Statistics display
- `PriceChart` - Chart visualization
- `EmptyState` - Empty state patterns

### UI Components
Full shadcn/ui component library included:
- Buttons, Inputs, Cards
- Dialogs, Dropdowns, Tabs
- Charts, Badges, Tooltips
- And more...

## Technical Stack

- **Framework**: React 18.3
- **Routing**: React Router 7.13
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)
- **Forms**: React Hook Form
- **Notifications**: Sonner

## Key Features

### 1. Wallet Integration Ready
- Wallet connect modal
- Account display
- Balance tracking
- Transaction signing UI

### 2. Real-Time Activity
- Live transaction feed
- Network status
- Ecosystem events
- User notifications

### 3. Advanced Trading
- Token swaps with slippage control
- Price impact calculation
- Route optimization UI
- Gas estimation

### 4. Cross-Chain Bridge
- Multi-network support
- Bridge status tracking
- Transaction history
- Estimated completion times

### 5. Token Launchpad
- Easy token creation
- Initial liquidity seeding
- Social integration
- Launch preview

### 6. Portfolio Management
- Holdings tracking
- LP position management
- Performance charts
- Transaction history

### 7. Ecosystem Discovery
- Trending tokens
- New launches
- Liquidity pools
- Featured projects

## Design Philosophy

### Premium & Professional
- Institutional-grade UI
- Sophisticated gradients
- Subtle glassmorphism
- Polished interactions

### Dark Mode First
- Optimized for low-light use
- High contrast ratios
- Comfortable extended viewing

### Responsive & Accessible
- Mobile-friendly layouts
- Keyboard navigation
- Screen reader support
- Touch-friendly targets

### Performance Optimized
- Fast route transitions
- Optimized re-renders
- Lazy loading ready
- Efficient state management

## Future Integration Points

This UI is designed to connect with:
- Web3 wallet providers (MetaMask, WalletConnect)
- Smart contracts for swaps, bridges, token launches
- Real-time WebSocket feeds for activity
- Blockchain explorers for transaction details
- Analytics services for charts and statistics

## Development

```bash
# Install dependencies
pnpm install

# The dev server is automatically running
# Preview at the provided URL

# Build for production
pnpm run build
```

## Routes

- `/` - Landing page
- `/app` - Dashboard
- `/app/swap` - Token swap
- `/app/bridge` - Cross-chain bridge
- `/app/launch` - Token launcher
- `/app/portfolio` - Portfolio tracker
- `/app/ecosystem` - Ecosystem explorer
- `/app/activity` - Activity feed
- `*` - 404 Not Found

---

**Built with Claude Code** | Ready for Web3 integration
