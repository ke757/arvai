import { useState } from 'react'

interface ConnectionSetupProps {
  onConnect: (url: string) => Promise<void>
  error: string | null
}

export default function ConnectionSetup({ onConnect, error }: ConnectionSetupProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim() || loading) return

    setLoading(true)
    try {
      await onConnect(url.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-gray-800 mb-2">Arvai</h1>
        <p className="text-sm text-gray-500">连接到您的 Arvai 服务</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            连接 URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://127.0.0.1:8731/?key=arvai_xxx"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-400">
            从桌面应用获取连接 URL
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-600 text-sm rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!url.trim() || loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? '连接中...' : '连接'}
        </button>
      </form>
    </div>
  )
}
