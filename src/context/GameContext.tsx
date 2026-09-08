import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useGameState } from '@/hooks/useGameState';
import { IGameState, IPost, IDeal, IGameEvent, IPrivateConversation, ICommentReply } from '@/data/game';

interface GameContextType {
  gameState: IGameState | null;
  posts: IPost[];
  deals: IDeal[];
  events: IGameEvent[];
  conversations: IPrivateConversation[];
  isLoading: boolean;
  startGame: (nickname: string, bio: string, mainCategory: string) => void;
  resetGame: () => void;
  updateGameState: (updater: ((prev: IGameState) => IGameState) | Partial<IGameState>) => void;
  applyPostResult: (post: IPost, income?: number) => void;
  addPost: (post: IPost) => void;
  advanceDay: () => void;
  checkUnlocks: () => void;
  markEventRead: (eventId: string) => void;
  clearEvents: () => void;
  addDeal: (deal: IDeal) => void;
  updateDeal: (dealId: string, updates: Partial<IDeal>) => void;
  applyDealResult: (dealId: string, accepted: boolean, followerChange: number, feedback: string) => void;
  addEvent: (event: IGameEvent) => void;
  updateEvent: (eventId: string, updates: Partial<IGameEvent>) => void;
  addCommentReply: (postId: string, commentId: string, reply: ICommentReply) => void;
  removeCommentReply: (postId: string, commentId: string) => void;
  addFollowUpReply: (postId: string, commentId: string, followUp: { id: string; content: string; timeAgo: string }) => void;
  incrementCommentLikes: (postId: string, commentId: string, delta: number) => void;
  addConversation: (conv: IPrivateConversation) => void;
  markConversationRead: (convId: string) => void;
  sendMessage: (convId: string, content: string) => void;
  appendFanMessage: (convId: string, content: string, read?: boolean) => void;
  blockConversation: (convId: string) => void;
  acceptBusinessFromMessage: (convId: string) => void;
  rejectBusinessFromMessage: (convId: string) => void;
  generateRandomDmConversations: (followers: number, mainCategory: string, recentPostTitle?: string) => void;
  localQualityAssessment: (title: string, content: string, mainCategory: string, verticality: number) => any;
  calculatePostMetrics: (quality: any, followers: number, verticality: number, categoryMatch: any) => any;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const game = useGameState();
  const value = useMemo(() => game, [game]);
  return (
    <GameContext.Provider value={value as GameContextType}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
