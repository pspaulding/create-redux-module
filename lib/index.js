'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.modulesToReducers = exports.mapDispatch = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _assert = require('assert');

var _assert2 = _interopRequireDefault(_assert);

var _immer = require('immer');

var _immer2 = _interopRequireDefault(_immer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actionCase = function actionCase(actionName) {
    return actionName.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase();
};

var safeParse = function safeParse(str) {
    var value = str;
    try {
        // eval is not evil on data you have control over which should be the case here
        value = eval('(' + str + ')');
    } catch (e) {}
    return value;
};

// actionObjectArgs is a representation of actionObject arguments
// (actionType, ['foo', 'bar={baz:1,qaz:2}']) gets transformed to:
//      function (foo, bar = {baz:1, qaz:2}) {
//          return {type: actionType, foo, bar};
//      }
var createActionCreator = function createActionCreator(actionType) {
    var actionObjectArgs = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    return function () {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        var action = { type: actionType };
        if (args[0] instanceof Error) {
            action.error = true;
            action.payload = args[0];
        } else {
            if (actionObjectArgs.length > 0) {
                actionObjectArgs.forEach(function (argName, index) {
                    var key = argName;
                    var value = args[index];
                    if (key.includes('=')) {
                        key = argName.split('=')[0];
                        if (value === void 0) {
                            var v = argName.split('=')[1];
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
};

var createModule = function createModule(moduleName) {
    var schema = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var initialState = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var namespaceActions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;


    if ((typeof moduleName === 'undefined' ? 'undefined' : _typeof(moduleName)) == 'object') {
        throw new Error('createModule was called with arguments of the wrong type.' + ' Please update call to (moduleName, schema [, initialState, namespaceActions]).');
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
            throw new Error('Incorrect schema format, [' + actionName + '] must be a handlerFn, array, or null');
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
        if (handler) {
            // user immer
            return (0, _immer2.default)(state, function (draft) {
                return handler(draft, action);
            });
        } else {
            return state;
        }
    };

    // sas = [initialState, action, newState]
    var test = function test() {
        for (var _len2 = arguments.length, sas = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            sas[_key2] = arguments[_key2];
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

    var _loop = function _loop(moduleName) {
        reducers[moduleName] = modules[moduleName].reducer;

        if (typeof window == 'undefined') return 'continue';
        var safeModuleName = moduleName == 'location' ? '_location' : moduleName;
        window[safeModuleName] = {};
        Object.keys(modules[moduleName].actions).forEach(function (actionName) {
            window[safeModuleName][actionName] = function () {
                if (window.store) {
                    var _modules$moduleName$a;

                    var initialState = store.getState()[moduleName];
                    var actionObject = (_modules$moduleName$a = modules[moduleName].actions)[actionName].apply(_modules$moduleName$a, arguments);
                    window.store.dispatch(actionObject);
                    var newState = store.getState()[moduleName];
                    if (typeof actionObject !== 'function') {
                        // don't attempt logging with redux-thunks
                        // use this for quick built-in tests :)
                        console.log('[' + JSON.stringify(initialState) + (', ' + JSON.stringify(actionObject)) + (', ' + JSON.stringify(newState) + ']'));
                    }
                } else {
                    console.warn('Unable to dispatch actions from console.' + ' Please attach the store to the window object' + ' when initializing the store (window.store = store)' + ' during development.');
                }
            };
        });
    };

    for (var moduleName in modules) {
        var _ret = _loop(moduleName);

        if (_ret === 'continue') continue;
    }

    if (Object.keys(reducers).length == 0) {
        // create a default reducer
        reducers.default = function (state) {
            return null;
        };
    }

    return reducers;
};