import assert from 'assert';
import produce from 'immer';

const actionCase = actionName =>
    actionName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();

const safeParse = str => {
    let value = str;
    try {
        // eval is not evil on data you have control over which should be the case here
        value = eval(`(${str})`);
    } catch (e) {}
    return value;
};

// actionObjectArgs is a representation of actionObject arguments
// (actionType, ['foo', 'bar={baz:1,qaz:2}']) gets transformed to:
//      function (foo, bar = {baz:1, qaz:2}) {
//          return {type: actionType, foo, bar};
//      }
const createActionCreator = (actionType, actionObjectArgs = []) => (...args) => {
    const action = {type: actionType};
    if (args[0] instanceof Error) {
        action.error = true;
        action.payload = args[0];
    } else {
        if (actionObjectArgs.length > 0) {
            actionObjectArgs.forEach((argName, index) => {
                let key = argName;
                let value = args[index];
                if (key.includes('=')) {
                    key = argName.split('=')[0];
                    if (value === void 0) {
                        let v = argName.split('=')[1];
                        value = safeParse(v);
                    }
                }
                action[key] = value;
            });
        } else {
            // just dump everything in a payload property
            if (args.length > 0) {
                if (args.length == 1) {
                    // only one argument, so make it the payload
                    action.payload = args[0];
                } else {
                    // make the payload equal the args array
                    action.payload = args;
                }
            }
        }
    }

    return action;
};

const createModule = (moduleName, schema = {}, initialState = null, namespaceActions = false) => {

    if (typeof moduleName == 'object') {
        throw new Error('createModule was called with arguments of the wrong type.'
            + ' Please update call to (moduleName, schema [, initialState, namespaceActions]).'
        );
    }

    let actions = {};
    let handlers = {};

    function createActionHandler(actionName) {
        let baseType = actionCase(actionName);

        if (typeof namespaceActions == 'string') {
            namespaceActions = [namespaceActions];
        }

        let actionType = namespaceActions === true
            || (Array.isArray(namespaceActions)
                && namespaceActions.indexOf(actionName) > -1)
            ? moduleName + '/' + baseType
            : baseType;

        let actionCreator = createActionCreator(actionType);
        let handler = (state, action) => state;

        let def = schema[actionName];
        if (def === null) {
            // default as above
        } else if (typeof def == 'function') {
            handler = def;
        } else if (Array.isArray(def)) {
            if (def[0]) {
                if (Array.isArray(def[0])) {
                    // ['foo', 'bar={baz:1,qaz:2}']
                    actionCreator = createActionCreator(actionType, def[0]);
                } else if (typeof def[0] == 'function') {
                    // it is an actionCreator function
                    actionCreator = def[0];
                }
            }
            handler = def[1] || handler;
        } else {
            throw new Error('Incorrect schema format, ['
                + actionName
                + '] must be a handlerFn, array, or null');
        }

        actions[actionName] = actionCreator.bind({
            moduleName
            , baseType
            , type: actionType
            , actionName
            , actions    // reference other actions from this action
        });

        actions[actionName].toString = () => actionType.toString();

        handlers[actionType] = handler;
    }

    Object.keys(schema).forEach(createActionHandler);

    let reducer = (state = initialState, action) => {
        const handler = handlers[action.type];
        if (handler) {
            // user immer
            return produce(state, draft => handler(draft, action));
        } else {
            return state;
        }
    };

    // sas = [initialState, action, newState]
    let test = (...sas) => {
        sas.forEach(([initialState, action, newState]) => {
            assert.deepEqual(
                reducer(initialState, action)
                , newState
                , moduleName + '.reducer'
                + `(${JSON.stringify(initialState)}`
                + `, ${JSON.stringify(action)}) !== `
                + `${JSON.stringify(newState)}`
            );
        });
    };

    let module = {
        actions
        , reducer
        , mapDispatch: mapDispatch.bind(null, actions)
        , test
    };
    module.toString = () => moduleName.toString();

    return module;
};

export default createModule;

export const mapDispatch =
    (actions, binds = {}) =>
        (dispatch, ownProps) => {
            const actionMap = {};
            Object.keys(actions).forEach(actionName => {
                let action = actions[actionName];
                let actionBinds = binds[actionName];
                if (actionBinds) {
                    actionBinds = Array.isArray(actionBinds)
                        ? actionBinds : [actionBinds];
                    actionBinds.forEach(actionBind => {
                        if (typeof actionBind == 'object'
                            && actionBind.ownProps != null
                        ) {
                            action = action.bind(null, ownProps[actionBind.ownProps])
                        } else {
                            action = action.bind(null, actionBind);
                        }
                    });
                }
                actionMap[actionName] = (...args) =>
                    dispatch(action(...args));
            });
            return actionMap;
        };

export const modulesToReducers = modules => {

    let reducers = {};
    for (let moduleName in modules) {
        reducers[moduleName] = modules[moduleName].reducer;

        if (typeof window == 'undefined') continue;
        let safeModuleName = moduleName == 'location' ? '_location' : moduleName;
        window[safeModuleName] = {};
        Object.keys(modules[moduleName].actions).forEach(actionName => {
            window[safeModuleName][actionName] = function (...args) {
                if (window.store) {
                    let initialState = store.getState()[moduleName];
                    let actionObject = modules[moduleName].actions[actionName](...args);
                    window.store.dispatch(actionObject);
                    let newState = store.getState()[moduleName];
                    if (typeof actionObject !== 'function') { // don't attempt logging with redux-thunks
                        // use this for quick built-in tests :)
                        console.log(
                            `[${JSON.stringify(initialState)}`
                            + `, ${JSON.stringify(actionObject)}`
                            + `, ${JSON.stringify(newState)}]`
                        );
                    }
                } else {
                    console.warn('Unable to dispatch actions from console.'
                        + ' Please attach the store to the window object'
                        + ' when initializing the store (window.store = store)'
                        + ' during development.'
                    );
                }
            };
        });
    }

    if (Object.keys(reducers).length == 0) {
        // create a default reducer
        reducers.default = state => null;
    }

    return reducers;
};