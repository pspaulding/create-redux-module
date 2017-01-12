'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.mapDispatch = undefined;

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actionCase = function actionCase(actionName) {
    return (0, _lodash2.default)(actionName).toUpperCase();
};

var createModule = function createModule() {
    var schema = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var initialState = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var namespace = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : '';


    var actions = {};
    var handlers = {};

    function createActionHandler(actionName) {
        var baseType = actionCase(actionName);

        var actionType = namespace == '' ? baseType : namespace + '/' + baseType;

        var actionCreator = function actionCreator() {
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }

            var hasError = args[0] instanceof Error;
            var action = { type: actionType };
            var payload = hasError ? args[0] : args;
            if (payload !== void 0) {
                action.payload = payload.length == 1 ? payload[0] : payload;
            }
            if (hasError) action.error = true;
            return action;
        };

        var handler = function handler(state, action) {
            return state;
        };

        var def = schema[actionName];
        if (def === null) {
            // default as above
        } else if (typeof def == 'function') {
            handler = def;
        } else if (Array.isArray(def)) {
            actionCreator = def[0] || actionCreator;
            handler = def[1] || handler;
        } else if ((typeof def === 'undefined' ? 'undefined' : _typeof(def)) == 'object' && (def.endpoint || def.promise)) {

            if (def.endpoint) {
                // API call
                schema[actionName] = [function (def, actionName, actions) {
                    for (var _len2 = arguments.length, args = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
                        args[_key2 - 3] = arguments[_key2];
                    }

                    var data = def.mapArgs ? def.mapArgs.apply(def, args) : args[0];

                    var endpoint = typeof def.endpoint == 'function' ? def.endpoint.apply(def, args) : def.endpoint;

                    return function (dispatch) {
                        dispatch(actions[actionName + 'Request']());
                        if (typeof http == 'undefined') {
                            throw new Error('http service needs to be implemented');
                        }
                        return http[def.method || 'get'](endpoint, data).then(function (res) {
                            return dispatch(actions[actionName + 'Success'](res));
                        }).catch(function (err) {
                            return dispatch(actions[actionName + 'Failure'](err));
                        });
                    };
                }.bind(null, def, actionName, actions)];
            } else {
                // promise
                schema[actionName] = [function (def, actionName, actions) {
                    for (var _len3 = arguments.length, args = Array(_len3 > 3 ? _len3 - 3 : 0), _key3 = 3; _key3 < _len3; _key3++) {
                        args[_key3 - 3] = arguments[_key3];
                    }

                    return function (dispatch) {
                        dispatch(actions[actionName + 'Request']());
                        return def.promise.apply(def, args).then(function (res) {
                            return dispatch(actions[actionName + 'Success'](res));
                        }).catch(function (err) {
                            return dispatch(actions[actionName + 'Failure'](err));
                        });
                    };
                }.bind(null, def, actionName, actions)];
            }
            createActionHandler(actionName);

            schema[actionName + 'Request'] = function (state, action) {
                return Object.assign({}, state, { loading: true, error: null });
            };
            createActionHandler(actionName + 'Request');

            schema[actionName + 'Success'] = [function (type, success, result) {
                var action = { type: type, payload: result, error: null };
                if (success) {
                    var evalSuccess = success(result);
                    if ((typeof evalSuccess === 'undefined' ? 'undefined' : _typeof(evalSuccess)) == 'object') {
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
            }.bind(null, actionCase(actionName + 'Success'), def.success), function (state, action) {
                return Object.assign({}, state, { loading: false, data: action.payload, error: action.error });
            }];
            createActionHandler(actionName + 'Success');

            schema[actionName + 'Failure'] = [function (type, failure, error) {
                var action = { type: type, error: error };
                failure && failure(error);
                if (failure) {
                    var evalFailure = failure(error);
                    if ((typeof evalFailure === 'undefined' ? 'undefined' : _typeof(evalFailure)) == 'object') {
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
            }.bind(null, actionCase(actionName + 'Failure'), def.failure), function (state, action) {
                return Object.assign({}, state, { loading: false, error: action.error });
            }];
            createActionHandler(actionName + 'Failure');

            return;
        } else {
            throw new Error('Incorrect schema format, [' + actionName + '] must be a handlerFn, array, API object, or null');
        }

        actions[actionName] = actionCreator.bind({
            namespace: namespace,
            baseType: baseType,
            type: actionType,
            actionName: actionName,
            actions: actions // reference other actions from this action
        });

        actions[actionName].toString = function () {
            return actionType.toString();
        };

        handlers[actionType] = handler;
    }

    Object.keys(schema).forEach(createActionHandler);

    var reducer = function reducer() {
        var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
        var action = arguments[1];

        var handler = handlers[action.type];
        return handler ? handler(state, action) : state;
    };

    return {
        actions: actions,
        reducer: reducer,
        mapDispatch: mapDispatch.bind(null, actions)
    };
};

exports.default = createModule;
var mapDispatch = exports.mapDispatch = function mapDispatch(actions) {
    var binds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    return function (dispatch, ownProps) {
        var actionMap = {};
        Object.keys(actions).forEach(function (actionName) {
            var action = actions[actionName];
            var actionBinds = binds[actionName];
            if (actionBinds) {
                actionBinds = Array.isArray(actionBinds) ? actionBinds : [actionBinds];
                actionBinds.forEach(function (actionBind) {
                    if ((typeof actionBind === 'undefined' ? 'undefined' : _typeof(actionBind)) == 'object' && actionBind.ownProps != null) {
                        action = action.bind(null, ownProps[actionBind.ownProps]);
                    } else {
                        action = action.bind(null, actionBind);
                    }
                });
            }
            actionMap[actionName] = function () {
                return dispatch(action.apply(undefined, arguments));
            };
        });
        return actionMap;
    };
};