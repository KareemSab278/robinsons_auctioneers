import { Group, Button, Text, ActionIcon, useMantineColorScheme, Avatar, Menu } from '@mantine/core';
import {
  IconSun,
  IconMoon,
  IconGavel,
  IconLogout,
  IconLayoutDashboard,
  IconShieldHalf,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export { Navbar };
const Navbar = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  return (
    <Group h="100%" px="md" justify="space-between">
      <Group gap="xs" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <IconGavel size={26} color="var(--mantine-color-teal-5)" />
        <Text fw={700} size="lg" c="teal" visibleFrom="xs">
          Robinson's Auctioneers
        </Text>
      </Group>

      <Group gap="xs">
        <Button
          variant={isActive('/') ? 'light' : 'subtle'}
          size="sm"
          onClick={() => navigate('/')}
        >
          Auctions
        </Button>

        {user && (
          <Button
            variant={isActive('/dashboard') ? 'light' : 'subtle'}
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        )}

        {user?.is_admin && (
          <Button
            variant={isActive('/admin') ? 'light' : 'subtle'}
            size="sm"
            leftSection={<IconShieldHalf size={15} />}
            onClick={() => navigate('/admin')}
          >
            Admin
          </Button>
        )}

        <ActionIcon
          variant="subtle"
          size="lg"
          onClick={() => toggleColorScheme()}
          aria-label="Toggle colour scheme"
        >
          {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
        </ActionIcon>

        {user ? (
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <Avatar color="teal" radius="xl" size="sm" style={{ cursor: 'pointer' }}>
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{user.username}</Menu.Label>
              <Menu.Divider />
              <Menu.Item
                leftSection={<IconLayoutDashboard size={15} />}
                onClick={() => navigate('/dashboard')}
              >
                Dashboard
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconLogout size={15} />}
                onClick={handleLogout}
              >
                Sign Out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        ) : (
          <Button size="sm" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        )}
      </Group>
    </Group>
  );
}
