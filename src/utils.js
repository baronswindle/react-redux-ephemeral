export function createReducer(initialState, reducerMap) {
  return (state = initialState, action) => {
    const reducer = action && action.hasOwnProperty('type') && reducerMap[action.type];
    return reducer ? reducer(state, action.payload) : state;
  };
}

export function shallowEqual(objA = {}, objB = {}) {
  if (objA === objB) {
    return true;
  }

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) {
    return false;
  }

  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!objB.hasOwnProperty(key) || objA[key] !== objB[key]) {
      return false;
    }
  }

  return true;
}
