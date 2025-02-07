import {create} from "zustand";

const useStore = create((set) => ({
    projects: [],
    addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
    editProject: (updatedProject) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === updatedProject.id ? updatedProject : project
        ),
    })),
    deleteProject: (id) => set((state) => ({
        projects: state.projects.filter((project) => project.id !== id),
    })),
    addTaskToProject: (projectId, task) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === projectId ? { ...project, tasks: [...project.tasks, task] } : project
        ),
    })),
    deleteTaskFromProject: (projectId, taskId) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === projectId
                ? { ...project, tasks: project.tasks.filter(task => task.id !== taskId) }
                : project
        ),
    })),
    updateTaskStatus: (projectId, taskId, newStatus) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === projectId
                ? {
                    ...project,
                    tasks: project.tasks.map((task) =>
                        task.id === taskId ? { ...task, status: newStatus } : task
                    )
                }
                : project
        ),
    })),
    editTask: (projectId, taskId, newName) => set((state) => ({
        projects: state.projects.map((project) =>
            project.id === projectId
                ? {
                    ...project,
                    tasks: project.tasks.map((task) =>
                        task.id === taskId ? { ...task, name: newName } : task
                    )
                }
                : project
        ),
    })),
}));

export default useStore;
