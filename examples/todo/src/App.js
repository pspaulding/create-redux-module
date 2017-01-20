import React from 'react';
import './App.css';
import {Provider} from 'react-redux';
import TodoLayout from './components/Todo/TodoLayout';

const App = ({store}) => (
  <Provider store={store}>
    <TodoLayout />
  </Provider>
);

export default App;
