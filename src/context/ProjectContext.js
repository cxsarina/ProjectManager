import React, { createContext, useContext, useState } from 'react';

const ProjectContext = createContext();

export const useProjectContext = () => {
    return useContext(ProjectContext);
};

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const addProject = (project) => setProjects((prev) => [...prev, { ...project, tasks: [] }]);
    const deleteProject = (id) => setProjects((prev) => prev.filter((project) => project.id !== id));
    const editProject = (updatedProject) => {
        setProjects((prev) =>
            prev.map((project) =>
                project.id === updatedProject.id ? updatedProject : project
            )
        );
    };

    const addTask = (projectId, task) => {
        setProjects((prev) =>
            prev.map((project) =>
                project.id === projectId
                    ? { ...project, tasks: [...project.tasks, task] }
                    : project
            )
        );
    };

    const updateTaskStatus = (projectId, taskId, status) => {
        setProjects((prev) =>
            prev.map((project) =>
                project.id === projectId
                    ? {
                        ...project,
                        tasks: project.tasks.map((task) =>
                            task.id === taskId ? { ...task, status } : task
                        ),
                    }
                    : project
            )
        );
    };

    const deleteTask = (projectId, taskId) => {
        setProjects((prev) =>
            prev.map((project) =>
                project.id === projectId
                    ? {
                        ...project,
                        tasks: project.tasks.filter((task) => task.id !== taskId),
                    }
                    : project
            )
        );
    };

    return (
        <ProjectContext.Provider
            value={{
                projects,
                addProject,
                deleteProject,
                editProject,
                addTask,
                updateTaskStatus,
                deleteTask,
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};
