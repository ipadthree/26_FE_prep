import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import PracticeApp from './routes/PracticeApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* BrowserRouter 让顶部每个 Tab 都拥有独立 URL，同时保持 SPA 无刷新切换。 */}
    <BrowserRouter>
      <PracticeApp />
    </BrowserRouter>
  </StrictMode>,
)
