import {connect} from 'react-redux';
import {todos} from '../modules/todos';
import TodoList from '.';

const getVisibleTodos = (todos, filter) => {
    switch (filter) {
        case 'SHOW_ALL':
            return todos;
        case 'SHOW_COMPLETED':
            return todos.filter(todo => todo.completed);
        case 'SHOW_ACTIVE':
            return todos.filter(todo => !todo.completed);
        default:
    }
}

const mapState = state => ({
    todos: getVisibleTodos(state.todos, state.visibilityFilter)
});

const Container = connect(
    mapState
    ,todos.mapDispatch()
)(TodoList);

export default Container;