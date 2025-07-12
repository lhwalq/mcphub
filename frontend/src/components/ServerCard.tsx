import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Server } from '@/types'
import { MoreVertical, AlertCircle, Copy, Check } from 'lucide-react'
import DeleteDialog from '@/components/ui/DeleteDialog'
import { useToast } from '@/contexts/ToastContext'

interface ServerCardProps {
  server: Server
  onRemove: (serverName: string) => void
  onEdit: (server: Server) => void
  onToggle?: (server: Server, enabled: boolean) => Promise<boolean>
  onRefresh?: () => void
  onClick?: (server: Server) => void
}

const ServerCard = ({ server, onRemove, onEdit, onToggle, onClick }: ServerCardProps) => {
  const { t } = useTranslation()
  const { showToast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showErrorPopover, setShowErrorPopover] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)
  const errorPopoverRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (errorPopoverRef.current && !errorPopoverRef.current.contains(event.target as Node)) {
        setShowErrorPopover(false)
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
    setShowMenu(false)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(server)
    setShowMenu(false)
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isToggling || !onToggle) return

    setIsToggling(true)
    setShowMenu(false)
    try {
      await onToggle(server, !(server.enabled !== false))
    } finally {
      setIsToggling(false)
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowMenu(!showMenu)
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(server)
    }
  }

  const handleErrorIconClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowErrorPopover(!showErrorPopover)
  }

  const copyToClipboard = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!server.error) return

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(server.error).then(() => {
        setCopied(true)
        showToast(t('common.copySuccess') || 'Copied to clipboard', 'success')
        setTimeout(() => setCopied(false), 2000)
      })
    } else {
      // Fallback for HTTP or unsupported clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = server.error
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        showToast(t('common.copySuccess') || 'Copied to clipboard', 'success')
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        showToast(t('common.copyFailed') || 'Copy failed', 'error')
        console.error('Copy to clipboard failed:', err)
      }
      document.body.removeChild(textArea)
    }
  }

  const handleConfirmDelete = () => {
    onRemove(server.name)
    setShowDeleteDialog(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500'
      case 'connecting':
        return 'text-yellow-500'
      case 'disconnected':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return t('status.online')
      case 'connecting':
        return t('status.connecting')
      case 'disconnected':
        return t('status.offline')
      default:
        return t('status.unknown')
    }
  }

  return (
    <>
      <div 
        className={`h-[177px] rounded-[8px] bg-white border-[0.5px] border-[#EFEFF0] shadow-[0px_0px_4px_0px_#F5F5F6] p-4 cursor-pointer flex flex-col ${
          server.enabled === false ? 'opacity-60' : 'opacity-100'
        }`}
        onClick={handleCardClick}
      >
        {/* Header with title and menu */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <img 
              src={server.icon && server.icon.startsWith('data:image/') ? server.icon : "/assets/mcp_icon.svg"} 
              className="w-10 h-10 flex-shrink-0 rounded-lg" 
              alt="server" 
            />
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[#111828] text-[16px] truncate">{server.name}</h3>
              {server.error && (
                <div className="relative">
                  <div
                    className="cursor-pointer inline-block"
                    onClick={handleErrorIconClick}
                  >
                    <AlertCircle className="text-red-500 hover:text-red-600" size={16} />
                  </div>
                  {showErrorPopover && (
                    <div
                      ref={errorPopoverRef}
                      className="absolute z-20 mt-2 bg-white border border-gray-200 rounded-md shadow-lg p-0 w-80 left-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-between items-center sticky top-0 bg-white py-2 px-4 border-b border-gray-200">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-red-600">{t('server.errorDetails')}</h4>
                          <button
                            onClick={copyToClipboard}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title={t('common.copy')}
                          >
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowErrorPopover(false)
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="p-4 pt-2 max-h-40 overflow-y-auto">
                        <pre className="text-sm text-gray-700 break-words whitespace-pre-wrap">{server.error}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={handleMenuClick}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <MoreVertical size={16} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 w-32 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={handleEdit}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  {t('server.edit')}
                </button>
                <button
                  onClick={handleToggle}
                  disabled={isToggling}
                  className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  {isToggling
                    ? t('common.processing')
                    : server.enabled !== false
                      ? t('server.disable')
                      : t('server.enable')
                  }
                </button>
                <button
                  onClick={handleRemove}
                  className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  {t('server.delete')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description - with fixed height and scrollbar */}
        {server.description && (
          <div className="h-[72px] overflow-y-auto text-[12px] text-[#676F83] mb-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {server.description}
          </div>
        )}

        {/* Bottom info - fixed at bottom */}
        <div className="mt-auto flex items-center text-sm">
          <div className="flex items-center space-x-1">
            <img src="/assets/tools.svg" className="w-3 h-3" alt="tools" />
            <span className="text-[#676F83] text-[12px]">{server.tools?.length || 0} tools</span>
            <div className="flex items-center space-x-1 ml-2">
              <div className={`w-2 h-2 rounded-full ${
                server.status === 'connected' ? 'bg-green-500' : 
                server.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className={`${getStatusColor(server.status)} text-[12px]`}>
                {getStatusText(server.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        serverName={server.name}
      />
    </>
  )
}

export default ServerCard