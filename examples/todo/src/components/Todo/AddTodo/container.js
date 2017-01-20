import {connect} from 'react-redux';
import {todos} from '../modules/todos';
import AddTodo from '.';

const Container = connect(null, todos.mapDispatch())(AddTodo);

export default Container;