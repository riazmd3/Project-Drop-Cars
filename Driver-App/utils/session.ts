import { EventEmitter } from 'events';

class SessionEvents extends EventEmitter {}

export const sessionEvents = new SessionEvents();

export function emitSessionExpired(reason: string = 'Session expired'): void {
  sessionEvents.emit('expired', reason);
}

export function onSessionExpired(listener: (reason: string) => void): () => void {
  sessionEvents.on('expired', listener);
  return () => sessionEvents.off('expired', listener);
}


