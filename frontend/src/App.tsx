import { Routes, Route } from 'react-router-dom'



function App() {
  return (
    <Routes>

      <Route
        path="/"
        element={
          <div style={{ padding: 20, textAlign: "center" }}>
            <h1>Vite + React</h1>
          </div>
        }
      />
    </Routes>
  )
}

export default App

