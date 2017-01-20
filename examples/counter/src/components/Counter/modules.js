import createModule from 'create-redux-module';

import {unreliableGetCount} from './countService';

const initialState = {count: 0};

const schema = {

    decrement: (state, action) => ({
        ...state
        ,count: state.count - (action.payload || 1)
    })

    ,increment: (state, action) => ({
        ...state
        ,count: state.count + (action.payload || 1)
    })

    ,incrementBySquare: [
        function (amount) {
            let increment = this.actions.increment;
            return increment(amount * amount);
        }
        ,(state, action) => ({
            ...state
            ,count: state.count + (action.payload || 1)
        })
    ]

    ,incrementAsync: [
        function (amount, delay = 1000) {
            const increment = this.actions.increment;
            return (dispatch) => {
                setTimeout(()=>dispatch(increment(amount)), delay);
            }
        }
    ]

    ,getExternalCount: {
        promise: unreliableGetCount
        ,success: (state, action) => ({...state, count: action.payload})
        ,failure: (state, action) => ({...state, count: 0})
    }
};

export const counter = createModule('counter', schema, initialState, ['decrement']);

export const counter2 = createModule('counter2', schema, initialState, ['decrement']);