### This library is no longer maintained.  If you want to use redux, I'd recommend https://redux-toolkit.js.org/

Helper to create redux namespaced action creators & reducers with minimal boilerplate. Easily execute actions and run built-in reducer tests from the console during development, even before creating a UI.

Go from this:
```javascript
const DECREMENT = 'DECREMENT';
const INCREMENT = 'INCREMENT';

function createDecrementAction() {
  return {
    type: DECREMENT
  };
}

function createIncrementAction() {
  return {
    type: INCREMENT
  };
}

export default (state = 0, action) => {
  switch (action.type) {
    case DECREMENT:
      return state - 1;
    case INCREMENT:
      return state + 1;
    default:
      return state;
  }
};
```

To this:
```javascript
import createModule from 'create-redux-module';

const schema = {
  decrement: (state, action) => state - action.payload
  , increment: (state, action) => state + action.payload
};

export const counter = createModule('counter', schema, 0);
```

[Usage](https://github.com/pspaulding/create-redux-module/blob/master/usage.md)

Changes
---

v2.0.0
- Removed Promise object notation.  Unnecessary and easily achieved using Redux-Thunk + async functions.
- Added shorthand to specify actionCreator object properties with an array.
- Now uses immerjs behind the scenes, reducers can return a new state as before (classic), or mutate a draft state which gets converted to a new state by immerjs.
