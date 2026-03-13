import { Modal, TextInput, PasswordInput, Button, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { createAdmin } from "../helpers";

export const NewAdminModal = ({ opened, onClose, onCreated }) => {
  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: {
      username: (v) => (v.trim().length < 3 ? "Username must be at least 3 characters" : null),
      password: (v) => (v.length < 6 ? "Password must be at least 6 characters" : null),
    },
  });

  const handleSubmit = async (values) => {
    try {
      await createAdmin({ username: values.username, password: values.password });
      notifications.show({ title: "Admin created", message: `@${values.username} is now an admin`, color: "teal" });
      form.reset();
      onCreated?.();
      onClose();
    } catch (err) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Create New Admin" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="sm">
          <TextInput label="Username" placeholder="admin_username" {...form.getInputProps("username")} />
          <PasswordInput label="Password" placeholder="Password" {...form.getInputProps("password")} />
          <Button type="submit" mt="xs">Create Admin</Button>
        </Stack>
      </form>
    </Modal>
  );
};
