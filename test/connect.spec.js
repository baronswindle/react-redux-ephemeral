import expect from 'expect';
import React, { Component, PropTypes } from 'react';
import { createStore, combineReducers } from 'redux';
import { Provider } from 'react-redux';
import TestUtils from 'react-addons-test-utils';

import { connect, reducer as ephemeralReducer } from '../src';

describe('connect', function () {
  
  beforeEach(function () {
    expect.spyOn(console, 'error')
  });
   
  afterEach(function () {
    expect.restoreSpies()
  });

  class Local extends Component {
    render() {
      return <div />
    }
  }

  const globalReducer = combineReducers({
    ephemeral: ephemeralReducer
  });

  const localReducer = (state, action) => state;

  it('should require a key as a string or as a function', function () {

    connect({
      reducer: localReducer
    });

    expect(console.error).toHaveBeenCalled();

    connect({
      key: 'key',
      reducer: localReducer
    });

    expect(console.error.calls.length).toEqual(1);

    connect({
      key: () => {},
      reducer: localReducer
    });

    expect(console.error.calls.length).toEqual(1);

  });

  it('should require a reducer function', function () {

    const key = 'key';

    connect({
      key
    });

    expect(console.error).toHaveBeenCalled();

  });

  it('should pass initial state to the child component as a prop', function () {

    const store = createStore(globalReducer);

    const initialState = { test: true };

    const ConnectedLocal = connect({
      key: 'local',
      reducer: localReducer,
      initialState
    })(Local);

    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ConnectedLocal />
      </Provider>
    );

    const stub = TestUtils.findRenderedComponentWithType(tree, Local);

    expect(stub.props.local).toBeAn(Object);
    expect(stub.props.local.test).toBe(true);
    expect(stub.props.local.notTest).toBe(undefined);

  });

  it('should keep local state in the global store at state.ephemeral[key]', function () {

    const store = createStore(globalReducer);

    const key = 'local';
    const initialState = { test: true };

    const ConnectedLocal = connect({
      key,
      reducer: localReducer,
      initialState
    })(Local);

    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ConnectedLocal />
      </Provider>
    );

    const localState = store.getState().ephemeral[key];

    expect(localState).toBeAn(Object);
    expect(localState).toEqual(initialState);

  });

  it('should subscribe connected components to local state changes', function () {

    const store = createStore(globalReducer);

    const key = 'local';
    const localReducer = state => ({ ...state, test: !state.test });
    const initialState = { test: true };

    const ConnectedLocal = connect({
      key,
      reducer: localReducer,
      initialState
    })(Local);

    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ConnectedLocal />
      </Provider>
    );

    const stub = TestUtils.findRenderedComponentWithType(tree, Local);

    expect(stub.props.local.test).toBe(true);
    stub.props.dispatchLocal();
    expect(stub.props.local.test).toBe(false);
    stub.props.dispatchLocal();
    expect(stub.props.local.test).toBe(true);

  });

  it('should pass its props to its child', function () {

    const store = createStore(globalReducer);

    const key = 'local';
    const initialState = { test: true };

    const ConnectedLocal = connect({
      key,
      reducer: localReducer,
      initialState
    })(Local);

    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <ConnectedLocal otherProp="other prop" />
      </Provider>
    );

    const stub = TestUtils.findRenderedComponentWithType(tree, Local);

    expect(stub.props.otherProp).toEqual('other prop');
    expect(stub.props.local).toEqual({
      test: true
    });

  });

  it('should only call mapDispatchToProps if ownProps have changed and mapDispatchToProps accepts ownProps as an argument', function () {
    const store = createStore(globalReducer);

    const key = 'local';
    const initialState = { test: true };

    const doAction = () => {};

    const mapDispatchToProps = expect.createSpy((dispatch, ownProps) => {
      doAction
    }).andCallThrough();

    const ConnectedLocal = connect({
      key,
      reducer: localReducer,
      initialState,
      mapDispatchToProps
    })(Local);

    class Container extends Component {
      constructor() {
        super();
        this.state = {
          test: true,
          redHerring: false
        };
      }

      render() {
        return (
          <ConnectedLocal test={this.state.test} />
        );
      }
    }


    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Container />
      </Provider>
    );

    expect(mapDispatchToProps.calls.length).toBe(1);

    const container = TestUtils.findRenderedComponentWithType(tree, Container);
    const stub = TestUtils.findRenderedComponentWithType(tree, Local);

    container.setState({
      redHerring: true
    });

    expect(mapDispatchToProps.calls.length).toBe(1);

    container.setState({
      test: true
    });

    expect(mapDispatchToProps.calls.length).toBe(1);

    container.setState({
      test: false
    });

    expect(mapDispatchToProps.calls.length).toBe(2);

  });

  it('should handle multiple components mounted at the same key', function () {

    const store = createStore(globalReducer);

    class Container extends Component {
      constructor(props, context) {
        super(props, context);
        this.state = {
          number: [0]
        };
      }

      render() {
        return <div>{this.state.number.map(key => <ConnectedLocal key={key} />)}</div>;
      }
    }

    const key = 'local';
    const localReducer = state => ({ ...state, test: !state.test });
    const initialState = { test: true };

    const ConnectedLocal = connect({
      key,
      reducer: localReducer,
      initialState
    })(Local);

    const tree = TestUtils.renderIntoDocument(
      <Provider store={store}>
        <Container />
      </Provider>
    );

    const container = TestUtils.findRenderedComponentWithType(tree, Container);
    let stub = TestUtils.findRenderedComponentWithType(tree, Local);

    expect (stub.props.local).toEqual({
      test: true
    });

    stub.props.dispatchLocal();

    expect(stub.props.local).toEqual({
      test: false
    });

    container.setState({
      number: [0, 1]
    });

    const [stub1, stub2] = TestUtils.scryRenderedComponentsWithType(tree, Local);

    expect(stub1.props.local).toEqual({
      test: false
    });

    expect(stub2.props.local).toEqual({
      test: false
    });

    stub2.props.dispatchLocal();

    expect(stub1.props.local).toEqual({
      test: true
    });

    expect(stub2.props.local).toEqual({
      test: true
    });

    container.setState({
      number: [0]
    });

    stub = TestUtils.findRenderedComponentWithType(tree, Local);

    expect(stub.props.local).toEqual({
      test: true
    });

    container.setState({
      number: []
    });

    expect(store.getState().ephemeral[key]).toBe(undefined);

  });

});
