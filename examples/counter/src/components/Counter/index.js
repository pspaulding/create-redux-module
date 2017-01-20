import React from 'react';

const Counter = ({
    count
    ,pending
    ,decrement
    ,increment
    ,incrementBySquare
    ,incrementAsync
    ,getExternalCount
}) => (
    <div>
        <h2>Counter</h2>
        <div>count: {count}</div>
        <button onClick={()=>decrement()}>decrement</button>
        <button onClick={()=>increment()}>increment</button>
        <button onClick={()=>incrementBySquare(3)}>incrementBySquare (3)</button>
        <button onClick={()=>incrementAsync()}>incrementAsync</button>
        <button onClick={()=>getExternalCount()}>getExternalCount</button>
        {pending && ' pending'}
    </div>
);

export default Counter;