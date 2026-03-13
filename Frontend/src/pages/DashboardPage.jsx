import {
  Container,
  Title,
  Text,
  Tabs,
  Button,
  Table,
  Badge,
  Group,
  Stack,
  Center,
  Loader,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconDots, IconEdit, IconTrash, IconGavel } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserAuctions, getUserWonAuctions, deleteAuction } from '../helpers';
import {CreateAuctionModal} from '../components/CreateAuctionModal';
import {EditAuctionModal} from '../components/EditAuctionModal';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../utils';
export { DashboardPage };
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myAuctions, setMyAuctions] = useState([]);
  const [wonAuctions, setWonAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false);

  const load = async () => {
    if (!user) return;
    try {
      const [auctions, won] = await Promise.all([
        getUserAuctions(user.account_id),
        getUserWonAuctions(user.account_id),
      ]);
      setMyAuctions(auctions);
      setWonAuctions(won);
    } catch (err) {
      notifications.show({ title: 'Error', message: err.message, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  if (!user) {
    return (
      <Center h="60vh">
        <Stack align="center" gap="sm">
          <Text c="dimmed">You must be signed in to view your dashboard</Text>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </Stack>
      </Center>
    );
  }

  if (loading) {
    return (
      <Center h="60vh">
        <Loader size="xl" />
      </Center>
    );
  }

  const handleDelete = async (auctionId) => {
    try {
      await deleteAuction(auctionId);
      notifications.show({ title: 'Auction deleted', message: '', color: 'teal' });
      load();
    } catch (err) {
      notifications.show({ title: 'Delete failed', message: err.message, color: 'red' });
    }
  };

  const handleEdit = (auction) => {
    setSelectedAuction(auction);
    openEdit();
  };

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="xl">
        <Stack gap={2}>
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed">Welcome back, {user.username}</Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          New Auction
        </Button>
      </Group>

      <Tabs defaultValue="my-auctions">
        <Tabs.List mb="lg">
          <Tabs.Tab value="my-auctions">My Auctions ({myAuctions.length})</Tabs.Tab>
          <Tabs.Tab value="won">Won Auctions ({wonAuctions.length})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="my-auctions">
          {myAuctions.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="sm">
                <Text c="dimmed">You haven't created any auctions yet</Text>
                <Button
                  variant="light"
                  leftSection={<IconPlus size={16} />}
                  onClick={openCreate}
                >
                  Create your first auction
                </Button>
              </Stack>
            </Center>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Title</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Current Price</Table.Th>
                  <Table.Th>End Time</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {myAuctions.map((a) => (
                  <Table.Tr key={a.auction_id}>
                    <Table.Td>
                      <Text
                        fw={500}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/auction/${a.auction_id}`)}
                      >
                        {a.title}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={a.is_active ? 'teal' : 'gray'}
                        variant="light"
                        size="sm"
                      >
                        {a.is_active ? 'Active' : 'Ended'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {formatPrice(a.current_price ?? a.starting_price)}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(a.end_time).toLocaleString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" position="bottom-end">
                        <Menu.Target>
                          <ActionIcon variant="subtle" size="sm">
                            <IconDots size={15} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconGavel size={15} />}
                            onClick={() => navigate(`/auction/${a.auction_id}`)}
                          >
                            View
                          </Menu.Item>
                          {a.is_active && (
                            <Menu.Item
                              leftSection={<IconEdit size={15} />}
                              onClick={() => handleEdit(a)}
                            >
                              Edit
                            </Menu.Item>
                          )}
                          {a.is_active && (
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size={15} />}
                              onClick={() => handleDelete(a.auction_id)}
                            >
                              Delete
                            </Menu.Item>
                          )}
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="won">
          {wonAuctions.length === 0 ? (
            <Center py="xl">
              <Text c="dimmed">You haven't won any auctions yet</Text>
            </Center>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Auction</Table.Th>
                  <Table.Th>Winning Bid</Table.Th>
                  <Table.Th>Won At</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {wonAuctions.map((w) => (
                  <Table.Tr key={w.win_id}>
                    <Table.Td>
                      <Text
                        fw={500}
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/auction/${w.auction_id}`)}
                      >
                        Auction #{w.auction_id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={700} c="teal">
                        {formatPrice(w.winning_bid)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(w.won_time).toLocaleString()}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Tabs.Panel>
      </Tabs>

      <CreateAuctionModal
        opened={createOpened}
        onClose={closeCreate}
        onCreated={load}
      />
      <EditAuctionModal
        opened={editOpened}
        onClose={closeEdit}
        auction={selectedAuction}
        onUpdated={load}
      />
    </Container>
  );
}
