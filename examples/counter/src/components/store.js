import {createStore, applyMiddleware, compose} from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './reducer';

const configureStore = (initialState = {}) => {

    const middleware = [
        thunk
    ];

    const composeEnhancers =
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

    const store = createStore(
        rootReducer
        ,initialState
        ,composeEnhancers(applyMiddleware(...middleware))
    );

    window.store = store; // dev only

    return store;
};

export default configureStore;
