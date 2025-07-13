import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Tool } from '@/types'
import { ChevronDown, ChevronRight, Play, Loader, Edit, Check } from '@/components/icons/LucideIcons'
import { callTool, ToolCallResult, updateToolDescription } from '@/services/toolService'
import DynamicForm from './DynamicForm'
import ToolResult from './ToolResult'

interface ToolCardProps {
  server: string
  tool: Tool
  onToggle?: (toolName: string, enabled: boolean) => void
  onDescriptionUpdate?: (toolName: string, description: string) => void
}

const ToolCard = ({ tool, server, onToggle, onDescriptionUpdate }: ToolCardProps) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const [showRunForm, setShowRunForm] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ToolCallResult | null>(null)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [customDescription, setCustomDescription] = useState(tool.description || '')
  const descriptionInputRef = useRef<HTMLInputElement>(null)
  const descriptionTextRef = useRef<HTMLSpanElement>(null)
  const [textWidth, setTextWidth] = useState<number>(0)
  
  // 简化切换函数
  const toggleRunForm = () => {
    setShowRunForm(!showRunForm)
    setIsExpanded(true)
    setResult(null)
  }
  
  // Focus the input when editing mode is activated
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus()
      // Set input width to match text width
      if (textWidth > 0) {
        descriptionInputRef.current.style.width = `${textWidth + 20}px` // Add some padding
      }
    }
  }, [isEditingDescription, textWidth])

  // Measure text width when not editing
  useEffect(() => {
    if (!isEditingDescription && descriptionTextRef.current) {
      setTextWidth(descriptionTextRef.current.offsetWidth)
    }
  }, [isEditingDescription, customDescription])

  // Generate a unique key for localStorage based on tool name and server
  const getStorageKey = useCallback(() => {
    return `mcphub_tool_form_${server ? `${server}_` : ''}${tool.name}`
  }, [tool.name, server])

  // Clear form data from localStorage
  const clearStoredFormData = useCallback(() => {
    localStorage.removeItem(getStorageKey())
  }, [getStorageKey])

  const handleToggle = (enabled: boolean) => {
    if (onToggle) {
      onToggle(tool.name, enabled)
    }
  }

  const handleDescriptionEdit = () => {
    setIsEditingDescription(true)
  }

  const handleDescriptionSave = async () => {
    try {
      const result = await updateToolDescription(server, tool.name, customDescription)
      if (result.success) {
        setIsEditingDescription(false)
        if (onDescriptionUpdate) {
          onDescriptionUpdate(tool.name, customDescription)
        }
      } else {
        // Revert on error
        setCustomDescription(tool.description || '')
        console.error('Failed to update tool description:', result.error)
      }
    } catch (error) {
      console.error('Error updating tool description:', error)
      setCustomDescription(tool.description || '')
      setIsEditingDescription(false)
    }
  }

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDescription(e.target.value)
  }

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleDescriptionSave()
    } else if (e.key === 'Escape') {
      setCustomDescription(tool.description || '')
      setIsEditingDescription(false)
    }
  }

  const handleRunTool = async (arguments_: Record<string, any>) => {
    setIsRunning(true)
    try {
      const result = await callTool({
        toolName: tool.name,
        arguments: arguments_,
      }, server)

      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleCancelRun = () => {
    setShowRunForm(false)
    clearStoredFormData()
    setResult(null)
  }

  const handleCloseResult = () => {
    setResult(null)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div
        className="flex justify-between items-start p-5 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tool Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900 truncate mb-2">
                {tool.name.replace(server + '-', '')}
              </h3>
              {/* Status Toggle - 可点击的状态指示器 */}
              <div 
                className={`inline-flex items-center cursor-pointer px-3 py-2 rounded-lg border transition-colors duration-200 ${
                  tool.enabled 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggle(!tool.enabled)
                }}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  tool.enabled ? 'bg-green-500' : 'bg-gray-400'
                } transition-colors duration-200`} />
                <span className={`text-sm font-medium ${
                  tool.enabled ? 'text-green-700' : 'text-gray-600'
                }`}>
                  {tool.enabled ? t('tool.enabled') : t('tool.disabled')}
                </span>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-3">
            {isEditingDescription ? (
              <div className="flex items-center space-x-3">
                <input
                  ref={descriptionInputRef}
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={customDescription}
                  onChange={handleDescriptionChange}
                  onKeyDown={handleDescriptionKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  placeholder={t('tool.enterDescription')}
                />
                <button
                  className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDescriptionSave()
                  }}
                >
                  <Check size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-start space-x-3">
                <p className="flex-1 text-sm text-gray-600 leading-relaxed">
                  <span ref={descriptionTextRef}>
                    {customDescription || t('tool.noDescription')}
                  </span>
                </p>
                <button
                  className="px-2 py-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDescriptionEdit()
                  }}
                  title={t('tool.editDescription')}
                >
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Side Controls */}
        <div className="flex items-center space-x-3 ml-6">
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleRunForm()
            }}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tool.enabled && !isRunning
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
            disabled={isRunning || !tool.enabled}
          >
            {isRunning ? (
              <Loader size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            <span>{isRunning ? t('tool.running') : t('tool.run')}</span>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="p-5 space-y-4">
            {/* Schema Display */}
            {!showRunForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{t('tool.inputSchema')}</h4>
                <div className="bg-gray-50 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 overflow-auto font-mono">
                    {JSON.stringify(tool.inputSchema, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            
            {/* Run Form */}
            {showRunForm && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('tool.runTool')}</h4>
                <DynamicForm
                  schema={tool.inputSchema || { type: 'object' }}
                  onSubmit={handleRunTool}
                  onCancel={handleCancelRun}
                  loading={isRunning}
                  storageKey={getStorageKey()}
                  title=""
                />
              </div>
            )}
            
            {/* Tool Result */}
            {result && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">{t('tool.result')}</h4>
                <ToolResult result={result} onClose={handleCloseResult} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ToolCard