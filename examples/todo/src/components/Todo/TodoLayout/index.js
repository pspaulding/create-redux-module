import React from 'react';
import AddTodo from '../AddTodo/container';
import TodoList from '../TodoList/container';
import Footer from '../Footer';

const TodoLayout = () => (
    <div>
        <h2>TODO</h2>
        <AddTodo/>
        <TodoList/>
        <Footer/>
    </div>
);

export default TodoLayout;