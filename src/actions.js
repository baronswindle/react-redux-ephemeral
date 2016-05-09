import { MOUNT, UNMOUNT, SET } from './reducer';

export function toEphemeral(key, reducer, action) {
  return {
    type: SET,
    payload: {
      ephemeral: {
        action,
        key,
        reducer
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
