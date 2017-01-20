import React from 'react';
import './App.css';
import {Provider} from 'react-redux';
import Counters from './components/Counter/container';

const App = ({store}) => (
  <Provider store={store}>
    <Counters />
  </Provider>
);

export default App;
