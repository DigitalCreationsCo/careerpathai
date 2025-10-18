import { useEffect, useState } from 'react';

interface CheckpointStatus {
  hasCheckpoint: boolean;
  session: {
    id: string;
    threadId: string;
    status: string;
    researchBrief?: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  checkpoint: any;
}

/**
 * Hook to check if a chat has a resumable checkpoint
 */
export function useCheckpoint(chatId: string) {
  const [status, setStatus] = useState<CheckpointStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkForCheckpoint() {
      if (!chatId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/research/checkpoint?chatId=${encodeURIComponent(chatId)}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (mounted) {
          setStatus(data);
          setError(null);
        }
      } catch (err) {
        console.error('Error checking checkpoint:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    checkForCheckpoint();

    return () => {
      mounted = false;
    };
  }, [chatId]);

  return {
    hasCheckpoint: status?.hasCheckpoint ?? false,
    session: status?.session ?? null,
    checkpoint: status?.checkpoint ?? null,
    isLoading,
    error,
  };
}

/**
 * Hook to manage checkpoint-based auto-resume
 */
export function useAutoResumeFromCheckpoint(
  chatId: string,
  onResume: () => void,
  enabled: boolean = true
) {
  const { hasCheckpoint, session, isLoading } = useCheckpoint(chatId);
  const [hasAttemptedResume, setHasAttemptedResume] = useState(false);

  useEffect(() => {
    if (
      enabled &&
      !isLoading &&
      !hasAttemptedResume &&
      hasCheckpoint &&
      session?.status === 'active'
    ) {
      console.log('Auto-resuming from checkpoint for session:', session.id);
      setHasAttemptedResume(true);
      onResume();
    }
  }, [enabled, isLoading, hasCheckpoint, session, hasAttemptedResume, onResume]);

  return {
    hasCheckpoint,
    session,
    isLoading,
    willResume: enabled && hasCheckpoint && !hasAttemptedResume,
  };
}