```javascript
schema: {
  decrement: (state, action) => state - 1
  ,increment: [
    function (amount) {
      return {type: this.type, amount};
    }
    ,(state, action) => state + action.payload
  ]
}
initialState: defaults to null
```

- each schema key will become the name of an action (creator) that can
    be used in the UI
- a namespaced actionType will be created for each action
- if <actionName>: handler
    - the actionCreator will default to:
        <actionName> = (...args) => ({type:ACTION_TYPE, payload:...args})
    - if handler is null, it will default to (state, action) => state
- else if <actionName>: [actionCreator, handler]

    - if actionCreator or handler are null, they will default
    as above

    If actionCreator is supplied, the type can be accessed as this.type
    as long as the actionCreator is a function expression (will not
    work with arrow functions).

- else if <actionName>: {api object with endpoint property}
```javascript
api object: {
  endpoint (required, string or function(args) {return endpoint;})
  ,method: (defaults to get)
  ,mapArgs: (defaults to (data) => data)
  ,success: (if provided, will be wrapped with an action return)
  ,failure: (if provided, will be wrapped with an action return)
}
```

returns:
```javascript
{
  actions
  ,reducer
  ,mapDispatch
}
```
