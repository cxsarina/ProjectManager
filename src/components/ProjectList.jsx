import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../style/project-list.css';

const ProjectList = () => {
    const [projects, setProjects] = useState([]);
    const [newProject, setNewProject] = useState('');
    const [userRole, setUserRole] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await axios.get('http://localhost:5000/auth/me', { withCredentials: true });
                if (response.data) {
                    fetchProjects();
                    setUserRole(response.data.role); // Зберігаємо роль користувача
                }
            } catch (error) {
                navigate('/login');
            }
        };

        checkLoginStatus();
    }, [navigate]);

    const fetchProjects = async () => {
        try {
            const projectsResponse = await axios.get('http://localhost:5000/projects', { withCredentials: true });
            setProjects(projectsResponse.data);
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const handleAddProject = () => {
        if (!newProject.trim()) return;
        axios.post('http://localhost:5000/projects', { name: newProject }, { withCredentials: true })
            .then(response => {
                setProjects([...projects, response.data]);
                setNewProject('');
            })
            .catch(error => console.error('Error adding project:', error));
    };

    const handleDeleteProject = (id) => {
        const confirmed = window.confirm('Are you sure you want to delete this project?');
        if (confirmed) {
            axios.delete(`http://localhost:5000/projects/${id}`, { withCredentials: true })
                .then(() => setProjects(projects.filter(project => project.id !== id)))
                .catch(error => {
                    console.error('Error deleting project:', error);
                });
        }
    };

    return (
        <div className="project-container">
            <h2>Project List</h2>
            {userRole === 'admin' && (
                <div className="project-form">
                    <input
                        type="text"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                        placeholder="Enter project name"
                        className="project-input"
                    />
                    <button onClick={handleAddProject} className="add-project-btn">Add Project</button>
                </div>
            )}
            <ul className="project-list">
                {projects.map((project) => (
                    <li key={project.id} className="project-item">
                        <Link to={`/project/${project.id}`} state={{ userRole }} className="project-link">
                            {project.name}
                        </Link>
                        {userRole === 'admin' && (
                            <button onClick={() => handleDeleteProject(project.id)} className="delete-project-btn">
                                Delete
                            </button>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectList;
