import React, { Component, PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import hoistStatics from 'hoist-non-react-statics';
import { toEphemeral, createEphemeral, destroyEphemeral } from './actions';
import { shallowEqual } from './utils';

const defaultMapDispatchToProps = {};
function defaultMergeProps(dispatchProps, ephemeralProps, ownProps) {
  return {
    ...ownProps,
    ...ephemeralProps,
    ...dispatchProps
  };
}

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default function connect(config = {}) {
  const {
    key,
    reducer,
    initialState,
    mapDispatchToProps = defaultMapDispatchToProps,
    mergeProps = defaultMergeProps
  } = config;

  if (typeof key !== 'string' && typeof key !== 'function') {
    /* eslint-disable no-console */
    console.error(
      'Must provide the connect decorator a key ' +
      'as a string or as a function of props.'
    );
    /* eslint-enable no-console */
  }

  if (typeof reducer !== 'function') {
    /* eslint-disable no-console */
    console.error('Must provide the connect decorator a reducer function.');
    /* eslint-enable no-console */
  }

  const isMapDispatchToPropsAFunction = typeof mapDispatchToProps === 'function';
  const doDispatchPropsDependOnOwnProps = (
    isMapDispatchToPropsAFunction &&
    mapDispatchToProps.length >= 2
  );

  return function wrapComponentWithEphemeralConnect(WrappedComponent) {
    class Ephemeral extends Component {

      constructor(props, context) {
        super(props, context);
        this.state = {};
        this.store = props.store || context.store;
        this.haveOwnPropsChanged = true;
        this.haveDispatchPropsChanged = true;
        this.hasLocalStateChanged = true;
        this.updateLocalState = this.updateLocalState.bind(this);
        this.dispatchLocal = this.dispatchLocal.bind(this);
      }

      componentWillMount() {
        this.setKey();
        this.mountEphemeral();
        this.initializeDispatchProps();
        this.updateLocalState();
        this.unsubscribe = this.store.subscribe(this.updateLocalState);
      }

      componentWillReceiveProps(nextProps) {
        if (!shallowEqual(this.props, nextProps)) {
          this.haveOwnPropsChanged = true;
        }
      }

      shouldComponentUpdate() {
        return this.haveOwnPropsChanged || this.hasLocalStateChanged;
      }

      componentWillUnmount() {
        this.unmountEphemeral();
        this.unsubscribe();
      }

      setKey() {
        this.key = (typeof key === 'function') ? key(this.props) : key;
        if (process.env.NODE_ENV !== 'production') {
          if (this.store.getState().ephemeral.__meta__[this.key] > 0) { // eslint-disable-line max-len, no-underscore-dangle
            /* eslint-disable no-console */
            console.warn(
              'Multiple components have local state mounted at the same key. ' +
              'This is allowed, but the components will share state. Any actions ' +
              'dispatched by one of these components will affect the state of all ' +
              'other components with state mounted at the same key. This may ' +
              'produce undesirable behavior.'
            );
            /* eslint-enable no-console */
          }
        }
      }

      mountEphemeral() {
        const {
          getState,
          dispatch
        } = this.store;
        const stateAtKey = getState().ephemeral[this.key];
        const isKeyAlreadyMounted = stateAtKey !== undefined;
        const initial = (() => {
          if (isKeyAlreadyMounted) return stateAtKey;
          if (initialState !== undefined) return initialState;
          return reducer(initialState, {});
        })();
        const createAction = createEphemeral(this.key, initial);
        dispatch(createAction);
      }

      unmountEphemeral() {
        const destroyAction = destroyEphemeral(this.key);
        this.store.dispatch(destroyAction);
      }

      initializeDispatchProps() {
        if (typeof mapDispatchToProps === 'object') {
          this.dispatchProps = bindActionCreators(mapDispatchToProps, this.dispatchLocal);
        } else {
          this.dispatchProps = {};
        }
      }

      updateDispatchPropsIfNeeded(ownProps) {
        if (doDispatchPropsDependOnOwnProps && this.haveOwnPropsChanged) {
          const newDispatchProps = mapDispatchToProps(this.dispatchLocal, ownProps);
          if (!shallowEqual(this.dispatchProps, newDispatchProps)) {
            this.dispatchProps = newDispatchProps;
            this.haveDispatchPropsChanged = true;
          }
        }
      }

      updateLocalState() {
        const {
          ephemeral: {
            [this.key]: local
          }
        } = this.store.getState();
        if (!shallowEqual(local, this.state.local)) {
          this.hasLocalStateChanged = true;
        }
        this.setState({
          local
        });
      }

      dispatchLocal(action) {
        const localAction = toEphemeral(this.key, reducer, action);
        this.store.dispatch(localAction);
      }

      updateMergedPropsIfNeeded() {
        this.updateDispatchPropsIfNeeded(this.props);
        if (this.haveOwnPropsChanged ||
          this.haveDispatchPropsChanged ||
          this.hasLocalStateChanged) {
          const { local } = this.state;
          const ephemeralProps = {
            local,
            dispatchLocal: this.dispatchLocal
          };
          const dispatchProps = this.dispatchProps;
          const ownProps = this.props;
          this.mergedProps = mergeProps(dispatchProps, ownProps, ephemeralProps);
          this.haveOwnPropsChanged = false;
          this.haveDispatchPropsChanged = false;
          this.hasLocalStateChanged = false;
        }
      }

      render() {
        this.updateMergedPropsIfNeeded();
        return (
          <WrappedComponent
            { ...this.mergedProps }
          />
        );
      }

    }

    Ephemeral.propTypes = {
      store: PropTypes.object
    };

    Ephemeral.contextTypes = {
      store: PropTypes.object
    };

    Ephemeral.displayName = `Ephemeral(${getDisplayName(WrappedComponent)})`;

    return hoistStatics(Ephemeral, WrappedComponent);
  };
}
