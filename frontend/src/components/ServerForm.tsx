import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Server, EnvVar, ServerFormData } from '@/types'

interface ServerFormProps {
  onSubmit: (payload: any) => void
  onCancel: () => void
  initialData?: Server | null
  modalTitle: string
  formError?: string | null
}

const ServerForm = ({ onSubmit, onCancel, initialData = null, modalTitle, formError = null }: ServerFormProps) => {
  const { t } = useTranslation()

  // Determine the initial server type from the initialData
  const getInitialServerType = () => {
    if (!initialData || !initialData.config) return 'stdio';

    if (initialData.config.type) {
      return initialData.config.type; // Use explicit type if available
    } else if (initialData.config.url) {
      return 'sse'; // Fallback to SSE if URL exists
    } else {
      return 'stdio'; // Default to stdio
    }
  };

  const [serverType, setServerType] = useState<'stdio' | 'sse' | 'streamable-http' | 'openapi'>(getInitialServerType());

  const [formData, setFormData] = useState<ServerFormData>({
    name: (initialData && initialData.name) || '',
    url: (initialData && initialData.config && initialData.config.url) || '',
    command: (initialData && initialData.config && initialData.config.command) || '',
    arguments:
      initialData && initialData.config && initialData.config.args
        ? Array.isArray(initialData.config.args)
          ? initialData.config.args.join(' ')
          : String(initialData.config.args)
        : '',
    args: (initialData && initialData.config && initialData.config.args) || [],
    type: getInitialServerType(), // Initialize the type field
    env: [],
    headers: [],
    options: {
      timeout: (initialData && initialData.config && initialData.config.options && initialData.config.options.timeout) || 60000,
      resetTimeoutOnProgress: (initialData && initialData.config && initialData.config.options && initialData.config.options.resetTimeoutOnProgress) || false,
      maxTotalTimeout: (initialData && initialData.config && initialData.config.options && initialData.config.options.maxTotalTimeout) || undefined,
    },
    // OpenAPI configuration initialization
    openapi: initialData && initialData.config && initialData.config.openapi ? {
      url: initialData.config.openapi.url || '',
      schema: initialData.config.openapi.schema ? JSON.stringify(initialData.config.openapi.schema, null, 2) : '',
      inputMode: initialData.config.openapi.url ? 'url' : (initialData.config.openapi.schema ? 'schema' : 'url'),
      version: initialData.config.openapi.version || '3.1.0',
      securityType: initialData.config.openapi.security?.type || 'none',
      // API Key initialization
      apiKeyName: initialData.config.openapi.security?.apiKey?.name || '',
      apiKeyIn: initialData.config.openapi.security?.apiKey?.in || 'header',
      apiKeyValue: initialData.config.openapi.security?.apiKey?.value || '',
      // HTTP auth initialization
      httpScheme: initialData.config.openapi.security?.http?.scheme || 'bearer',
      httpCredentials: initialData.config.openapi.security?.http?.credentials || '',
      // OAuth2 initialization
      oauth2Token: initialData.config.openapi.security?.oauth2?.token || '',
      // OpenID Connect initialization
      openIdConnectUrl: initialData.config.openapi.security?.openIdConnect?.url || '',
      openIdConnectToken: initialData.config.openapi.security?.openIdConnect?.token || ''
    } : {
      inputMode: 'url',
      url: '',
      schema: '',
      version: '3.1.0',
      securityType: 'none'
    }
  })

  const [envVars, setEnvVars] = useState<EnvVar[]>(
    initialData && initialData.config && initialData.config.env
      ? Object.entries(initialData.config.env).map(([key, value]) => ({ key, value }))
      : [],
  )

  const [headerVars, setHeaderVars] = useState<EnvVar[]>(
    initialData && initialData.config && initialData.config.headers
      ? Object.entries(initialData.config.headers).map(([key, value]) => ({ key, value }))
      : [],
  )

  const [isRequestOptionsExpanded, setIsRequestOptionsExpanded] = useState<boolean>(false)
  const [showSecurityMenu, setShowSecurityMenu] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!initialData
  const securityMenuRef = useRef<HTMLDivElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  // Transform space-separated arguments string into array
  const handleArgsChange = (value: string) => {
    const args = value.split(' ').filter((arg) => arg.trim() !== '')
    setFormData({ ...formData, arguments: value, args })
  }

  const updateServerType = (type: 'stdio' | 'sse' | 'streamable-http' | 'openapi') => {
    setServerType(type);
    setFormData(prev => ({ ...prev, type }));
  }

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index][field] = value
    setEnvVars(newEnvVars)
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    const newEnvVars = [...envVars]
    newEnvVars.splice(index, 1)
    setEnvVars(newEnvVars)
  }

  const handleHeaderVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const newHeaderVars = [...headerVars]
    newHeaderVars[index][field] = value
    setHeaderVars(newHeaderVars)
  }

  const addHeaderVar = () => {
    setHeaderVars([...headerVars, { key: '', value: '' }])
  }

  const removeHeaderVar = (index: number) => {
    const newHeaderVars = [...headerVars]
    newHeaderVars.splice(index, 1)
    setHeaderVars(newHeaderVars)
  }

  // Handle options changes
  const handleOptionsChange = (field: 'timeout' | 'resetTimeoutOnProgress' | 'maxTotalTimeout', value: number | boolean | undefined) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [field]: value
      }
    }))
  }

  // Handle click outside to close security menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (securityMenuRef.current && !securityMenuRef.current.contains(event.target as Node)) {
        setShowSecurityMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Submit handler for server configuration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      const env: Record<string, string> = {}
      envVars.forEach(({ key, value }) => {
        if (key.trim()) {
          env[key.trim()] = value
        }
      })

      const headers: Record<string, string> = {}
      headerVars.forEach(({ key, value }) => {
        if (key.trim()) {
          headers[key.trim()] = value
        }
      })

      // Prepare options object, only include defined values
      const options: any = {}
      if (formData.options?.timeout && formData.options.timeout !== 60000) {
        options.timeout = formData.options.timeout
      }
      if (formData.options?.resetTimeoutOnProgress) {
        options.resetTimeoutOnProgress = formData.options.resetTimeoutOnProgress
      }
      if (formData.options?.maxTotalTimeout) {
        options.maxTotalTimeout = formData.options.maxTotalTimeout
      }

      const payload = {
        name: formData.name,
        config: {
          type: serverType, // Always include the type
          ...(serverType === 'openapi'
            ? {
              openapi: (() => {
                const openapi: any = {
                  version: formData.openapi?.version || '3.1.0'
                };

                // Add URL or schema based on input mode
                if (formData.openapi?.inputMode === 'url') {
                  openapi.url = formData.openapi?.url || '';
                } else if (formData.openapi?.inputMode === 'schema' && formData.openapi?.schema) {
                  try {
                    openapi.schema = JSON.parse(formData.openapi.schema);
                  } catch (e) {
                    throw new Error('Invalid JSON schema format');
                  }
                }

                // Add security configuration if provided
                if (formData.openapi?.securityType && formData.openapi.securityType !== 'none') {
                  openapi.security = {
                    type: formData.openapi.securityType,
                    ...(formData.openapi.securityType === 'apiKey' && {
                      apiKey: {
                        name: formData.openapi.apiKeyName || '',
                        in: formData.openapi.apiKeyIn || 'header',
                        value: formData.openapi.apiKeyValue || ''
                      }
                    }),
                    ...(formData.openapi.securityType === 'http' && {
                      http: {
                        scheme: formData.openapi.httpScheme || 'bearer',
                        credentials: formData.openapi.httpCredentials || ''
                      }
                    }),
                    ...(formData.openapi.securityType === 'oauth2' && {
                      oauth2: {
                        token: formData.openapi.oauth2Token || ''
                      }
                    }),
                    ...(formData.openapi.securityType === 'openIdConnect' && {
                      openIdConnect: {
                        url: formData.openapi.openIdConnectUrl || '',
                        token: formData.openapi.openIdConnectToken || ''
                      }
                    })
                  };
                }

                return openapi;
              })(),
              ...(Object.keys(headers).length > 0 ? { headers } : {})
            }
            : serverType === 'sse' || serverType === 'streamable-http'
              ? {
                url: formData.url,
                ...(Object.keys(headers).length > 0 ? { headers } : {})
              }
              : {
                command: formData.command,
                args: formData.args,
                env: Object.keys(env).length > 0 ? env : undefined,
              }
          ),
          ...(Object.keys(options).length > 0 ? { options } : {})
        }
      }

      onSubmit(payload)
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* 固定标题 */}
      <div className="bg-white p-8 flex-shrink-0">
        <h2 className="text-xl font-semibold text-[#1E293B]">{modalTitle}</h2>
      </div>
    
      {/* 可滚动的表单内容 */}
      <div className="flex-1 overflow-y-auto px-8">
        {(error || formError) && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
            {formError || error}
          </div>
        )}
    
        <form onSubmit={handleSubmit}>
          {/* 服务器类型 - 独立按钮样式 */}
          <div className="mb-6">
            <label className="block text-[#364052] text-sm mb-6">{t('server.type')}</label>
            <div className="flex gap-2">
              {[
                { value: 'stdio', label: 'STDIO' },
                { value: 'sse', label: 'SSE' },
                { value: 'streamable-http', label: 'Streamable HTTP' },
                { value: 'openapi', label: 'OpenAPI' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateServerType(option.value as any)}
                  className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                    serverType === option.value
                      ? 'bg-[#EEF2FF] text-[#302DF0] '
                      : 'bg-white text-[#676F83] hover:bg-[#EEF2FF]'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
    
          {/* 第一行：服务器名称和介绍 */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="name">
                {t('server.name')}
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                placeholder="e.g.: time-mcp"
                required
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="description">
                {t('server.introduction')}
              </label>
              <input
                type="text"
                name="description"
                id="description"
                className="appearance-none border rounded h-12 w-full py-2 px-3 text-[#364052] form-input"
                placeholder="e.g.: time mcp introduction"
              />
            </div>
          </div>
    
          {/* 根据服务器类型显示不同的表单内容 */}
          {serverType === 'openapi' ? (
            <>
              {/* Input Mode Selection */}
              <div className="mb-8">
                <label className="block text-[#364052] text-sm font-bold mb-3">
                  {t('server.openapi.inputMode')}
                </label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      openapi: { ...prev.openapi!, inputMode: 'url' }
                    }))}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                      formData.openapi?.inputMode === 'url'
                      ? 'bg-[#EEF2FF] text-[#302DF0] '
                      : 'bg-white text-[#676F83] hover:bg-[#EEF2FF]'
                    }`}
                  >
                    {t('server.openapi.inputModeUrl')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      openapi: { ...prev.openapi!, inputMode: 'schema' }
                    }))}
                    className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${
                      formData.openapi?.inputMode === 'schema'
                      ? 'bg-[#EEF2FF] text-[#302DF0] '
                      : 'bg-white text-[#676F83] hover:bg-[#EEF2FF]'
                    }`}
                  >
                    {t('server.openapi.inputModeSchema')}
                  </button>
                </div>
              </div>
    
              {/* URL Input */}
              {formData.openapi?.inputMode === 'url' && (
                <div className="mb-8">
                  <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="openapi-url">
                    {t('server.openapi.specUrl')}
                  </label>
                  <input
                    type="url"
                    name="openapi-url"
                    id="openapi-url"
                    value={formData.openapi?.url || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      openapi: { ...prev.openapi!, url: e.target.value }
                    }))}
                    className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                    placeholder="e.g.: https://api.example.com/openapi.json"
                    required={serverType === 'openapi' && formData.openapi?.inputMode === 'url'}
                  />
                </div>
              )}
    
              {/* Schema Input */}
              {formData.openapi?.inputMode === 'schema' && (
                <div className="mb-8">
                  <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="openapi-schema">
                    {t('server.openapi.schema')}
                  </label>
                  <textarea
                    name="openapi-schema"
                    id="openapi-schema"
                    rows={10}
                    value={formData.openapi?.schema || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      openapi: { ...prev.openapi!, schema: e.target.value }
                    }))}
                    className="appearance-none border rounded w-full py-2 px-3 text-[#364052] font-mono text-sm form-input"
                    placeholder={`{
  "openapi": "3.1.0",
  "info": {
    "title": "API",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "https://api.example.com"
    }
  ],
  "paths": {
    ...
  }
}`}
                    required={serverType === 'openapi' && formData.openapi?.inputMode === 'schema'}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('server.openapi.schemaHelp')}</p>
                </div>
              )}
    
              {/* Security Configuration */}
              <div className="mb-8">
                <label className="block text-[#364052] text-sm font-bold mb-3">
                  {t('server.openapi.security')}
                </label>
                <div className="relative" ref={securityMenuRef}>
                  <button
                    type="button"
                    onClick={() => setShowSecurityMenu(!showSecurityMenu)}
                    className="w-full h-12 px-3 py-2 text-left bg-white border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between"
                  >
                    <span className="text-[#364052]">
                      {formData.openapi?.securityType === 'none' && t('server.openapi.securityNone')}
                      {formData.openapi?.securityType === 'apiKey' && t('server.openapi.securityApiKey')}
                      {formData.openapi?.securityType === 'http' && t('server.openapi.securityHttp')}
                      {formData.openapi?.securityType === 'oauth2' && t('server.openapi.securityOAuth2')}
                      {formData.openapi?.securityType === 'openIdConnect' && t('server.openapi.securityOpenIdConnect')}
                    </span>
                  </button>
                  {showSecurityMenu && (
                    <div className="absolute right-0 top-full w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-10">
                      {[
                        { value: 'none', label: t('server.openapi.securityNone') },
                        { value: 'apiKey', label: t('server.openapi.securityApiKey') },
                        { value: 'http', label: t('server.openapi.securityHttp') },
                        { value: 'oauth2', label: t('server.openapi.securityOAuth2') },
                        { value: 'openIdConnect', label: t('server.openapi.securityOpenIdConnect') }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              openapi: {
                                ...prev.openapi,
                                securityType: option.value as any,
                                url: prev.openapi?.url || ''
                              }
                            }))
                            setShowSecurityMenu(false)
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            formData.openapi?.securityType === option.value
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
    
              {/* HTTP 请求头配置 - 仅对OpenAPI显示 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[#364052] text-sm font-bold">
                    {t('server.headers')}
                  </label>
                  <button
                    type="button"
                    onClick={addHeaderVar}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded text-sm flex items-center btn-primary"
                  >
                    + {t('server.add')}
                  </button>
                </div>
                {headerVars.map((headerVar, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="flex items-center space-x-2 flex-grow">
                      <input
                        type="text"
                        value={headerVar.key}
                        onChange={(e) => handleHeaderVarChange(index, 'key', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder="Authorization"
                      />
                      <span className="flex items-center text-[#364052]">:</span>
                      <input
                        type="text"
                        value={headerVar.value}
                        onChange={(e) => handleHeaderVarChange(index, 'value', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder="Bearer token..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHeaderVar(index)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded text-sm flex items-center justify-center min-w-[56px] ml-2 btn-danger"
                    >
                      - {t('server.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : serverType === 'stdio' ? (
            <>
              {/* 命令和参数 - 仅对STDIO显示 */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="command">
                    {t('server.command')}
                  </label>
                  <input
                    type="text"
                    name="command"
                    id="command"
                    value={formData.command}
                    onChange={handleInputChange}
                    className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                    placeholder="e.g.: npx"
                    required={serverType === 'stdio'}
                  />
                </div>
                <div>
                  <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="arguments">
                    {t('server.arguments')}
                  </label>
                  <input
                    type="text"
                    name="arguments"
                    id="arguments"
                    value={formData.arguments}
                    onChange={(e) => handleArgsChange(e.target.value)}
                    className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                    placeholder="e.g.: -y time-mcp"
                    required={serverType === 'stdio'}
                  />
                </div>
              </div>
    
              {/* 环境变量 - 仅对STDIO显示 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[#364052] text-sm font-bold">
                    {t('server.envVars')}
                  </label>
                  <button
                    type="button"
                    onClick={addEnvVar}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center btn-primary"
                  >
                    + {t('server.add')}
                  </button>
                </div>
                {envVars.map((envVar, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="flex items-center space-x-2 flex-grow">
                      <input
                        type="text"
                        value={envVar.key}
                        onChange={(e) => handleEnvVarChange(index, 'key', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder={t('server.key')}
                      />
                      <span className="flex items-center text-[#364052]">:</span>
                      <input
                        type="text"
                        value={envVar.value}
                        onChange={(e) => handleEnvVarChange(index, 'value', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder={t('server.value')}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeEnvVar(index)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center justify-center min-w-[56px] ml-2 btn-danger"
                    >
                      - {t('server.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* URL输入框 - 仅对SSE和Streamable HTTP显示 */}
              <div className="mb-8">
                <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="url">
                  {t('server.url')}
                </label>
                <input
                  type="url"
                  name="url"
                  id="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                  placeholder={serverType === 'sse' ? "e.g.: http://localhost:3000/sse" : "e.g.: http://localhost:3000/mcp"}
                  required={serverType === 'sse' || serverType === 'streamable-http'}
                />
              </div>
    
              {/* 自定义请求头 - 仅对SSE和Streamable HTTP显示 */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[#364052] text-sm font-bold">
                    {t('server.headers')}
                  </label>
                  <button
                    type="button"
                    onClick={addHeaderVar}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center btn-primary"
                  >
                    + {t('server.add')}
                  </button>
                </div>
                {headerVars.map((headerVar, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <div className="flex items-center space-x-2 flex-grow">
                      <input
                        type="text"
                        value={headerVar.key}
                        onChange={(e) => handleHeaderVarChange(index, 'key', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder="Authorization"
                      />
                      <span className="flex items-center text-[#364052]">:</span>
                      <input
                        type="text"
                        value={headerVar.value}
                        onChange={(e) => handleHeaderVarChange(index, 'value', e.target.value)}
                        className="appearance-none border h-12 rounded py-2 px-3 text-[#364052] w-1/2 form-input"
                        placeholder="Bearer token..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeHeaderVar(index)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-1 px-2 rounded text-sm flex items-center justify-center min-w-[56px] ml-2 btn-danger"
                    >
                      - {t('server.remove')}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
    
          {/* Request Options Configuration */}
          {serverType !== 'openapi' && (
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setIsRequestOptionsExpanded(!isRequestOptionsExpanded)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <span>{t('server.requestOptions')}</span>
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isRequestOptionsExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
    
              {isRequestOptionsExpanded && (
                <div className="border border-gray-200 rounded-b p-4 bg-gray-50 border-t-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="timeout">
                        {t('server.timeout')}
                      </label>
                      <input
                        type="number"
                        id="timeout"
                        value={formData.options?.timeout || 60000}
                        onChange={(e) => handleOptionsChange('timeout', parseInt(e.target.value) || 60000)}
                        className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                        placeholder="30000"
                        min="1000"
                        max="300000"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('server.timeoutDescription')}</p>
                    </div>
    
                    <div>
                      <label className="block text-[#364052] text-sm font-bold mb-3" htmlFor="maxTotalTimeout">
                        {t('server.maxTotalTimeout')}
                      </label>
                      <input
                        type="number"
                        id="maxTotalTimeout"
                        value={formData.options?.maxTotalTimeout || ''}
                        onChange={(e) => handleOptionsChange('maxTotalTimeout', e.target.value ? parseInt(e.target.value) : undefined)}
                        className="appearance-none border h-12 rounded w-full py-2 px-3 text-[#364052] form-input"
                        placeholder="Optional"
                        min="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">{t('server.maxTotalTimeoutDescription')}</p>
                    </div>
                  </div>
    
                  <div className="mt-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.options?.resetTimeoutOnProgress || false}
                        onChange={(e) => handleOptionsChange('resetTimeoutOnProgress', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-[#364052] text-sm">{t('server.resetTimeoutOnProgress')}</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      {t('server.resetTimeoutOnProgressDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
    
          {/* 底部留白，避免被固定按钮遮挡 */}
          <div className="h-20"></div>
        </form>
      </div>
    
      {/* 固定在底部的按钮 */}
      <div className="bg-white p-6 flex justify-end space-x-3 flex-shrink-0">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          onClick={handleSubmit}
          className="px-4 py-2 text-sm bg-[#302DF0] text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          {isEdit ? t('common.save') : t('server.add')}
        </button>
      </div>
    </div>
  )
}

export default ServerForm
