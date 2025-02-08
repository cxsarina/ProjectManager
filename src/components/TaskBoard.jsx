import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';

const TaskBoard = ({ projectId, userRole }) => {
    const [tasks, setTasks] = useState([]);
    const [filter, setFilter] = useState('All');
    const [newTaskName, setNewTaskName] = useState('');
    const [error, setError] = useState(null);
    const [editingTask, setEditingTask] = useState(null);
    const [editedTaskName, setEditedTaskName] = useState('');

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/tasks?project_id=${projectId}`, { withCredentials: true });
                const tasksWithStringIds = response.data.map(task => ({
                    ...task,
                    id: task.id.toString()
                }));
                setTasks(tasksWithStringIds);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setError('Failed to load tasks');
            }
        };
        fetchTasks();
    }, [projectId]);

    const handleEditTask = (taskId, taskName) => {
        setEditingTask(taskId);
        setEditedTaskName(taskName);
    };

    const handleSaveTask = async (taskId) => {
        try {
            await axios.put(`http://localhost:5000/tasks/${taskId}`, { name: editedTaskName }, { withCredentials: true });
            setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, name: editedTaskName } : task));
            setEditingTask(null);
        } catch (error) {
            console.error('Error updating task name:', error);
        }
    };

    const handleDragEnd = async (result) => {
        const { destination, draggableId } = result;
        if (!destination) return;
        const taskId = draggableId;
        const task = tasks.find(task => task.id === taskId);
        if (!task) return;
        const newStatus = destination.droppableId;
        if (task.status === newStatus) return;
        try {
            await axios.put(`http://localhost:5000/tasks/${taskId}`, { status: newStatus }, { withCredentials: true });
            setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task));
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    const handleDeleteTask = (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            axios.delete(`http://localhost:5000/tasks/${taskId}`, { withCredentials: true })
                .then(() => setTasks(tasks.filter(task => task.id !== taskId)))
                .catch(error => {
                    console.error('Error deleting task:', error);
                    setError('Failed to delete task');
                });
        }
    };

    const handleAddTask = () => {
        if (!newTaskName.trim()) return;
        axios.post('http://localhost:5000/tasks', { name: newTaskName, status: 'To Do', project_id: projectId }, { withCredentials: true })
            .then(response => {
                setTasks([...tasks, response.data]);
                setNewTaskName('');
            })
            .catch(error => {
                console.error('Error adding task:', error);
                setError('Failed to add task');
            });
    };

    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {(userRole === 'admin' || userRole === 'teamlead') && (
                <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="Enter task name"
                />
            )}
            {(userRole === 'admin' || userRole === 'teamlead') && (
                <button onClick={handleAddTask}>Add Task</button>
            )}
            <select onChange={(e) => setFilter(e.target.value)} value={filter}>
                <option value="All">All</option>
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
            </select>

            <DragDropContext onDragEnd={handleDragEnd}>
                {['To Do', 'In Progress', 'Done'].map((status) => {
                    const tasksByStatus = tasks
                        .filter(task => task.status === status)
                        .filter(task => filter === 'All' || task.status === filter); // Додаємо фільтрацію

                    return (
                        <div key={status}>
                            <h3>{status}</h3>
                            <Droppable droppableId={status} isDropDisabled={userRole !== 'admin' && userRole !== 'teamlead'}>
                                {(provided) => (
                                    <ul ref={provided.innerRef} {...provided.droppableProps} className="task-list">
                                        {tasksByStatus.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id.toString()} index={index}>
                                                {(provided) => (
                                                    <li ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="task-item">
                                                        {editingTask === task.id ? (
                                                            <input type="text" value={editedTaskName} onChange={(e) => setEditedTaskName(e.target.value)} />
                                                        ) : (
                                                            <span>{task.name}</span>
                                                        )}
                                                        {(userRole === 'admin' || userRole === 'teamlead') && (
                                                            <>
                                                                {editingTask === task.id ? (
                                                                    <button onClick={() => handleSaveTask(task.id)}>Save</button>
                                                                ) : (
                                                                    <button onClick={() => handleEditTask(task.id, task.name)}>Edit</button>
                                                                )}
                                                                <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
                                                            </>
                                                        )}
                                                    </li>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </ul>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </DragDropContext>
        </div>
    );
};

export default TaskBoard;
