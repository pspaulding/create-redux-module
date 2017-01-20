import React from 'react';

const AddTodo = ({addTodo}) => {
    let input;

    const submit = e => {
        e.preventDefault();
        if (!input.value.trim()) return;
        addTodo(input.value);
        input.value = '';
    };

    return (
        <div>
            <form onSubmit={submit}>
                <input ref={node => {input = node;}} />
                <button type="submit">Add Todo</button>
            </form>
        </div>
    );
};

export default AddTodo;