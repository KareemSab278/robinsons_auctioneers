import {
  Container,
  Paper,
  Tabs,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Title,
  Text,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { IconUser, IconMail, IconLock, IconGavel } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { login, register, adminLogin, bootstrapAdmin } from '../helpers';

export {LoginPage};

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (val) => (val.trim().length < 1 ? 'Username is required' : null),
      password: (val) => (val.length < 1 ? 'Password is required' : null),
    },
  });

  const registerForm = useForm({
    initialValues: { username: '', email: '', password: '', confirmPassword: '' },
    validate: {
      username: (val) =>
        val.trim().length < 2 ? 'Username must be at least 2 characters' : null,
      email: (val) => (/^\S+@\S+\.\S+$/.test(val) ? null : 'Invalid email'),
      password: (val) =>
        val.length < 6 ? 'Password must be at least 6 characters' : null,
      confirmPassword: (val, values) =>
        val !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleLogin = loginForm.onSubmit(async (values) => {
    console.log("[login] submitting", values);
    try {
      const userData = await login(values);
      console.log("[login] response", userData);
      signIn(userData);
      notifications.show({
        title: 'Welcome back!',
        message: `Signed in as ${userData.username}`,
        color: 'teal',
      });
      navigate('/');
    } catch (err) {
      console.error("[login] error", err);
      notifications.show({ title: 'Login failed', message: err.message, color: 'red' });
    }
  });

  const handleRegister = registerForm.onSubmit(async (values) => {
    const { confirmPassword, ...data } = values;
    console.log("[register] submitting", data);
    try {
      const userData = await register(data);
      console.log("[register] response", userData);
      signIn(userData);
      notifications.show({
        title: 'Account created!',
        message: "Welcome to Robinson's Auctioneers",
        color: 'teal',
      });
      navigate('/');
    } catch (err) {
      console.error("[register] error", err);
      notifications.show({
        title: 'Registration failed',
        message: err.message,
        color: 'red',
      });
    }
  });

  const adminForm = useForm({
    initialValues: { username: '', password: '' },
    validate: {
      username: (val) => (val.trim().length < 1 ? 'Username is required' : null),
      password: (val) => (val.length < 1 ? 'Password is required' : null),
    },
  });

  const handleAdminLogin = adminForm.onSubmit(async (values) => {
    try {
      const envUser = import.meta.env.VITE_ADMIN_USERNAME;
      const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
      if (values.username === envUser && values.password === envPass) {
        await bootstrapAdmin(values).catch(() => {});
      }
      const userData = await adminLogin(values);
      signIn(userData);
      notifications.show({
        title: 'Welcome, Admin',
        message: `Signed in as ${userData.username}`,
        color: 'teal',
      });
      navigate('/admin');
    } catch (err) {
      notifications.show({ title: 'Admin login failed', message: err.message, color: 'red' });
    }
  });

  return (
    <Container size={420} pt={60}>
      <Stack align="center" mb="xl" gap="xs">
        <IconGavel size={44} color="var(--mantine-color-teal-5)" />
        <Title order={2}>Robinson's Auctioneers</Title>
        <Text c="dimmed" size="sm">
          Sign in or create an account to start bidding
        </Text>
      </Stack>

      <Paper withBorder shadow="md" p="xl" radius="md">
        <Tabs defaultValue="login">
          <Tabs.List grow mb="xl">
            <Tabs.Tab value="login">Sign In</Tabs.Tab>
            <Tabs.Tab value="register">Register</Tabs.Tab>
            <Tabs.Tab value="admin">Admin</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="login">
            <form onSubmit={handleLogin}>
              <Stack gap="sm">
                <TextInput
                  label="Username"
                  placeholder="your_username"
                  leftSection={<IconUser size={16} />}
                  {...loginForm.getInputProps('username')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  leftSection={<IconLock size={16} />}
                  {...loginForm.getInputProps('password')}
                />
                <Button type="submit" fullWidth mt="xs">
                  Sign In
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="register">
            <form onSubmit={handleRegister}>
              <Stack gap="sm">
                <TextInput
                  label="Username"
                  placeholder="your_username"
                  leftSection={<IconUser size={16} />}
                  {...registerForm.getInputProps('username')}
                />
                <TextInput
                  label="Email"
                  placeholder="you@example.com"
                  leftSection={<IconMail size={16} />}
                  {...registerForm.getInputProps('email')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  leftSection={<IconLock size={16} />}
                  {...registerForm.getInputProps('password')}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  leftSection={<IconLock size={16} />}
                  {...registerForm.getInputProps('confirmPassword')}
                />
                <Button type="submit" fullWidth mt="xs">
                  Create Account
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>

          <Tabs.Panel value="admin">
            <form onSubmit={handleAdminLogin}>
              <Stack gap="sm">
                <TextInput
                  label="Admin Username"
                  placeholder="admin_username"
                  leftSection={<IconUser size={16} />}
                  {...adminForm.getInputProps('username')}
                />
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  leftSection={<IconLock size={16} />}
                  {...adminForm.getInputProps('password')}
                />
                <Button type="submit" fullWidth mt="xs" color="teal">
                  Admin Sign In
                </Button>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Container>
  );
}
