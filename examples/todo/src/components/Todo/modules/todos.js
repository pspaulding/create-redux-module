import createModule from 'create-redux-module';

const initialState = [];

let nextTodoId = 0;
const schema = {
    addTodo: [
        function (text) {
            return {
                type: this.type
                ,id: nextTodoId++
                ,text
            };
        }
        ,(state, action) => [
            ...state
            ,{
                id: action.id
                ,text: action.text
                ,completed: false
            }
        ]
    ]

    ,toggleTodo: [
        function (id) {
            return {
                type: this.type
                ,id
            }
        }
        ,(state, action) =>
            state.map(todo => ({
                    id: todo.id
                    ,text: todo.text
                    ,completed: action.id === todo.id
                        ? !todo.completed : todo.completed
                })
            )
    ]
};

export const todos = createModule('todos', schema, initialState);