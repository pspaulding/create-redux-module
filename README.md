Short-term TODOs:
- [ ] API object is currently disabled while I refactor to make more generic
- [ ] Better documentation

Given a schema:
```javascript
schema: {
  // shortcut map an action to a reducer
  // the action arguments will be mapped to the payload:
  //    one argument => payload = argument
  //    more than one argument => payload = [arguments]
  // actionCreator will default to:
  // (...args) => ({type:namespace/ACTION_NAME, payload})
  actionName1: (state, action) => {}

  // long version if actionCreator needs logic or needs to do
  // multiple dispatches, thunks, or call other actions
  ,actionName2: [
    // action creator
    // this must be a function expression (arrow functions will not work)
    // in order to access bound values:
    // {
    //   namespace    (if provided)
    //   ,baseType    (ACTION_NAME)
    //   ,type        (namespace/ACTION_NAME)
    //   ,actionName  (as provided)
    //   ,actions     (ref to other schema actions for additional dispatching)
    // }
    function (arguments) {
      return {type: this.type, payload};
    }
    // handler
    ,(state, action) => {}
    // if actionCreator or handler are null, they will default as above
  ]

  // API object
  ,actionName3: {
    endpoint (required, string or function(args) {return endpoint;})
    ,method: (defaults to get)
    ,mapArgs: (defaults to (data) => data)
    ,success: (if provided, will be wrapped with an action return)
    ,failure: (if provided, will be wrapped with an action return)
  }

  // Promise object
  ,actionName4: {
    promise (required)
    ,success: (if provided, will be wrapped with an action return)
    ,failure: (if provided, will be wrapped with an action return)
  }
}
```

Call createModule as follows:
```javascript
const module = createModule(schema, initialState = null, namespace = '');
/*
{
  actions
  ,reducer
  ,mapDispatch
}
*/
```

Example
---

Given a directory layout:
```javascript
index.js
    /modules
        /reducers
            counter.js
            index.js
    store.js
    /components
        /Counter
            index.js
            Container.js
        App.js
```

```javascript
// modules/reducers/counter.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {
    setCounter: (state, action) => action.payload

    ,decrement: (state, action) => state - action.payload

    ,increment: (state, action) => state + action.payload

    ,incrementAsync: [
        function (amount) {
            const increment = this.actions.increment;
            return function(dispatch) {
                setTimeout(()=>dispatch(increment(amount)), 1000);
            }
        }
    ]
};

export const counter = createModule(schema, initialState);
```

```javascript
// modules/reducers/index.js

import {combineReducers} from 'redux';
import {counter} from './counter';
// ... other modules

const rootReducer = combineReducers({
  counter: counter.reducer
  // other reducers
});

export default rootReducer;
```

```javascript
// modules/store.js

import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducers';

const configureStore = (initialState = {}) => {

    const middleware = [
        thunk
    ];

    const composeEnhancers =
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

    const store = createStore(
        rootReducer
        ,initialState
        ,composeEnhancers(applyMiddleware(...middleware))
    );

    return store;
};

export default configureStore;
```

```javascript
// components/Counter/index.js

import React from 'react';

const Counter = ({count, decrement, increment, incrementAsync}) => (
    <div>
        <h2>Counter</h2>
        <div>count: {count}</div>
        <div>
            <button onClick={()=>decrement(1)}>decrement</button>
            <button onClick={()=>increment(1)}>increment</button>
            <button onClick={()=>incrementAsync(1)}>increment async</button>
        </div>
    </div>
);

export default Counter;
```

```javascript
// components/Counter/Container.js

import {connect} from 'react-redux';
import {counter} from '../../modules/reducers/counter';
import Counter from '.';

const mapStateToProps = state => ({
    count: state.counter
})

const Container = connect(
    mapStateToProps
    ,counter.mapDispatch()
    )(Counter);

export default Container;
```

```javascript
// components/App.js

import React from 'react';
import {Provider} from 'react-redux';
import Counter from './Counter/Container';

const App = ({store}) => (
    <Provider store={store}>
        <Counter />
    </Provider>
);

export default App;
```