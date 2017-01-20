import {combineReducers} from 'redux';
import {modulesToReducers} from 'create-redux-module';
import {todos} from './Todo/modules/todos';
import {visibilityFilter} from './Todo/modules/visibilityFilter';

const reducers = modulesToReducers({
    todos
    ,visibilityFilter
});

const rootReducer = combineReducers(reducers);
export default rootReducer;
