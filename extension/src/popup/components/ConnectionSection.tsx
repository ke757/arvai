import { useState, useEffect, type FormEvent } from 'react'
import { Settings, Loader2 } from 'lucide-react'
import type { ConnectionConfig } from '@/types'
import { buildConnectionUrl } from '@/lib/connection'
import { useLocale } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Input } from '@/popup/components/ui/input'
import { Button } from '@/popup/components/ui/button'

interface ConnectionSectionProps {
  connection: ConnectionConfig | null
  isEditing: boolean
  onEdit: () => void
  onSave: (url: string) => Promise<void>
  onCancel: () => void
  loading: boolean
  error: string | null
}

export default function ConnectionSection({
  connection,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  loading,
  error,
}: ConnectionSectionProps) {
  const { t } = useLocale()
  const [url, setUrl] = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  useEffect(() => {
    if (isEditing && connection) {
      setUrl(buildConnectionUrl(connection.server, connection.apiKey))
    }
  }, [isEditing, connection])

  // Trigger shake animation when error changes
  useEffect(() => {
    if (error) {
      setShakeKey((k) => k + 1)
    }
  }, [error])

  const displayUrl = connection
    ? buildConnectionUrl(connection.server, connection.apiKey)
    : ''

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url.trim() || loading) return
    await onSave(url.trim())
  }

  const editing = isEditing || !connection

  // Compact read-only mode: title + readonly input + gear icon
  if (!editing && connection) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-medium text-foreground">{t('connection.title')}</h2>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          </div>
          <button
            onClick={onEdit}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
        <Input
          type="text"
          value={displayUrl}
          readOnly
          className="h-8 text-xs bg-muted/50 text-muted-foreground cursor-not-allowed"
        />
      </div>
    )
  }

  // Full edit mode
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium text-foreground">{t('connection.title')}</h2>
        {connection && (
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <Input
          key={shakeKey}
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://127.0.0.1:8731/?key=arvai_xxx"
          className={cn(
            "h-9 text-sm",
            error && "border-destructive focus-visible:ring-destructive input-shake"
          )}
          disabled={loading}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('connection.placeholder')}
        </p>

        <Button
          type="submit"
          className="mt-3 w-full h-8"
          disabled={!url.trim() || loading}
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {loading ? t('connection.verifying') : t('connection.save')}
        </Button>
      </form>
    </div>
  )
}
