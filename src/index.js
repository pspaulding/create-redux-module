import snakeCase from 'lodash';

const actionCase = (actionName) => snakeCase(actionName).toUpperCase();

const createModule = (schema = {}, initialState = null, namespace = '') => {

    var actions = {};
    var handlers = {};

    function createActionHandler(actionName) {
        let baseType = actionCase(actionName);

        let actionType = namespace == ''
            ? baseType
            : namespace + '/' + baseType;

        var actionCreator = (...args) => {
            const hasError = args[0] instanceof Error;
            const action = {type: actionType};
            const payload = hasError ? args[0] : args;
            if (payload !== void 0) {
                action.payload = payload.length == 1
                    ? payload[0]
                    : payload;
            }
            if (hasError) action.error = true;
            return action;
        };

        var handler = (state, action) => state;

        var def = schema[actionName];
        if (def === null) {
            // default as above
        } else if (typeof def == 'function') {
            handler = def;
        } else if (Array.isArray(def)) {
            actionCreator = def[0] || actionCreator;
            handler = def[1] || handler;
        } else if (typeof def == 'object'
            && (def.endpoint || def.promise)
        ) {

            if (def.endpoint) {
                // API call
                schema[actionName] = [
                    function (def, actionName, actions, ...args) {
                        var data = def.mapArgs
                            ? def.mapArgs(...args)
                            : args[0];

                        var endpoint = typeof def.endpoint == 'function'
                            ? def.endpoint(...args)
                            : def.endpoint;

                        return function (dispatch) {
                            dispatch(actions[actionName + 'Request']());
                            if (typeof http == 'undefined') {
                                throw new Error('http service needs to be implemented');
                            }
                            return http[def.method || 'get'](
                                    endpoint
                                    ,data
                                )
                                .then(res => dispatch(actions[actionName + 'Success'](res)))
                                .catch(err => dispatch(actions[actionName + 'Failure'](err)));
                        }
                    }.bind(null, def, actionName, actions)
                ];
            } else {
                // promise
                schema[actionName] = [
                    function (def, actionName, actions, ...args) {

                        return function (dispatch) {
                            dispatch(actions[actionName + 'Request']());
                            return def.promise(...args)
                                .then(res => dispatch(actions[actionName + 'Success'](res)))
                                .catch(err => dispatch(actions[actionName + 'Failure'](err)));
                        }
                    }.bind(null, def, actionName, actions)
                ];
            }
            createActionHandler(actionName);

            schema[actionName + 'Request'] =
                (state, action) => Object.assign({}, state, {loading: true, error: null});
            createActionHandler(actionName + 'Request');

            schema[actionName + 'Success'] = [
                function (type, success, result) {
                    var action = {type, payload: result, error: null};
                    if (success) {
                        var evalSuccess = success(result);
                        if (typeof evalSuccess == 'object') {
                            if (evalSuccess.payload !== void 0) {
                                action.payload = evalSuccess.payload;
                            }
                            if (evalSuccess.error !== void 0) {
                                action.error = evalSuccess.error;
                            }
                            if (evalSuccess.meta !== void 0) {
                                action.meta = evalSuccess.meta;
                            }
                        }
                    }
                    return action;
                }.bind(
                    null
                    ,actionCase(actionName + 'Success')
                    ,def.success
                )

                ,(state, action) =>
                    Object.assign({}, state, {loading: false, data: action.payload, error: action.error})
            ];
            createActionHandler(actionName + 'Success');

            schema[actionName + 'Failure'] = [
                function (type, failure, error) {
                    var action = {type, error};
                    failure && failure(error);
                    if (failure) {
                        var evalFailure = failure(error);
                        if (typeof evalFailure == 'object') {
                            if (evalFailure.payload !== void 0) {
                                action.payload = evalFailure.payload;
                            }
                            if (evalFailure.error !== void 0) {
                                action.error = evalFailure.error;
                            }
                            if (evalFailure.meta !== void 0) {
                                action.meta = evalFailure.meta;
                            }
                        }
                    }
                    return action;
                }.bind(
                    null
                    ,actionCase(actionName + 'Failure')
                    ,def.failure
                )

                ,(state, action) =>
                    Object.assign({}, state, {loading: false, error: action.error})
            ];
            createActionHandler(actionName + 'Failure');

            return;
        } else {
            throw new Error('Incorrect schema format, ['
                + actionName + '] must be a handlerFn, array, API object, or null');
        }

        actions[actionName] = actionCreator.bind({
            namespace
            ,baseType
            ,type: actionType
            ,actionName
            ,actions    // reference other actions from this action
        });

        actions[actionName].toString = () => actionType.toString();

        handlers[actionType] = handler;
    }

    Object.keys(schema).forEach(createActionHandler);

    var reducer = (state = initialState, action) => {
        const handler = handlers[action.type];
        return handler ? handler(state, action) : state;
    };

    return {
        actions
        ,reducer
        ,mapDispatch: mapDispatch.bind(null, actions)
    }
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