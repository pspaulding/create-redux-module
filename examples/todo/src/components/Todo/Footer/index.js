import React from 'react';
import Link from '../Link/container';

const Footer = () => (
    <p>
        Show:
        &nbsp;<Link filter="SHOW_ALL">All</Link>
        &nbsp;<Link filter="SHOW_ACTIVE">Active</Link>
        &nbsp;<Link filter="SHOW_COMPLETED">Completed</Link>
    </p>
);

export default Footer;