import { useState } from 'react'
import { X, Copy, Check, RefreshCw, Chrome, ExternalLink } from 'lucide-react'

type ExtensionConnectProps = {
  onClose: () => void
}

// API base URL - in production this should come from config
const API_BASE = 'http://127.0.0.1:8731'

type ApiKey = {
  id: number
  key: string
  key_prefix: string
  name: string
  created_at: string
}

export default function ExtensionConnect({ onClose }: ExtensionConnectProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [apiKey, setApiKey] = useState<ApiKey | null>(null)
  const [copied, setCopied] = useState(false)

  const generateKey = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'Chrome 扩展' }),
      })

      if (!response.ok) {
        throw new Error('生成密钥失败')
      }

      const data = await response.json()
      setApiKey(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成密钥失败')
    } finally {
      setLoading(false)
    }
  }

  const connectionUrl = apiKey 
    ? `${API_BASE}/?key=${apiKey.key}`
    : null

  const copyToClipboard = async () => {
    if (!connectionUrl) return
    
    try {
      await navigator.clipboard.writeText(connectionUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = connectionUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-panel rounded-xl shadow-2xl w-[420px] max-h-[80vh] overflow-hidden border border-edge">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-edge">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand/15 flex items-center justify-center">
              <Chrome className="w-5 h-5 text-brand-soft" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-ink">浏览器扩展</h2>
              <p className="text-[11px] text-ink-faint">连接 Chrome 扩展到 Arvai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-raised text-ink-dim hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Instructions */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-medium text-ink">使用步骤</h3>
            <ol className="space-y-2 text-[12px] text-ink-dim">
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand/15 text-brand-soft flex items-center justify-center text-[10px] font-medium shrink-0">1</span>
                <span>点击下方按钮生成连接 URL</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand/15 text-brand-soft flex items-center justify-center text-[10px] font-medium shrink-0">2</span>
                <span>复制生成的连接 URL</span>
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 rounded-full bg-brand/15 text-brand-soft flex items-center justify-center text-[10px] font-medium shrink-0">3</span>
                <span>在 Chrome 扩展中粘贴连接 URL 完成配置</span>
              </li>
            </ol>
          </div>

          {/* Generate Button / Connection URL */}
          {!apiKey ? (
            <button
              onClick={generateKey}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand text-white rounded-lg font-medium text-[13px] hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4" />
                  生成连接 URL
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-raised rounded-lg border border-edge">
                <label className="text-[10px] font-medium text-ink-faint uppercase tracking-wider">
                  连接 URL
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <code className="flex-1 text-[12px] text-ink font-mono break-all">
                    {connectionUrl}
                  </code>
                  <button
                    onClick={copyToClipboard}
                    className="p-2 rounded-lg hover:bg-panel text-ink-dim hover:text-ink transition-colors shrink-0"
                    title="复制"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={generateKey}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-edge text-ink-dim rounded-lg text-[12px] hover:bg-raised hover:text-ink transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                重新生成
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-[12px] text-error">
              {error}
            </div>
          )}

          {/* Warning */}
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-[11px] text-warning-dark">
              <strong>注意：</strong>连接 URL 包含 API 密钥，请妥善保管，不要分享给他人。
              每次生成都会创建新的密钥。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
