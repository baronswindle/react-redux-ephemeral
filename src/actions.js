import { MOUNT, UNMOUNT, SET } from './reducer';

export function toEphemeral(key, newState, action) {
  return {
    type: SET,
    payload: {
      ephemeral: {
        key,
        newState,
        action
      }
    }
  };
}

export function createEphemeral(key, initialState) {
  return {
    type: MOUNT,
    payload: {
      ephemeral: {
        key,
        initialState
      }
    }
  };
}

export function destroyEphemeral(key) {
  return {
    type: UNMOUNT,
    payload: {
      ephemeral: {
        key
      }
    }
  };
}
