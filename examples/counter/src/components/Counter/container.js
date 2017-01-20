import React from 'react';
import {connect} from 'react-redux';
import {counter, counter2} from './modules';
import Counter from '.';

const Counter1 = connect(
    state => ({
        count: state.counter.count
        ,pending: state.counter.pending
    })
    ,counter.mapDispatch({increment: {ownProps: 'increment-amount'}})
    )(Counter);

const Counter2 = connect(
    state => ({
        count: state.counter2.count
        ,pending: state.counter2.pending
    })
    ,counter2.mapDispatch({increment: {ownProps: 'increment-amount'}})
    )(Counter);

const Counters = () => (
    <div>
        <Counter1 increment-amount={3}/>
        <Counter2 increment-amount={5}/>
    </div>
);

export default Counters;