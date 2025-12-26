# SpinON

![Base](https://img.shields.io/badge/Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white)
![Farcaster](https://img.shields.io/badge/Farcaster-855DCD?style=for-the-badge&logo=farcaster&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> A gamified Spin-to-Win and Prediction platform built on Base L2, integrated with Farcaster's social graph.

<p align="center">
  <a href="https://www.spinon.xyz/" target="_blank">
    <img src="https://img.shields.io/badge/🎰_VISIT_LIVE_SITE-spinon.xyz-0052FF?style=for-the-badge&labelColor=0A0A0A" alt="Visit Live Site" />
  </a>
</p>

---

## 📖 About The Project

**SpinON** bridges the gap between social engagement and on-chain rewards within the Farcaster ecosystem. Traditional Web3 applications often lack engaging user experiences, while gamification platforms frequently miss the decentralized and trustless principles of blockchain technology.

SpinON solves this by providing:

- **Trustless Rewards**: All spin outcomes and rewards are verifiable on-chain via the Base network
- **Social Integration**: Deep Farcaster integration connects users through their existing social identity
- **Low Friction**: Base L2's fast and affordable transactions remove barriers to participation
- **Fair Play**: Backend-verified logic ensures transparent and tamper-proof results

Whether you're a Farcaster power user looking for new ways to engage or a Web3 enthusiast seeking fair gamified experiences, SpinON delivers a seamless, rewarding platform.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Farcaster Auth** | Seamless wallet connection via Farcaster profiles and frames |
| ⛓️ **Base L2 Native** | Built on Base Mainnet for sub-second finality and minimal gas fees |
| 🎡 **Spin & Earn** | Interactive wheel mechanic with real USDC reward payouts |
| 🏆 **Live Leaderboard** | Real-time rankings with backend-verified scoring system |
| 📱 **Mobile-First UI** | Responsive design optimized for Farcaster mobile clients |
| 🌐 **Ecosystem Hub** | Curated directory of Farcaster apps (Onchaingm, Superboard, etc.) |
| 🔒 **Secure Backend** | Supabase-powered data layer with Row Level Security |
| 📊 **User Stats** | Persistent tracking of spins, wins, and total earnings |

---

## 🛠️ Tech Stack

### Frontend
- **Vanilla JavaScript** - Lightweight, performant client-side logic
- **CSS3** - Custom styling with modern animations and gradients
- **Farcaster SDK** - Native frame and wallet integration

### Backend & Data
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security** - Secure, user-scoped data access
- **Edge Functions** - Serverless backend logic (Deno runtime)

### Blockchain
- **Base Mainnet** - Ethereum L2 for fast, affordable transactions
- **USDC** - Stablecoin rewards on Base network
- **Wagmi/Viem** - Type-safe Ethereum interactions

### Infrastructure
- **Vercel/Static Hosting** - Global CDN deployment
- **Farcaster Frames** - Embedded app experiences

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase project ([create one here](https://supabase.com))
- Farcaster account for testing

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/spinon.git
   cd spinon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**

   Navigate to `http://localhost:3000`

### Database Setup

The project uses Supabase for data persistence. Migrations are located in `/supabase/migrations/`. Apply them via the Supabase dashboard or CLI:

```bash
supabase db push
```

---

## 📁 Project Structure

```
spinon/
├── index.html          # Main application entry
├── game.js             # Core game logic and wheel mechanics
├── style.css           # Application styles
├── supabase.js         # Supabase client configuration
├── supabase/
│   └── migrations/     # Database schema migrations
└── .well-known/
    └── farcaster.json  # Farcaster frame manifest
```

---

## 🔐 Security

- All user data is protected by Supabase Row Level Security (RLS)
- Spin outcomes are validated server-side to prevent manipulation
- No private keys or sensitive data stored client-side
- HTTPS enforced on all endpoints

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- **Live App**: [spinon.xyz](https://www.spinon.xyz/)
- **Base Network**: [base.org](https://base.org)
- **Farcaster**: [farcaster.xyz](https://www.farcaster.xyz/)
- **Supabase**: [supabase.com](https://supabase.com)

---

<p align="center">
  Built with 💙 on Base
</p>
