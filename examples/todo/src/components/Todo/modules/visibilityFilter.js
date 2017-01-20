import createModule from 'create-redux-module';

const initialState = 'SHOW_ALL';

const schema = {
    setVisibilityFilter: [
        function (filter) {
            return {type: this.type, filter}
        }
        ,(state, action) => action.filter
    ]
};

export const visibilityFilter = createModule('visibilityFilter', schema, initialState);