import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Server } from '@/types'
import { getApiUrl } from '../utils/runtime'
import ServerForm from './ServerForm'

interface EditServerFormProps {
  server: Server
  onEdit: () => void
  onCancel: () => void
}

const EditServerForm = ({ server, onEdit, onCancel }: EditServerFormProps) => {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(true) 
  const [isAnimating, setIsAnimating] = useState(false)

  // 组件挂载时启动动画
  useEffect(() => {
    // 使用 requestAnimationFrame 确保 DOM 已更新
    requestAnimationFrame(() => {
      setIsAnimating(true)
    })
  }, [])

  const handleClose = () => {
    setIsAnimating(false)
    // 等待动画完成后再关闭模态框
    setTimeout(() => {
      setModalVisible(false)
      onCancel()
    }, 300) // 与动画持续时间相同
  }

  const handleSubmit = async (payload: any) => {
    try {
      setError(null)
      const token = localStorage.getItem('mcphub_token');

      // 如果名称发生变化，先检查是否存在重名
      if (payload.name !== server.name) {
        const checkResponse = await fetch(getApiUrl('/servers'), {
          method: 'GET',
          headers: {
            'x-auth-token': token || ''
          }
        });

        if (checkResponse.ok) {
          const checkResult = await checkResponse.json();
          const existingServer = checkResult.data?.find((s: any) => s.name === payload.name);
          
          if (existingServer) {
            setError(t('server.alreadyExists', { serverName: payload.name }));
            return;
          }
        }
      }

      // 如果名称没有变化或者检查通过，继续更新
      const response = await fetch(getApiUrl(`/servers/${server.name}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token || ''
        },
        body: JSON.stringify({
          config: payload.config,
          newName: payload.name !== server.name ? payload.name : undefined
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Use specific error message from the response if available
        if (result && result.message) {
          setError(result.message)
        } else if (response.status === 404) {
          setError(t('server.notFound', { serverName: server.name }))
        } else if (response.status === 400) {
          setError(t('server.invalidData'))
        } else {
          setError(t('server.updateError', { serverName: server.name }))
        }
        return
      }

      // 先启动关闭动画
      setIsAnimating(false)
      // 等待动画完成后再关闭模态框并通知父组件
      setTimeout(() => {
        setModalVisible(false)
        onCancel()
        onEdit() // 在动画完成后再调用
      }, 300) // 与动画持续时间相同
    } catch (err) {
      console.error('Error updating server:', err)
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  // 如果modal不可见，不渲染任何内容
  if (!modalVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex">
      <div 
        className="w-1/3"
        onClick={handleClose}
      ></div>
      <div 
        className={`w-2/3 bg-white overflow-y-auto rounded-l-lg transform transition-transform duration-300 ease-in-out ${isAnimating ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <ServerForm
          onSubmit={handleSubmit}
          onCancel={handleClose}
          initialData={server}
          modalTitle={t('server.editServer')}
          formError={error}
        />
      </div>
    </div>
  )
}

export default EditServerForm