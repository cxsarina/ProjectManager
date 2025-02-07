import { useParams, useNavigate, useLocation } from 'react-router-dom';
import TaskBoard from './TaskBoard';
import { useState, useEffect } from 'react';
import axios from 'axios';
import '../style/project-details.css';

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { state } = useLocation();
    const [project, setProject] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState(null);

    const userRole = state?.userRole;

    useEffect(() => {
        axios.get(`http://localhost:5000/projects/${id}`, { withCredentials: true })
            .then(response => {
                setProject(response.data);
                setNewName(response.data.name);
            })
            .catch(error => {
                console.error('Error fetching project:', error);
                setError('Failed to load project details');
            });
    }, [id]);

    const handleEdit = () => {
        axios.put(`http://localhost:5000/projects/${id}`, { name: newName }, { withCredentials: true })
            .then(() => {
                setIsEditing(false);
                setProject(prevProject => ({ ...prevProject, name: newName }));
            })
            .catch(error => console.error('Error editing project:', error));
    };

    if (error) return <div>{error}</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div className="project-details-container">
            <button onClick={() => navigate('/')} className="go-home-btn">Go to Home</button>

            <div className="project-header">
                {!isEditing ? (
                    <>
                        <h1>{project.name}</h1>
                        <button onClick={() => setIsEditing(true)}>Edit</button>
                    </>
                ) : (
                    <>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                        <button onClick={handleEdit}>Save</button>
                        <button onClick={() => setIsEditing(false)}>Cancel</button>
                    </>
                )}
            </div>

            <TaskBoard projectId={project.id} userRole={userRole} /> {/* Передача userRole */}
        </div>
    );
};

export default ProjectDetails;
