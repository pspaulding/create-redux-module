import snakeCase from 'lodash.snakecase';
import assert from 'assert';

const actionCase = (actionName) => snakeCase(actionName).toUpperCase();

const createActionCreator = actionType => (...args) => {
    const hasError = args[0] instanceof Error;
    const action = {type: actionType};
    const payload = hasError ? args[0] : args;
    if (payload !== void 0 && payload.length > 0) {
        action.payload = payload.length == 1
            ? payload[0]
            : payload;
    }
    if (hasError) action.error = true;
    return action;
};

function createSchemaPromiseEntry(def, actionName, actions) {
    return [
        function (def, actionName, actions, ...args) {
            return function (dispatch) {
                dispatch(actions[actionName + 'Pending'](args));
                return def.promise(...args)
                    .then(res => dispatch(actions[actionName + 'Success'](res)))
                    .catch(err => dispatch(actions[actionName + 'Failure'](err)));
            }
        }.bind(null, def, actionName, actions)
    ];
}

function createSchemaPendingEntry() {
    return (state, action) => Object.assign(
        {}
        ,state
        ,{
            pending: true
            ,args: action.payload
            ,result: null
            ,error: null
        }
    );
}

function forcePendingToFalse(def) {
    if (typeof def == 'function') {
        return (...args) => {
            let result = def(...args);
            result.pending = false;
            return result;
        };
    } else if (Array.isArray(def) && typeof def[1] == 'function') {
        return [
            def[0]
            ,(...args) => {
                let result = def[1](...args);
                result.pending = false;
                return result;
            }
        ];
    }

    return def;
}

function createSchemaSuccessEntry(def, successActionName) {
    if (def.success) {
        return forcePendingToFalse(def.success);
    }

    return [
        function (type, result) {
            let action = {type, payload: result, pending: false, error: null};
            return action;
        }.bind(
            null
            ,actionCase(successActionName)
        )

        ,(state, action) => Object.assign(
            {}
            ,state
            ,{
                pending: false
                ,result: action.payload
                ,error: action.error
            }
        )
    ];
}

function createSchemaFailureEntry(def, failureActionName) {
    if (def.failure) {
        return forcePendingToFalse(def.failure);
    }

    return [
        function (type, error) {
            let action = {type, pending:false, error};
            return action;
        }.bind(
            null
            ,actionCase(failureActionName)
        )

        ,(state, action) => Object.assign(
            {}
            ,state
            ,{
                pending: false
                ,result: null
                ,error: action.error
            }
        )
    ];
}

/* deprecated 1.0 syntax */
// const createModule = (schema = {}, initialState = null, namespace = '') => {
const createModule = (moduleName, schema = {}, initialState = null, namespaceActions = false) => {

    if (typeof moduleName == 'object') {
        console.warn('createModule was called with what appears to be'
            + ' the deprecated 1.x signature (schema [, initalState , namespace]).'
            + ' Please update usage to the new format (moduleName, schema [, initialState, namespaceActions])'
            + ' before the next major release of create-redux-module.'
            + ' Attempting to convert to new format.'
        );
        let map = {
            schema: moduleName
            ,initialState: schema
            ,namespaceActions: typeof initialState == 'string'
            ,moduleName: typeof initialState == 'string'
                ? initialState
                : 'unknown_module'
        };
        moduleName = map.moduleName;
        schema = map.schema;
        initialState = map.initialState;
        namespaceActions = map.namespaceActions;
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
            actionCreator = def[0] || actionCreator;
            handler = def[1] || handler;
        } else if (typeof def == 'object' && def.promise) {
            schema[actionName] = createSchemaPromiseEntry(def, actionName, actions);
            createActionHandler(actionName);

            let requestActionName = actionName + 'Pending';
            schema[requestActionName] = createSchemaPendingEntry();
            createActionHandler(requestActionName);

            let successActionName = actionName + 'Success';
            schema[successActionName] = createSchemaSuccessEntry(def, successActionName);
            createActionHandler(successActionName);

            let failureActionName = actionName + 'Failure';
            schema[failureActionName] = createSchemaFailureEntry(def, failureActionName);
            createActionHandler(failureActionName);

            return;
        } else {
            throw new Error('Incorrect schema format, ['
                + actionName
                + '] must be a handlerFn, array, API object, Promise object, or null');
        }

        actions[actionName] = actionCreator.bind({
            moduleName
            ,baseType
            ,type: actionType
            ,actionName
            ,actions    // reference other actions from this action
        });

        actions[actionName].toString = () => actionType.toString();

        handlers[actionType] = handler;
    }

    Object.keys(schema).forEach(createActionHandler);

    let reducer = (state = initialState, action) => {
        const handler = handlers[action.type];
        return handler ? handler(state, action) : state;
    };

    // sas = [initialState, action, newState]
    let test = (...sas) => {
        sas.forEach(([initialState, action, newState]) => {
            assert.deepEqual(
                reducer(initialState, action)
                ,newState
                ,moduleName + '.reducer'
                    + `(${JSON.stringify(initialState)}`
                    + `, ${JSON.stringify(action)}) !== `
                    + `${JSON.stringify(newState)}`
                );
        });
    };

    let module = {
        actions
        ,reducer
        ,mapDispatch: mapDispatch.bind(null, actions)
        ,test
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
    for (let m in modules) {
        reducers[m] = modules[m].reducer;

        let windowName = m == 'location' ? '_location' : m;
        window[windowName] = {};
        Object.keys(modules[m].actions).forEach(actionName => {
            window[windowName][actionName] = function (...args) {
                if (window.store) {
                    let initialState = store.getState()[m];
                    let action = modules[m].actions[actionName](...args);
                    window.store.dispatch(action);
                    let newState = store.getState()[m];
                    if (typeof action !== 'function') {
                        // use this for quick built-in tests :)
                        console.log(
                            `[${JSON.stringify(initialState)}`
                            + `, ${JSON.stringify(action)}`
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
        reducers.default = state => state;
    }

    return reducers;
};