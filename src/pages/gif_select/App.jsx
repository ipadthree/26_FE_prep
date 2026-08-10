import { useEffect, useId, useRef, useState } from 'react'
import './App.css'

const API_BASE_URL = 'https://api.giphy.com/v1'
const API_KEY = import.meta.env.VITE_GIPHY_API_KEY
const RESULT_LIMIT = 24

const POPULAR_SEARCHES = [
  'happy',
  'cats',
  'celebrate',
  'coding',
  'reaction',
  'coffee',
]

// 没有配置 API Key 时使用的演示数据，让项目拉下来后也能直接体验完整交互。
const DEMO_GIFS = [
  ['3o7abKhOpu0NwenH3O', 'Happy dance', 'happy celebrate dance'],
  ['ICOgUNjpvO0PC', 'Curious cat', 'cats cute animal'],
  ['g9582DNuQppxC', 'Celebration', 'celebrate party happy'],
  ['13HgwGsXF0aiGY', 'Coding fast', 'coding developer computer'],
  ['l0HlBO7eyXzSZkJri', 'Surprised reaction', 'reaction wow surprised'],
  ['DrJm6F9poo4aA', 'Coffee time', 'coffee morning tired'],
  ['111ebonMs90YLu', 'Excited', 'happy excited reaction'],
  ['JIX9t2j0ZTN9S', 'Cat typing', 'cats coding typing'],
  ['IwAZ6dvvvaTtdI8SD5', 'Party time', 'celebrate party dance'],
  ['YQitE4YNQNahy', 'Developer at work', 'coding developer work'],
  ['bC9czlgCMtw4cj8RgH', 'That is funny', 'reaction laugh funny'],
  ['ES4Vcv8zWfIt2', 'Need coffee', 'coffee tired morning'],
].map(([id, title, tags]) => ({
  id,
  title,
  alt_text: title,
  url: `https://giphy.com/gifs/${id}`,
  username: 'GIPHY',
  tags,
  images: {
    fixed_width: {
      url: `https://media.giphy.com/media/${id}/200w.gif`,
      width: '320',
      height: '220',
    },
  },
}))

// 通用防抖 Hook：用户停止输入一小段时间后才更新，减少不必要的 API 请求。
function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebouncedValue(value), delay)
    return () => window.clearTimeout(timerId)
  }, [value, delay])

  return debouncedValue
}

function getDemoGifs(query) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return DEMO_GIFS

  const filteredGifs = DEMO_GIFS.filter(({ title, tags }) =>
    `${title} ${tags}`.toLowerCase().includes(normalizedQuery),
  )

  return filteredGifs
}

async function fetchGifs(query, signal) {
  if (!API_KEY) return getDemoGifs(query)

  const endpoint = query ? 'gifs/search' : 'gifs/trending'
  const params = new URLSearchParams({
    api_key: API_KEY,
    limit: String(RESULT_LIMIT),
    rating: 'g',
    bundle: 'messaging_non_clips',
  })

  if (query) {
    params.set('q', query)
    params.set('lang', 'en')
  }

  const response = await fetch(`${API_BASE_URL}/${endpoint}?${params}`, {
    signal,
  })

  if (!response.ok) {
    throw new Error(`GIPHY 请求失败（${response.status}）`)
  }

  const payload = await response.json()
  return payload.data ?? []
}

async function fetchSuggestions(query, signal) {
  if (!query.trim()) return []

  if (!API_KEY) {
    const normalizedQuery = query.toLowerCase()
    return POPULAR_SEARCHES.filter((term) =>
      term.includes(normalizedQuery),
    ).slice(0, 5)
  }

  const params = new URLSearchParams({
    api_key: API_KEY,
    q: query,
    limit: '5',
  })
  const response = await fetch(
    `${API_BASE_URL}/gifs/search/tags?${params}`,
    { signal },
  )

  if (!response.ok) return []
  const payload = await response.json()
  return (payload.data ?? []).map(({ name }) => name).filter(Boolean)
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" />
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.7c.7 4.75 3.55 7.6 8.3 8.3-4.75.7-7.6 3.55-8.3 8.3-.7-4.75-3.55-7.6-8.3-8.3 4.75-.7 7.6-3.55 8.3-8.3Z" />
    </svg>
  )
}

function GifCard({ gif, index }) {
  const rendition = gif.images?.fixed_width ?? gif.images?.downsized
  const aspectRatio = rendition?.width && rendition?.height
    ? `${rendition.width} / ${rendition.height}`
    : '4 / 3'

  return (
    <a
      className="gif-card"
      href={gif.url}
      target="_blank"
      rel="noreferrer"
      style={{ '--delay': `${Math.min(index * 35, 350)}ms` }}
      aria-label={`在 GIPHY 打开：${gif.title || 'GIF'}`}
    >
      <img
        src={rendition?.url}
        alt={gif.alt_text || gif.title || 'GIF 搜索结果'}
        loading="lazy"
        style={{ aspectRatio }}
      />
      <span className="gif-card__overlay">
        <span>{gif.title || 'Untitled GIF'}</span>
        <span aria-hidden="true">↗</span>
      </span>
    </a>
  )
}

function LoadingGrid() {
  return (
    <div className="gif-grid" aria-label="正在加载 GIF">
      {Array.from({ length: 8 }, (_, index) => (
        <div
          className="skeleton"
          style={{ height: `${180 + (index % 3) * 42}px` }}
          key={index}
        />
      ))}
    </div>
  )
}

function GifSearchPage() {
  const [query, setQuery] = useState('')
  const [gifs, setGifs] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [resultQuery, setResultQuery] = useState('')
  const inputRef = useRef(null)
  const listboxId = useId()

  // GIF 结果与联想词使用不同防抖时间：联想更快，图片搜索稍慢以节省请求次数。
  const debouncedQuery = useDebouncedValue(query.trim(), 500)
  const suggestionQuery = useDebouncedValue(query.trim(), 220)
  const showSuggestions =
    isInputFocused && query.trim() && suggestions.length > 0

  useEffect(() => {
    const controller = new AbortController()

    async function loadGifs() {
      setIsLoading(true)
      setError('')

      try {
        const nextGifs = await fetchGifs(debouncedQuery, controller.signal)
        setGifs(nextGifs)
        setResultQuery(debouncedQuery)
      } catch (requestError) {
        // AbortError 代表上一次搜索已被新输入替代，不需要向用户报错。
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || '搜索失败，请稍后再试。')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadGifs()
    return () => controller.abort()
  }, [debouncedQuery])

  useEffect(() => {
    const controller = new AbortController()

    async function loadSuggestions() {
      try {
        const nextSuggestions = await fetchSuggestions(
          suggestionQuery,
          controller.signal,
        )
        setSuggestions(nextSuggestions)
        setSelectedSuggestion(-1)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') setSuggestions([])
      }
    }

    loadSuggestions()
    return () => controller.abort()
  }, [suggestionQuery])

  function chooseSearchTerm(term) {
    setQuery(term)
    setSuggestions([])
    setSelectedSuggestion(-1)
    // 选择完成后收起联想面板，避免同一个关键词再次弹出。
    setIsInputFocused(false)
    inputRef.current?.blur()
  }

  function handleKeyDown(event) {
    if (!showSuggestions) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setSelectedSuggestion((current) =>
        current >= suggestions.length - 1 ? 0 : current + 1,
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setSelectedSuggestion((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      )
    } else if (event.key === 'Enter' && selectedSuggestion >= 0) {
      event.preventDefault()
      chooseSearchTerm(suggestions[selectedSuggestion])
    } else if (event.key === 'Escape') {
      setSuggestions([])
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="GIFinder 首页">
          <span className="brand__mark"><SparkIcon /></span>
          <span>GIFinder</span>
        </a>
        <span className="api-status">
          <span className="api-status__dot" />
          {API_KEY ? 'Live API' : 'Demo mode'}
        </span>
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="eyebrow"><SparkIcon /> Find the perfect reaction</div>
          <h1>Say it better<br />with a <em>GIF.</em></h1>
          <p className="hero-copy">
            输入一个想法，立即找到能替你表达的动图。
          </p>

          <div className="search-area">
            <div className={`search-box ${isInputFocused ? 'is-focused' : ''}`}>
              <span className="search-box__icon"><SearchIcon /></span>
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => setQuery(event.target.value.slice(0, 50))}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => window.setTimeout(() => setIsInputFocused(false), 120)}
                onKeyDown={handleKeyDown}
                placeholder="试试 “happy” 或 “coding”"
                aria-label="搜索 GIF"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={Boolean(showSuggestions)}
                aria-controls={listboxId}
                aria-activedescendant={
                  selectedSuggestion >= 0
                    ? `${listboxId}-${selectedSuggestion}`
                    : undefined
                }
              />
              {query && (
                <button
                  className="clear-button"
                  type="button"
                  aria-label="清空搜索"
                  onClick={() => chooseSearchTerm('')}
                >
                  ×
                </button>
              )}
              {query !== debouncedQuery && <span className="typing-indicator" aria-label="等待输入完成" />}
            </div>

            {showSuggestions && (
              <ul className="suggestions" id={listboxId} role="listbox">
                {suggestions.map((suggestion, index) => (
                  <li
                    id={`${listboxId}-${index}`}
                    role="option"
                    aria-selected={selectedSuggestion === index}
                    className={selectedSuggestion === index ? 'is-selected' : ''}
                    key={suggestion}
                    onMouseDown={() => chooseSearchTerm(suggestion)}
                  >
                    <SearchIcon />
                    <span>{suggestion}</span>
                    <small>搜索</small>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="quick-searches" aria-label="热门搜索">
            <span>Popular</span>
            {POPULAR_SEARCHES.slice(0, 4).map((term) => (
              <button type="button" key={term} onClick={() => chooseSearchTerm(term)}>
                {term}
              </button>
            ))}
          </div>
        </section>

        <section className="results-section" aria-live="polite">
          <div className="results-heading">
            <div>
              <span className="section-kicker">{resultQuery ? 'Search results' : 'Explore'}</span>
              <h2>{resultQuery ? `“${resultQuery}”` : 'Trending right now'}</h2>
            </div>
            {!isLoading && !error && (
              <span className="result-count">{gifs.length} GIFs</span>
            )}
          </div>

          {error && (
            <div className="message-card" role="alert">
              <span>!</span>
              <div><strong>没有连接上 GIF 世界</strong><p>{error}</p></div>
            </div>
          )}

          {isLoading && <LoadingGrid />}

          {!isLoading && !error && gifs.length === 0 && (
            <div className="empty-state">
              <span>¯\_(ツ)_/¯</span>
              <h3>没有找到匹配的 GIF</h3>
              <p>换一个更简单的英文关键词试试看。</p>
            </div>
          )}

          {!isLoading && !error && gifs.length > 0 && (
            <div className="gif-grid">
              {gifs.map((gif, index) => (
                <GifCard gif={gif} index={index} key={gif.id} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>Made for better conversations.</span>
        <a href="https://giphy.com" target="_blank" rel="noreferrer">
          POWERED BY <strong>GIPHY</strong>
        </a>
      </footer>
    </div>
  )
}

export default GifSearchPage
