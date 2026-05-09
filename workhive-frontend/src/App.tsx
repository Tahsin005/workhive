import Home from "./components/Home"
import { Route, Routes } from "react-router"

function App() {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </main>
  )
}

export default App
