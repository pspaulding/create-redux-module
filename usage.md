If you are unfamiliar with redux, then why are you here? Check out [redux](http://redux.js.org/) and come back when done.

[Examples](https://github.com/pspaulding/create-redux-module/tree/master/examples)

Installation
---
```bash
npm install create-redux-module --save
```

API
---

Given a schema:
```javascript
schema: {
  // shortcut map an action to a handler
  // the action arguments will be mapped to the payload:
  //    one argument => payload = argument
  //    more than one argument => payload = [arguments]
  // action creator will default to:
  // (...args) => ({type:namespace/ACTION_NAME, payload})
  actionName1: (state, action) => {}

  // long version if action creator needs logic or needs to do
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
    // if action creator or handler are null, they will default as above
  ]

  // Promise object
  ,actionName3: {
    promise: (required)
    ,success: (if provided, will be wrapped with an action return)
    ,failure: (if provided, will be wrapped with an action return)
  }
}
```

Call createModule as follows:
```javascript
const module = createModule(moduleName, schema, initialState = null, namespaceActions = false);
/*
{
  actions
  ,reducer
  ,mapDispatch (see walkthrough)
  ,test (see walkthrough)
}
*/
```

Simple Counter Example Walkthrough
---

### Setup Environment And Boilerplate

This example assumes project is setup using create-react-app, but you can use any build environment you want. I tend to use functional react components, but you can use classes or a mix of both as you prefer. I also favor grouping by feature vs file type, but again, do as you please.

Create the example app:
```bash
create-react-app counter-example
cd counter-example
```

Install packages:
```bash
npm install redux react-redux redux-thunk create-redux-module --save
```

Create a rootReducer:
```javascript
// src/components/reducer.js

const rootReducer = state => state; // placeholder

export default rootReducer;
```

Create the store:
```javascript
// src/components/store.js

import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducer';

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

    window.store = store; // dev only

    return store;
};

export default configureStore;
```
Notice that we've attached the redux store to the window object. This is for development purposes only (we'll see why in a bit). I don't know if there are any issues with leaving it like this in a production build, but I conditionally run this line using a webpack `__DEV__` variable in my own setup. Handle it however you see fit.

I've also included the awesome [chrome redux devtools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) in this store config.

Edit the index file:
```javascript
// src/index.js

import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';
import configureStore from './components/store'; // add

const store = configureStore(); // add

ReactDOM.render(
  <App store={store} />, // change
  document.getElementById('root')
);
```

Replace App.js with following:
```javascript
// src/App.js

import React from 'react';
import './App.css';
import {Provider} from 'react-redux';

const App = ({store}) => (
  <Provider store={store}>
    <div>add components here...</div>
  </Provider>
);

export default App;
```

Start app and launch browser:
```bash
npm start
```

### Modules

At this point, all we've done is setup our environment to support react and redux using steps similar to what you would find in any redux tutorial.  Now we will get into adding functionality using create-redux-module.

To start things off, we will create a redux reducer that allows decrementing/incrementing a count:
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {

    decrement: (state, action) => state - 1

    ,increment: (state, action) => state + 1
};

export const counter = createModule('counter', schema, initialState);
```
As I said before, I prefer grouping by feature which means putting my dumb components, containers, modules (reducers) in one folder. As such, I like to use pascal-cased folders under components that contain the modules.js file (among other things). I call it modules.js (plural) because it is more than a reducer (as you will see), and it may export more than one module. You do not have to use this convention, and you can use a Rails approach and group by file type if that's your preference.

Notes:
- The decrement and increment keys in the schema will be how the actions are called in the rest of the application. create-redux-module will convert myVeryUsefulAction to an action type of 'MY_VERY_USEFUL_ACTION'.
- The function following the key is the handler and needs to be a pure function as mandated by [redux](http://redux.js.org/docs/introduction/ThreePrinciples.html). There are two other valid formats for the schema values which we will see later, but if the schema value is a function, the action creator will default to `(...args) => ({type, payload})`.
- If no arguments are supplied when calling the action creator, there will be no payload. If one argument, the payload will be that argument, and if more than one argument, the payload will be an array of the arguments. In general, create-redux-module tries to follow the spirit of [Flux Standard Actions](https://github.com/acdlite/flux-standard-action).
- The first argument to createModule ('counter') is the module name and is used by create-redux-module to optionally namespace actions. It should should be unique within the application (but this is not enforced). create-redux-module originally created application unique IDs automatically, but it seemed like overkill and made the actions as seen in redux devtools less readable.
- The module that is created is simply an object with the following keys: `{actions, reducer, mapDispatch, test}`. The reducer is a combination of all the state handlers, and will simply return the state for any action types that it does not recognize.
- When using create-redux-module, it is very useful to export the entire module (or modules) rather than just the reducer as you would see in other redux examples, but you don't have to do it this way.
- My preference is to NOT export the module as default because there are situations where I may want to export more than one module based on the same schema.

Now, we just need to add the module to our rootReducer:
```javascript
// src/components/reducer.js

import {counter} from './Counter/modules';

const rootReducer = counter.reducer;

export default rootReducer;
```
In theory, we should be good to go. Let's do a quick check and add the following line to the end of the reducer.js file:
```javascript
// ...

window.counter = counter.actions;
```
Since we already exposed the store to the window in store.js, we should be able to open the Chrome Developer Tools console (hereafter, simply called console) and type `counter.increment()` and we should get `Object {type: "INCREMENT"}` in return. Cool. Let's open Redux DevTools, click on the State tab, and issue the following from the console:
```javascript
store.dispatch(counter.increment())
```
...and in Redux DevTools we see that the state is "[object Object]1". Not cool. JavaScript's weak type checking bites again. This happened because we called configureStore from index.js without any arguments, so the inital state defaulted to an empty object. We then tried to update the state by adding 1. Typing `({} + 1)` into the console gives the same result. We could fix this by 1) calling configureStore with a 0, or 2) changing the default to a 0, or 3) not messing with either and realize that we will probably want to use redux's combineReducers later on so that we can keep our modules (and reducers) nicely organized. Easy enough:
```javascript
// src/components/reducer.js

import {combineReducers} from 'redux';
import {counter} from './Counter/modules';

const rootReducer = combineReducers({
    counter: counter.reducer
});

export default rootReducer;
window.counter = counter.actions;
```
It looks better already because we now see that the state has defaulted to `{counter: 0}`. Now when we `store.dispatch(counter.increment())` from the console, we see that the state is indeed `{counter: 1}`. But we can do even better...

### Testing From The Console

create-redux-module includes a `modulesToReducers` helper function which comes with a few benefits. Change the reducer (and get rid of the `window.counter = counter.actions;` line):
```javascript
// src/components/reducer.js

import {combineReducers} from 'redux';
import {modulesToReducers} from 'create-redux-module';
import {counter} from './Counter/modules';

const reducers = modulesToReducers({
    counter
});

const rootReducer = combineReducers(reducers);
export default rootReducer;
```
Now in the console, we can simply type `counter.increment()` and see that Redux DevTools shows the correct state. We no longer need to wrap the action creator with `store.dispatch`. This is nice because we can now easily test our reducers from the console without ever touching the UI.

### Built-In Testing

Notice that when you typed `counter.increment()` in the console, it returned `[0, {"type":"INCREMENT"}, 1]` (or something similar, depending on how many times you've called the action creator). If you guessed that this is a stringified representation of [oldState, action, newState], you'd be right. But we already have the awesome Redux DevTools, how is this useful? Let's go back to our counter module and add the following to the end:
```javascript
// src/components/Counter/modules.js

// ...

counter.test(
    [0, {"type":"INCREMENT"}, 1]
);
```
After a browser refresh, we (hopefully) see...no change. Try modifying the counter schema so that increment is now: `increment: (state, action) => state + 2`. The console now throws an assert error `AssertionError: counter.reducer(0, {"type":"INCREMENT"}) !== 1`. Built-in tests FTW! Go back and fix the increment handler and the error should disappear on the next browser refresh.  Let's try adding another test from the console:
```javascript
counter.decrement()
// [0, {"type":"DECREMENT"}, -1]
```
Simply copy and paste this line into the counter test:
```javascript
// src/components/Counter/modules.js

// ...

counter.test(
    [0, {"type":"INCREMENT"}, 1]
    ,[0, {"type":"DECREMENT"}, -1]
);
```
As with exposing the store to the window object, you may not want to do this in production, or maybe you want to consolidate all the reducer tests in one file, or maybe testing isn't your thing, or this form of testing is beneath you because you use sophisticated test frameworks. Do whatever you want. It's just another tool you can add to your utility belt to easily catch regression errors. Note that this test function only works with single dispatch, synchronous functions. If that doesn't meet your needs, use an actual testing framework like Mocha.

Let's try adding arguments to the action creators:
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {

    decrement: (state, action) => state - (action.payload || 1)

    ,increment: (state, action) => state + (action.payload || 1)
};

export const counter = createModule('counter', schema, initialState);
```
We should be checking if the payload is 0, but this is fine for this example. Now in the console:
```javascript
counter.increment()
// [0, {"type":"INCREMENT"}, 1]
counter.increment(10)
// [1, {"type":"INCREMENT","payload":10}, 11]
counter.decrement(3)
// [11, {"type":"DECREMENT","payload":3}, 8]
```

### Specifying An Action Creator

So far, we've been using create-redux-module's default action creator. Let's add an incrementBySquare action creator. One approach would be:
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {

    // ...

    ,incrementBySquare: [
        function (amount) {
            return {type: this.type, payload: amount * amount};
        }
        ,(state, action) => state + (action.payload || 1)
    ]
};

export const counter = createModule('counter', schema, initialState);
```
Notes:
- When using this array format, the first element will always be the action creator, and the second element will always be the handler. If the first element is undefined, the action creator will default to `(...args) => ({type, payload})` as mentioned earlier. If the second element is undefined, the handler will default to `(state, action) => state`.
- Since arrow functions (() => {}) do not allow binding variables, we need to use a function expression which allows create-redux-module to bind various values to the action creator's `this` operator. Those values are: moduleName (1st argument to createModule), baseType (the type without a namespace), type, actionName, and actions (a reference to the other actions in the schema). Notice that we are using `this.type` for the type. You may try to be clever and guess at the string ('INCREMENT_BY_SQUARE'), but you're better off just using the bound type that is provided by create-redux-module.

### Calling Another Action Creator

You may be wondering, if a reference to the other module actions are bound to the `this` operator, can I call another action creator from the current action creator? Absolutely!
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {

    // ...

    ,incrementBySquare: [
        function (amount) {
            let increment = this.actions.increment;
            return increment(amount * amount);
        }
        ,(state, action) => state + (action.payload || 1)
    ]
};

export const counter = createModule('counter', schema, initialState);
```
Remember to `return` the call to the function since action creators just return action objects. Here, we've returned the default action creator for increment (all we defined for increment was the handler). One thing to note is that the console now logged a test array for the increment function because we're returning the result of that function. If that's not what you want, use the previous example instead.

### Redux-Thunk

Most other redux counter examples that you run across also include an incrementAsync function. Let's give that a try:
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

const initialState = 0;

const schema = {

    // ...

    ,incrementAsync: [
        function (amount, delay = 1000) {
            const increment = this.actions.increment;
            return (dispatch) => {
                setTimeout(()=>dispatch(increment(amount)), delay);
            }
        }
    ]
};

export const counter = createModule('counter', schema, initialState);
```
We are using [redux-thunk](https://github.com/gaearon/redux-thunk) to return a function that includes `dispatch` and `getState` arguments. This gives us the ability to dispatch multiple actions from one action creator, and in this case, to delay the dispatch.

### Promises

Before moving on to the UI, let's try one more example that uses promises. In our components/Counter folder (or perhaps a services folder located at the root), let's create a mock http service.
```javascript
// src/components/Counter/countService.js

// simulate a call to an unreliable service
export const unreliableGetCount = (thisNeedsToWork = false) =>
    new Promise((resolve, reject) => {
        if (thisNeedsToWork || Math.random() > .5) {
            // success
            var count = parseInt(Math.random() * 100, 10);
            setTimeout(() => resolve(count), 3000);
        } else {
            // failure
            setTimeout(() => reject('Unable to reach server'), 3000);
        }
    });
```

Next, we will modify the schema to support our new promise action creator. Since we are dealing with create-redux-module's way of handling promises, we are going to convert our state from an integer to an object with a count property.  We will see that create-redux-module will apply additional pending, args, result, and error properties as well.
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

import {unreliableGetCount} from './countService';

const initialState = {count: 0};

const schema = {

    // ...

    ,getExternalCount: {
        promise: unreliableGetCount
    }
};

export const counter = createModule('counter', schema, initialState);
```
Now when we call `counter.getExternalCount()` from the console and monitor the state in Redux DevTools, we see that create-redux-module has explicitly added a new 'GET_EXTERNAL_COUNT_PENDING' action which is followed by either a 'GET_EXTERNAL_COUNT_SUCCESS' action (if we're lucky), or a 'GET_EXTERNAL_COUNT_FAILURE' action. In addition, the state is augmented with `{pending, args, result, error}`. The expected values in each state are:

| Property | ACTION_PENDING | ACTION_SUCCESS | ACTION_FAILURE |
| -------- | -------------- | -------------- | -------------- |
| pending  | true           | false          | false          |
| args     | [...args]      | [...args]      | [...args]      |
| result   | null           | resolve value  | null           |
| error    | null           | null           | reject value   |

Since our unreliableGetCount service can optionally take an argument,
we see that the argument is added to the args property when we call `counter.getExternalCount(true)`.

We can also optionally supply a success and/or failure property to the schema promise object. Suppose that on success, we want to set the count to the result, and on failure, we want to set the count to 0.
```javascript
// src/components/Counter/modules.js

import createModule from 'create-redux-module';

import {unreliableGetCount} from './countService';

const initialState = {count: 0};

const schema = {

    // ...

    ,getExternalCount: {
        promise: unreliableGetCount
        ,success: (state, action) => ({...state, count: action.payload})
        ,failure: (state, action) => ({...state, count: 0})
    }
};

export const counter = createModule('counter', schema, initialState);
```

### User Interface

OK, time to add a UI to our example. Let start with the dumb component:
```javascript
// src/components/Counter/index.js

import React from 'react';

const Counter = ({count}) => (
    <div>
        <h2>Counter</h2>
        <div>count: {count}</div>
    </div>
);

export default Counter;
```

And the container:
```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import Counter from '.';

export const Container = connect(
    state => ({count: state.counter.count})
    )(Counter);

export default Container;
```

And finally, import the Counter into src/App.js
```javascript
// src/App.js

import React from 'react';
import './App.css';
import {Provider} from 'react-redux';
import Counter from './components/Counter/container';

const App = ({store}) => (
  <Provider store={store}>
    <Counter />
  </Provider>
);

export default App;
```

You should now see the counter in your browser with a count of 0. We haven't added any controls to the page yet, but we can still modify the state as we've already seen. Go ahead and issue a `counter.increment()` from the console to verify everything is working. The fact that redux (with a little help from create-redux-module) let us implement all the logic of our counter example without messing with the UI is, to me, one of the coolest things about redux. Our UI is very loosely coupled to the our reducer logic. Have fun doing that in jQuery.

### Controls

Let's add some controls.
```javascript
// src/components/Counter/index.js

import React from 'react';

const Counter = ({
    count
    ,decrement
    ,increment
}) => (
    <div>
        <h2>Counter</h2>
        <div>count: {count}</div>
        <button onClick={()=>decrement()}>decrement</button>
        <button onClick={()=>increment()}>increment</button>
    </div>
);

export default Counter;
```

```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import {counter} from './modules';
import Counter from '.';

export const Container = connect(
    state => ({count: state.counter.count})
    ,dispatch => ({
        decrement: (amount) => dispatch(counter.actions.decrement(amount))
        ,increment: (amount) => dispatch(counter.actions.increment(amount))
    })
    )(Counter);

export default Container;
```

You should now be able to change the count from the UI or the console and observe everything in Redux DevTools. Thank you redux!

Let's add the rest of our controls to the UI and show a pending message if we getExternalCount:
```javascript
// src/components/Counter/index.js

import React from 'react';

const Counter = ({
    count
    ,pending
    ,decrement
    ,increment
    ,incrementBySquare
    ,incrementAsync
    ,getExternalCount
}) => (
    <div>
        <h2>Counter</h2>
        <div>count: {count}</div>
        <button onClick={()=>decrement()}>decrement</button>
        <button onClick={()=>increment()}>increment</button>
        <button onClick={()=>incrementBySquare(3)}>incrementBySquare (3)</button>
        <button onClick={()=>incrementAsync()}>incrementAsync</button>
        <button onClick={()=>getExternalCount()}>getExternalCount</button>
        {pending && ' pending'}
    </div>
);

export default Counter;
```

```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import {counter} from './modules';
import Counter from '.';

export const Container = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,dispatch => ({
        decrement: (amount) => dispatch(counter.actions.decrement(amount))
        ,increment: (amount) => dispatch(counter.actions.increment(amount))
        ,incrementBySquare: (amount) => dispatch(counter.actions.incrementBySquare(amount))
        ,incrementAsync: (amount) => dispatch(counter.actions.incrementAsync(amount))
        ,getExternalCount: (amount) => dispatch(counter.actions.getExternalCount(amount))
    })
    )(Counter);

export default Container;
```
Again, we can dispatch actions from the UI or the console. Enjoy the awesomeness of it all, I'll wait.

### mapDispatch

One thing that bugs me about the container is that it seems rather verbose. We've already defined the essence of how these actions should work in the modules.js file, but here we are wrapping all the actions in a mapDispatchToProps function which adds very little new information. It's good to understand how standard mapDispatchToProps works if we need it for some weird reason, but is there anything create-redux-module can do to help? Of course...
```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import {counter} from './modules';
import Counter from '.';

export const Container = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,counter.mapDispatch()
    )(Counter);

export default Container;
```
Much better. Notice that mapDispatch is a function, not a property. Now let's pretend that you wanted to pre-bind a value to the increment action from the container rather than hard-coding the value in the UI (seems a little contrived, but this entire example is contrived). You'd have to go back to the previous long-hand version, right? Nope, we can pass an object to the mapDispatch function where the keys are the action creators, and the value is an array of arguments (or just an argument if only one) that will be applied to the action creator. Let's try it:
```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import {counter} from './modules';
import Counter from '.';

export const Container = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,counter.mapDispatch({increment: 10})
    )(Counter);

export default Container;
```

#### mapDispatch with ownProps

Redux's connect function allows for an optional `ownProps` argument. We can do the same thing here. Let's say that we want to add an `increment-amount` attribute to the Counter itself...
```javascript
// src/components/Counter/container.js

import {connect} from 'react-redux';
import {counter} from './modules';
import Counter from '.';

export const Container = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,counter.mapDispatch({increment: {ownProps: 'increment-amount'}})
    )(Counter);

export default Container;
```
```javascript
// src/App.js

import React from 'react';
import './App.css';
import {Provider} from 'react-redux';
import Counter from './components/Counter/container';

const App = ({store}) => (
  <Provider store={store}>
    <Counter increment-amount={5} />
  </Provider>
);

export default App;
```
Awesome!

That just about covers everything. I hope you've had the patience to follow along and get many of your questions answered. I'm going to go grab a beer and... What's that you say? You want to be able to have multiple counters on the same page? Well that's just crazy talk, but if you insist...

### One Schema --> Multiple Modules

Let's go back to the modules file and add a second module:
```javascript
// src/components/Counter/modules.js

// ...
export const counter2 = createModule('counter2', schema, initialState);
```
And we'll have to update the root reducer:
```javascript
// components/reducer.js

import {combineReducers} from 'redux';
import {modulesToReducers} from 'create-redux-module';
import {counter, counter2} from './Counter/modules';

const reducers = modulesToReducers({
    counter
    ,counter2
});

const rootReducer = combineReducers(reducers);
export default rootReducer;
```
Before we go any further, let's make sure everything is working from the console. In Redux DevTools we now see two counters in the raw state panel:
```javascript
{
  counter: {
    count: 0
  },
  counter2: {
    count: 0
  }
}
```
That was easy. And now to try dispatching `counter2.increment()` from the console. Uh oh. It looks like the actions dispatched from one module are affecting both modules. Well, that is the way redux is designed to work (listen for actions that you recognize, pass on the ones you don't recognize). But that's probably not what we want. I suppose we could create a second schema with unique action names (that do the same thing), but that would be silly. Instead, we can easily fix the problem by namespacing the action types.

#### Namespaced Action Types

```javascript
// src/components/Counter/modules.js

// ...
export const counter = createModule('counter', schema, initialState, true);

export const counter2 = createModule('counter2', schema, initialState, true);
```
The 4th parameter set to `true` will result in action types of the form 'counter/INCREMENT', 'counter2/INCREMENT', etc. Just what we want. Now when we try dispatching actions from the console, everything behaves as expected.

And now for some quick updates to the container (which for brevity, we'll change to a combination smart/dumb component) and import React.
```javascript
// src/components/Counter/container.js

import React from 'react';
import {connect} from 'react-redux';
import {counter, counter2} from './modules';
import Counter from '.';

const Counter1 = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,counter.mapDispatch({increment: {ownProps: 'increment-amount'}})
    )(Counter);

const Counter2 = connect(
    state => ({
        count: state.counter2.count
        ,pending: state.counter2.pending
    })
    ,counter2.mapDispatch({increment: {ownProps: 'increment-amount'}})
    )(Counter);

const Counters = () => (
    <div>
        <Counter1 increment-amount={3}/>
        <Counter2 increment-amount={5}/>
    </div>
);

export default Counters;
```

```javascript
// src/App.js

import React from 'react';
import './App.css';
import {Provider} from 'react-redux';
import Counters from './components/Counter/container';

const App = ({store}) => (
  <Provider store={store}>
    <Counters />
  </Provider>
);

export default App;
```
Easy. What if you only wanted to namespace the decrement action, and have the others act globally? We can do that too by passing the name of the action (or array of action names) as the 4th argument.
```javascript
// src/components/Counter/modules.js

// ...
export const counter = createModule('counter', schema, initialState, ['decrement']);

export const counter2 = createModule('counter2', schema, initialState, ['decrement']);
```
Now the decrement actions only affect their own counter, but everything else acts globally. Also notice that increments from the first counter increment both by 3 (if you've been following along), and the second counter increments both by 5.

OK, now I think that's everything. Enjoy!