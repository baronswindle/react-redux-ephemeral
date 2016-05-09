/* eslint-disable no-underscore-dangle */

import update from 'react-addons-update';
import omit from 'lodash.omit';
import { createReducer } from './utils';

export const MOUNT = 'MOUNT_EPHEMERAL';
export const UNMOUNT = 'UNMOUNT_EPHEMERAL';
export const SET = 'SET_EPHEMERAL';

// Ephemeral reducer

const initialState = {
  __meta__: {}
};

/* eslint-disable no-use-before-define */
const ephemeralReducer = createReducer(initialState, {
  [MOUNT]: mount,
  [UNMOUNT]: unmount,
  [SET]: set
});
/* eslint-enable no-use-before-define */

function mount(state, payload) {
  const {
    ephemeral: {
      key,
      initialState // eslint-disable-line no-shadow
    }
  } = payload;
  return update(state, {
    __meta__: {
      [key]: {
        $apply: x => (x !== undefined ? x + 1 : 1)
      }
    },
    [key]: {
      $set: initialState
    }
  });
}

function unmount(state, payload) {
  const {
    ephemeral: {
      key
    }
  } = payload;
  if (state.__meta__[key] === 1) {
    return {
      ...omit(state, [key]),
      __meta__: omit(state.__meta__, [key])
    };
  }
  return {
    ...state,
    __meta__: {
      ...state.__meta__,
      [key]: state.__meta__[key] - 1
    }
  };
}

function set(state, payload) {
  const {
    ephemeral: {
      action,
      key,
      reducer
    }
  } = payload;
  return update(state, {
    [key]: {
      $apply: stateAtKey => reducer(stateAtKey, action)
    }
  });
}

export default ephemeralReducer;
