import React from 'react';
import axios from 'axios';

const Logout = () => {
    const handleLogout = async () => {
        await axios.post('http://localhost:5000/auth/logout');
        window.location.href = '/login';
    };

    return (
        <div>
            <h2>Logout</h2>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Logout;