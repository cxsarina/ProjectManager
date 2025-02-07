import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useTheme, ThemeProvider } from './context/ThemeContext';
import ProjectList from './components/ProjectList';
import ProjectDetails from './components/ProjectDetails';
import Login from './components/Login';
import { ToastContainer } from 'react-toastify';
import { useState } from 'react';
import axios from 'axios';

const App = () => {
    const { isDarkMode, setIsDarkMode } = useTheme();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const handleLogout = async () => {
        await axios.post('http://localhost:5000/auth/logout', {}, { withCredentials: true });
        setIsLoggedIn(false);
        window.location.href = '/login';
    };

    return (
        <div>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>
                Toggle {isDarkMode ? 'Light' : 'Dark'} Theme
            </button>
            {isLoggedIn && (
                <button onClick={handleLogout} className="logout-btn">Logout</button>
            )}
            <Router>
                <Routes>
                    <Route path="/" element={<ProjectList />} />
                    <Route path="/project/:id" element={<ProjectDetails />} />
                    <Route path="/login" element={<Login onLogin={() => setIsLoggedIn(true)} />} />
                </Routes>
            </Router>
            <ToastContainer />
        </div>
    );
};

const AppWithProvider = () => (
    <ThemeProvider>
        <App />
    </ThemeProvider>
);

export default AppWithProvider;