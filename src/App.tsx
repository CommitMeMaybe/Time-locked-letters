import { useState } from 'react'
import type { View } from './types'
import LandingPage from './components/LandingPage'
import AppInterface from './components/AppInterface'

function App() {
  const [view, setView] = useState<View>('landing')

  return (
    <>
      {view === 'landing' ? (
        <LandingPage onEnterApp={() => setView('app')} />
      ) : (
        <AppInterface onBack={() => setView('landing')} />
      )}
    </>
  )
}

export default App
