# react-redux-ephemeral
React binding for local, ephemeral Redux state management. A lot like [react-redux](https://github.com/reactjs/react-redux), except `react-redux-ephemeral` dynamically mounts and unmounts reducers at keys you specify.


## Usage

[Check out this simple, runnable example.](examples/simple.js)

## API

The component returned by `connect()` expects to be passed the redux store as a prop or through context. You also must mount our reducer at the `ephemeral` key of your root reducer.

### `connect({ key, reducer, [initialState], [mapDispatchToProps], [mergeProps] })(Component)`

#### Arguments
  - `key` **Required**
    * *String*: Specifies the key on `state.ephemeral` where the component's local state will be mounted.
    * *Function*: `id(props) -> String`. Accepts the component's props as an argument and returns a string that specifies the key on `state.ephemeral` where the component's local state will be mounted.
  - `reducer` **Required**
    * *Function*: `reducer(state, action) -> newState`. Reducer that accepts the local state and action as arguments and returns the new local state.
  - [`initialState`]
    * *Function*: `initialState(props) -> value`. Accepts the component's props as an argument and returns the initial value of the component's local state.
    * *Value*: The initial value of the component's local state. If you don't define this here, be sure to handle the possibility of undefined initial state when you write your reducer.
  - [`mapDispatchToProps`]
    * *Function*: `mapDispatchToProps(localDispatch, ownProps) -> dispatchProps`.
    * *Object*
    * This function/object works exactly like [`mapDispatchToProps` in the `react-redux` library](https://github.com/reactjs/react-redux/blob/master/docs/api.md#arguments).
  - [`mergeProps`]
    * *Function*: `mergeProps(dispatchProps, ephemeralProps, ownProps) -> mergedProps`. This function receives as arguments the result of `mapDispatchToProps`, the value stored at `state.ephemeral[key]`, and the props passed to the component by its parent. If you don't pass your own function as an argument to `connect`, it returns `Object.assign({}, ownProps, ephemeralProps, dispatchProps)` by default.


## Purpose

If you've built an app of significant size using React and Redux, you likely have struggled with the problem of managing state that is specific to a particular instance of a component. For example, imagine you're building a shopping cart, and each item in the cart has its own component. Each component has a toggleable description. Where should you store the values that represent whether each item's description is expanded or collapsed? Two options come to mind immediately - in the Redux store and in the tab component's state (i.e., `this.state`).

Using component state (i.e., `this.state`) is the simpler solution. With the exception of stateless components, all React components come with `this.state` and `this.setState()` out of the box. That means you don't have to do much internal plumbing to manage an individual component's state. It just kind of works. The problem with this approach is that you lose some of the benefits Redux provides with respect to both functionality and developer experience (particularly the awesome devtools).

Using Redux store has a strong conceptual appeal but it raises some daunting practical challenges. First, Redux requires that you define your reducers at the beginning of the app's lifecycle, but you don't always know how many instances of a component you'll have to manage state for at runtime. Additionally, it's your responsibility to initialize/teardown the state when the component mounts/unmounts. Implementing this kind of dynamism in your reducers can be very tedious. It becomes even more tedious when you have hundreds of "local" state variables to keep track of. Namespacing your actions becomes a challenge, and your reducers get bloated. Essentially, you're polluting the global state to manipulate and keep track of values that are local concerns.

Because I thought each of these options had significant flaws, I decided to develop a solution that offered more benefits with fewer drawbacks. In particular, I was looking for the following features:
  - State changes should dispatch actions to the global store to allow for action logging and undo/redo/replay.
  - These actions should be locally namespaced. That is, `ComponentA` and `ComponentB` both should be able to register actions with type `TOGGLE_BUTTON`, and when `ComponentA` dispatches that action, the reducer should be able to recognize that this `TOGGLE_BUTTON` was dispatched by `ComponentA` and only update the slice of state that belongs to `ComponentA`.
  - State should initialize on component mount and reset on unmount, unless otherwise specified. In other words, component state should be "ephemeral" by default. Hence, the name `react-redux-ephemeral`.
  - It should be easy to read component-specific state from the global state tree.

With these challenges and goals in mind, I set out to build this library.


## License
MIT
