import dynamic from 'next/dynamic';
import React from 'react';

// Dynamically import CustomWhiteboard with no SSR
const CustomWhiteboard = dynamic(() => import('./CustomWhiteboard'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col h-full bg-base-100">
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg"></div>
          <span className="text-lg">Loading whiteboard...</span>
        </div>
      </div>
    </div>
  )
});

interface WhiteboardWrapperProps {
  roomId: string;
  username: string;
  socket?: any;
  isActive?: boolean;
}

const WhiteboardWrapper: React.FC<WhiteboardWrapperProps> = (props) => {
  return <CustomWhiteboard {...props} />;
};

export default WhiteboardWrapper;