'use client';

import { ChatConversation, ChatMessage } from '@prisma/client';
import { useSession } from 'next-auth/react';
import * as React from 'react';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from 'react-resizable-panels';

import { cn } from '@/lib/utils';
// Create placeholder files for these components
// import { ConversationList } from './ConversationList'; 
// import { MessageArea } from './MessageArea';

interface ChatLayoutProps {
  defaultLayout: number[] | undefined;
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

type ConversationWithMessages = ChatConversation & {
  messages: ChatMessage[];
};

export const ChatLayout: React.FC<ChatLayoutProps> = ({
  defaultLayout = [265, 440, 655],
  defaultCollapsed = false,
  navCollapsedSize,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
  const { data: session } = useSession();

  // This is where we would fetch conversations and messages
  // For now, we'll use placeholder data
  const conversations: ConversationWithMessages[] = [];

  return (
    <PanelGroup
      direction="horizontal"
      onLayout={(sizes: number[]) => {
        document.cookie = `react-resizable-panels:layout=${JSON.stringify(
          sizes
        )}`;
      }}
      className="h-full max-h-screen items-stretch"
    >
      <Panel
        defaultSize={defaultLayout[0]}
        collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={20}
        maxSize={30}
        onCollapse={() => {
          setIsCollapsed(true);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            true
          )}`;
        }}
        onExpand={() => {
          setIsCollapsed(false);
          document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(
            false
          )}`;
        }}
        className={cn(
          isCollapsed && 'min-w-[50px] transition-all duration-300 ease-in-out'
        )}
      >
        <div className="p-4">Conversations List (placeholder)</div>
      </Panel>
      <PanelResizeHandle />
      <Panel defaultSize={defaultLayout[1]} minSize={30}>
        <div className="p-4">Message Area (placeholder)</div>
      </Panel>
    </PanelGroup>
  );
}; 