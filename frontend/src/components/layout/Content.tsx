import React, { ReactNode } from 'react';

interface ContentProps {
  children: ReactNode;
}

const Content: React.FC<ContentProps> = ({ children }) => {
  return (
    <main className="h-full">
      <div className="container mx-auto py-6">
        {children}
      </div>
    </main>
  );
};

export default Content;