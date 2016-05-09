import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import { connect, reducer } from 'react-redux-ephemeral';

const globalReducer = combineReducers({
  ephemeral: reducer
});

const store = createStore(globalReducer);

class MyComponent extends Component {
  render() {
    const {
      local: {
        count
      },
      dispatchLocal
    } = this.props;
    return (
      <div>
        <p>Count: { count }</p>
        <button type="button" onClick={() => dispatchLocal({ type: 'INCREASE' })}>
          Increase
        </button>
        <button type="button" onClick={() => dispatchLocal({ type: 'DECREASE' })}>
          Decrease
        </button>
      </div>
    );
  }
}

const localReducer = (state, action) => {
  switch(action.type) {
    case 'INCREASE':
      return {
        ...state,
        count: state.count + 1
      };
    case 'DECREASE':
      return {
        ...state,
        count: state.count - 1
      };
    default:
      return state;
  }
};

const initialState = {
  count: 13
};

const MyConnectedComponent = connect({
  key: 'myComponent',
  reducer: localReducer,
  initialState
})(MyComponent);

ReactDOM.render((
  <Provider store={store}>
    <MyConnectedComponent />
  </Provider>
), document.getElementById('counter-app'));
