import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Server } from '@/types';
import ServerCard from '@/components/ServerCard';
import AddServerForm from '@/components/AddServerForm';
import EditServerForm from '@/components/EditServerForm';
import { useServerData } from '@/hooks/useServerData';
import ToolCard from '@/components/ui/ToolCard';

const ServersPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    servers,
    error,
    setError,
    isLoading,
    handleServerAdd,
    handleServerEdit,
    handleServerRemove,
    handleServerToggle,
    triggerRefresh
  } = useServerData();
  const [editingServer, setEditingServer] = useState<Server | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedServer, setSelectedServer] = useState<Server | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDrawerAnimating, setIsDrawerAnimating] = useState(false);

  const handleEditClick = async (server: Server) => {
    const fullServerData = await handleServerEdit(server);
    if (fullServerData) {
      setEditingServer(fullServerData);
    }
  };

  const handleEditComplete = () => {
    setEditingServer(null);
    triggerRefresh();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      triggerRefresh();
      // Add a slight delay to make the spinner visible
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // 修改 handleCardClick 函数
  const handleCardClick = (server: Server) => {
    setSelectedServer(server);
    setIsDrawerOpen(true);
    // 延迟启动动画，确保DOM已更新
    requestAnimationFrame(() => {
      setIsDrawerAnimating(true);
    });
  };
  
  // 添加关闭抽屉的函数
  const handleCloseDrawer = () => {
    // 先执行关闭动画
    setIsDrawerAnimating(false);
    // 等待动画完成后再隐藏抽屉
    setTimeout(() => {
      setIsDrawerOpen(false);
      setSelectedServer(null);
    }, 300); // 与动画持续时间相同
  };

  const handleToolToggle = async (toolName: string, enabled: boolean) => {
    if (!selectedServer) return;
    
    try {
      const { toggleTool } = await import('@/services/toolService');
      const result = await toggleTool(selectedServer.name, toolName, enabled);
      
      if (result.success) {
        triggerRefresh();
        // Update selected server data
        const updatedServer = servers.find(s => s.name === selectedServer.name);
        if (updatedServer) {
          setSelectedServer(updatedServer);
        }
      }
    } catch (error) {
      console.error('Error toggling tool:', error);
    }
  };

  const handleToolDescriptionUpdate = (toolName: string, description: string) => {
    if (!selectedServer) return;
    
    // Update the tool description in the selected server
    const updatedTools = selectedServer.tools?.map(tool => 
      tool.name === toolName ? { ...tool, description } : tool
    );
    
    setSelectedServer({
      ...selectedServer,
      tools: updatedTools
    });
    
    // Also trigger a refresh to update the main servers list
    triggerRefresh();
  };

  return (
    <div className="relative">
      {/* 固定顶部区域 */}
      <div className="flex justify-between items-center mb-3">
        <h1 className="text-[28px] font-bold text-[#3D3D3D]">{t('pages.servers.title')}</h1>
        <div className="flex gap-2">
          <AddServerForm onAdd={handleServerAdd} />
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`px-4 py-2 text-sm bg-[#302DF0] text-white rounded-lg hover:bg-blue-700 flex items-center transition-all duration-200 ${isRefreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isRefreshing ? (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
            )}
            {t('common.refresh')}
          </button>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div className="max-h-[calc(100vh-80px)] pb-5 pt-5 overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
        <style dangerouslySetInnerHTML={{
          __html: `
            .scrollable-content::-webkit-scrollbar {
              display: none;
            }
          `
        }} />
        
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-sm error-box">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-red-600 text-lg font-medium">{t('app.error')}</h3>
                <p className="text-gray-600 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-4 text-gray-500 hover:text-gray-700 transition-colors duration-200 btn-secondary"
                aria-label={t('app.closeButton')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 011.414 0L10 8.586l4.293-4.293a1 1 111.414 1.414L11.414 10l4.293 4.293a1 1 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 01-1.414-1.414L8.586 10 4.293 5.707a1 1 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white shadow rounded-lg p-6 flex items-center justify-center loading-container">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-blue-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600">{t('app.loading')}</p>
            </div>
          </div>
        ) : servers.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6 empty-state">
            <p className="text-gray-600">{t('app.noServers')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {servers.map((server, index) => (
              <ServerCard
                key={index}
                server={server}
                onRemove={handleServerRemove}
                onEdit={handleEditClick}
                onToggle={handleServerToggle}
                onRefresh={triggerRefresh}
                onClick={handleCardClick}
              />
            ))}
          </div>
        )}
      </div>

      {editingServer && (
        <EditServerForm
          server={editingServer}
          onEdit={handleEditComplete}
          onCancel={() => setEditingServer(null)}
        />
      )}

      {/* Tools Drawer - 带有滑入滑出动画 */}
      {isDrawerOpen && selectedServer && (
        <div className="fixed inset-0 z-40 bg-black/30 overflow-hidden">
          <div 
            className="absolute inset-0" 
            onClick={handleCloseDrawer}
          />
          <div className={`absolute right-0 top-0 h-full w-2/3 bg-white shadow-xl rounded-l-lg transform transition-transform duration-300 ease-in-out ${
            isDrawerAnimating ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedServer.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedServer.tools?.length || 0} {t('server.tools')}
                  </p>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tools List */}
              <div className="flex-1 overflow-y-auto p-6">
                {selectedServer.tools && selectedServer.tools.length > 0 ? (
                  <div className="space-y-4">
                    {selectedServer.tools.map((tool, index) => (
                      <ToolCard 
                        key={index} 
                        server={selectedServer.name} 
                        tool={tool} 
                        onToggle={handleToolToggle}
                        onDescriptionUpdate={handleToolDescriptionUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 mt-8">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>{t('server.noTools')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServersPage;