import {combineReducers} from 'redux';
import {modulesToReducers} from 'create-redux-module';
import {counter, counter2} from './Counter/modules';

const reducers = modulesToReducers({
    counter
    ,counter2
});

const rootReducer = combineReducers(reducers);
export default rootReducer;
