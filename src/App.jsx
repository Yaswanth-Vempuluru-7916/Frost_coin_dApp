import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from './utils/wagmiConfig'
import Home from './pages/Home'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="h-screen w-full bg-gradient-to-b from-blue-100 to-blue-300 flex flex-col overflow-hidden">
          <Home />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App