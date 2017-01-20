import React from 'react';

const Link = ({active, children, setVisibilityFilter}) => {
    if (active) {
        return <span style={{color:'blue'}}>{children}</span>;
    }

    return (
        <a href="#"
            onClick={e => {
                e.preventDefault();
                setVisibilityFilter();
            }}
        >{children}</a>
    );
};

export default Link;