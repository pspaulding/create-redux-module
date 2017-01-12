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
