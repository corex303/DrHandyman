'use client';

import React, { useEffect, useState } from 'react';
import {
  getCalendarTasks,
  createCalendarTask,
  updateCalendarTask,
  deleteCalendarTask,
} from '@/lib/service-fusion/client';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner,
  Checkbox,
  Textarea,
} from '@nextui-org/react';
import { CalendarTask, CalendarTaskBody } from 'service-fusion';

export default function ServiceFusionCalendarTasksPage() {
  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);

  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const tasksData = await getCalendarTasks();
      setTasks(tasksData || []);
    } catch (err) {
      setError('Failed to fetch calendar tasks.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = () => {
    setSelectedTask(null);
    onOpen();
  };

  const handleEdit = (task: CalendarTask) => {
    setSelectedTask(task);
    onOpen();
  };

  const handleDelete = async (taskId: number) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteCalendarTask(taskId);
        fetchTasks(); // Refresh list
      } catch (err) {
        alert('Failed to delete task.');
        console.error(err);
      }
    }
  };

  const handleFormSubmit = async (formData: CalendarTaskBody) => {
    try {
      if (selectedTask) {
        await updateCalendarTask(selectedTask.id, formData);
      } else {
        await createCalendarTask(formData);
      }
      fetchTasks();
      onOpenChange(); // Close modal
    } catch (err) {
      alert(`Failed to ${selectedTask ? 'update' : 'create'} task.`);
      console.error(err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Service Fusion Calendar Tasks</h1>
          <Button color="primary" onClick={handleCreate}>
            Create Task
          </Button>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center">
              <Spinner label="Loading tasks..." />
            </div>
          ) : error ? (
            <p className="text-danger">{error}</p>
          ) : (
            <Table aria-label="Service Fusion Calendar Tasks Table">
              <TableHeader>
                <TableColumn>TITLE</TableColumn>
                <TableColumn>DESCRIPTION</TableColumn>
                <TableColumn>START TIME</TableColumn>
                <TableColumn>END TIME</TableColumn>
                <TableColumn>ALL DAY</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody items={tasks}>
                {(item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.start_time ? new Date(item.start_time).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{item.end_time ? new Date(item.end_time).toLocaleString() : 'N/A'}</TableCell>
                    <TableCell>{item.is_all_day ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" color="primary" onClick={() => handleEdit(item)}>
                          Edit
                        </Button>
                        <Button size="sm" color="danger" onClick={() => handleDelete(item.id)}>
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <CalendarTaskFormModal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        task={selectedTask}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

// Form Modal
interface CalendarTaskFormModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
  task: CalendarTask | null;
  onSubmit: (data: CalendarTaskBody) => void;
}

function CalendarTaskFormModal({
  isOpen,
  onOpenChange,
  task,
  onSubmit,
}: CalendarTaskFormModalProps) {
  const [formData, setFormData] = useState<Partial<CalendarTaskBody>>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    is_all_day: false,
  });

  useEffect(() => {
    if (task) {
        // Format dates for datetime-local input
        const formatDateTimeLocal = (isoString: string | undefined) => {
            if (!isoString) return '';
            const date = new Date(isoString);
            // Adjust for timezone offset
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - timezoneOffset);
            return localDate.toISOString().slice(0, 16);
        };
      setFormData({
        title: task.title,
        description: task.description ?? '',
        start_time: formatDateTimeLocal(task.start_time),
        end_time: formatDateTimeLocal(task.end_time),
        is_all_day: task.is_all_day ?? false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        is_all_day: false,
      });
    }
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
        alert('Title is required.');
        return;
    }
    // Convert local datetime back to ISO string for the API
    const apiData = {
        ...formData,
        start_time: formData.start_time ? new Date(formData.start_time).toISOString() : undefined,
        end_time: formData.end_time ? new Date(formData.end_time).toISOString() : undefined,
    };
    onSubmit(apiData as CalendarTaskBody);
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {task ? 'Edit Task' : 'Create New Task'}
            </ModalHeader>
            <form onSubmit={handleSubmit}>
              <ModalBody>
                <Input
                  isRequired
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                />
                <Textarea
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
                <Input
                  label="Start Time"
                  name="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={handleChange}
                  isDisabled={formData.is_all_day}
                />
                <Input
                  label="End Time"
                  name="end_time"
                  type="datetime-local"
                  value={formData.end_time}
                  onChange={handleChange}
                  isDisabled={formData.is_all_day}
                />
                <Checkbox
                  name="is_all_day"
                  isSelected={formData.is_all_day}
                  onChange={handleChange}
                >
                  All Day Event
                </Checkbox>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onClick={onClose}>
                  Cancel
                </Button>
                <Button color="primary" type="submit">
                  {task ? 'Save Changes' : 'Create Task'}
                </Button>
              </ModalFooter>
            </form>
          </>
        )}
      </ModalContent>
    </Modal>
  );
} 