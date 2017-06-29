'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.modulesToReducers = exports.mapDispatch = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _lodash = require('lodash.snakecase');

var _lodash2 = _interopRequireDefault(_lodash);

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actionCase = function actionCase(actionName) {
    return (0, _lodash2.default)(actionName).toUpperCase();
};

var createActionCreator = function createActionCreator(actionType) {
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var hasError = args[0] instanceof Error;
        var action = { type: actionType };
        var payload = hasError ? args[0] : args;
        if (payload !== void 0 && payload.length > 0) {
            action.payload = payload.length == 1 ? payload[0] : payload;
        }
        if (hasError) action.error = true;
        return action;
    };
};

function createSchemaPromiseEntry(def, actionName, actions) {
    return [function (def, actionName, actions) {
        for (var _len2 = arguments.length, args = Array(_len2 > 3 ? _len2 - 3 : 0), _key2 = 3; _key2 < _len2; _key2++) {
            args[_key2 - 3] = arguments[_key2];
        }

        return function (dispatch) {
            dispatch(actions[actionName + 'Pending'](args));
            return def.promise.apply(def, args).then(function (res) {
                return dispatch(actions[actionName + 'Success'](res));
            }).catch(function (err) {
                return dispatch(actions[actionName + 'Failure'](err));
            });
        };
    }.bind(null, def, actionName, actions)];
}

function createSchemaPendingEntry() {
    return function (state, action) {
        return Object.assign({}, state, {
            pending: true,
            args: action.payload,
            result: null,
            error: null
        });
    };
}

function forcePendingToFalse(def) {
    if (typeof def == 'function') {
        return function () {
            var result = def.apply(undefined, arguments);
            result.pending = false;
            return result;
        };
    } else if (Array.isArray(def) && typeof def[1] == 'function') {
        return [def[0], function () {
            var result = def[1].apply(def, arguments);
            result.pending = false;
            return result;
        }];
    }

    return def;
}

function createSchemaSuccessEntry(def, successActionName) {
    if (def.success) {
        return forcePendingToFalse(def.success);
    }

    return [function (type, result) {
        var action = { type: type, payload: result, pending: false, error: null };
        return action;
    }.bind(null, actionCase(successActionName)), function (state, action) {
        return Object.assign({}, state, {
            pending: false,
            result: action.payload,
            error: action.error
        });
    }];
}

function createSchemaFailureEntry(def, failureActionName) {
    if (def.failure) {
        return forcePendingToFalse(def.failure);
    }

    return [function (type, error) {
        var action = { type: type, pending: false, error: error };
        return action;
    }.bind(null, actionCase(failureActionName)), function (state, action) {
        return Object.assign({}, state, {
            pending: false,
            result: null,
            error: action.error
        });
    }];
}

/* deprecated 1.0 syntax */
// const createModule = (schema = {}, initialState = null, namespace = '') => {
var createModule = function createModule(moduleName) {
    var schema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var initialState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var namespaceActions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;


    if ((typeof moduleName === 'undefined' ? 'undefined' : _typeof(moduleName)) == 'object') {
        console.warn('createModule was called with what appears to be' + ' the deprecated 1.x signature (schema [, initalState , namespace]).' + ' Please update usage to the new format (moduleName, schema [, initialState, namespaceActions])' + ' before the next major release of create-redux-module.' + ' Attempting to convert to new format.');
        var map = {
            schema: moduleName,
            initialState: schema,
            namespaceActions: typeof initialState == 'string',
            moduleName: typeof initialState == 'string' ? initialState : 'unknown_module'
        };
        moduleName = map.moduleName;
        schema = map.schema;
        initialState = map.initialState;
        namespaceActions = map.namespaceActions;
    }

    var actions = {};
    var handlers = {};

    function createActionHandler(actionName) {
        var baseType = actionCase(actionName);

        if (typeof namespaceActions == 'string') {
            namespaceActions = [namespaceActions];
        }

        var actionType = namespaceActions === true || Array.isArray(namespaceActions) && namespaceActions.indexOf(actionName) > -1 ? moduleName + '/' + baseType : baseType;

        var actionCreator = createActionCreator(actionType);
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
        } else if ((typeof def === 'undefined' ? 'undefined' : _typeof(def)) == 'object' && def.promise) {
            schema[actionName] = createSchemaPromiseEntry(def, actionName, actions);
            createActionHandler(actionName);

            var requestActionName = actionName + 'Pending';
            schema[requestActionName] = createSchemaPendingEntry();
            createActionHandler(requestActionName);

            var successActionName = actionName + 'Success';
            schema[successActionName] = createSchemaSuccessEntry(def, successActionName);
            createActionHandler(successActionName);

            var failureActionName = actionName + 'Failure';
            schema[failureActionName] = createSchemaFailureEntry(def, failureActionName);
            createActionHandler(failureActionName);

            return;
        } else {
            throw new Error('Incorrect schema format, [' + actionName + '] must be a handlerFn, array, API object, Promise object, or null');
        }

        actions[actionName] = actionCreator.bind({
            moduleName: moduleName,
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

    // sas = [initialState, action, newState]
    var test = function test() {
        for (var _len3 = arguments.length, sas = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            sas[_key3] = arguments[_key3];
        }

        sas.forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 3),
                initialState = _ref2[0],
                action = _ref2[1],
                newState = _ref2[2];

            _assert2.default.deepEqual(reducer(initialState, action), newState, moduleName + '.reducer' + ('(' + JSON.stringify(initialState)) + (', ' + JSON.stringify(action) + ') !== ') + ('' + JSON.stringify(newState)));
        });
    };

    var module = {
        actions: actions,
        reducer: reducer,
        mapDispatch: mapDispatch.bind(null, actions),
        test: test
    };
    module.toString = function () {
        return moduleName.toString();
    };

    return module;
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

var modulesToReducers = exports.modulesToReducers = function modulesToReducers(modules) {

    var reducers = {};

    var _loop = function _loop(m) {
        reducers[m] = modules[m].reducer;

        var windowName = m == 'location' ? '_location' : m;
        window[windowName] = {};
        Object.keys(modules[m].actions).forEach(function (actionName) {
            window[windowName][actionName] = function () {
                if (window.store) {
                    var _modules$m$actions;

                    var initialState = store.getState()[m];
                    var action = (_modules$m$actions = modules[m].actions)[actionName].apply(_modules$m$actions, arguments);
                    window.store.dispatch(action);
                    var newState = store.getState()[m];
                    if (typeof action !== 'function') {
                        // use this for quick built-in tests :)
                        console.log('[' + JSON.stringify(initialState) + (', ' + JSON.stringify(action)) + (', ' + JSON.stringify(newState) + ']'));
                    }
                } else {
                    console.warn('Unable to dispatch actions from console.' + ' Please attach the store to the window object' + ' when initializing the store (window.store = store)' + ' during development.');
                }
            };
        });
    };

    for (var m in modules) {
        _loop(m);
    }
    return reducers;
};