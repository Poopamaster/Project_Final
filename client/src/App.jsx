import React, { useState, useEffect } from 'react'
import Homepage from './pages/HomePage'
function App() {
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('http://localhost:3001/api/hello')
      .then(res => res.json())
      .then(data => setMessage(data.message))
      .catch(err => console.error(err))
  }, [])

  return (
    <div style={{ padding: '20px' }}>
      <Homepage />
    </div>
  )
}

export default App