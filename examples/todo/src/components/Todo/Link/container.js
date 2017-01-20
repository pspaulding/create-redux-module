import {connect} from 'react-redux';
import {visibilityFilter} from '../modules/visibilityFilter';
import Link from '.';

const mapState = (state, ownProps) => ({
    active: ownProps.filter === state.visibilityFilter
});

const Container = connect(
    mapState
    ,visibilityFilter.mapDispatch({
        setVisibilityFilter: {ownProps: 'filter'}
    })
)(Link);

export default Container;