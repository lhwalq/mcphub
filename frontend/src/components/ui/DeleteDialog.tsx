import { useTranslation } from 'react-i18next'

interface DeleteDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serverName: string
  isGroup?: boolean
}

const DeleteDialog = ({ isOpen, onClose, onConfirm, serverName, isGroup = false }: DeleteDialogProps) => {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            {isGroup ? t('groups.confirmDelete') : t('server.confirmDelete')}
          </h3>
          <p className="text-gray-500 mb-6">
            {isGroup
              ? t('groups.deleteWarning', { name: serverName })
              : t('server.deleteWarning', { name: serverName })}
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-1 text-sm text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-md transition-colors duration-200"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteDialog